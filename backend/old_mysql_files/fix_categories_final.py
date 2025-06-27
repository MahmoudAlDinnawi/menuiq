#!/usr/bin/env python3
"""
Comprehensive fix for categories table constraints
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production')

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

# Create engine
engine = create_engine(DATABASE_URL)

print("Fixing categories table constraints...")

with engine.connect() as conn:
    # First, let's see what constraints exist
    result = conn.execute(text("SHOW INDEX FROM categories"))
    print("\nCurrent indexes:")
    for row in result:
        print(f"  - {row[2]} on column {row[4]}")
    
    # Get the constraint name for the value column
    result = conn.execute(text("""
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'categories' 
        AND COLUMN_NAME = 'value' 
        AND TABLE_SCHEMA = 'menuiq_production'
    """))
    
    constraints_to_drop = []
    for row in result:
        constraints_to_drop.append(row[0])
    
    # Drop all unique constraints on value column
    for constraint in constraints_to_drop:
        try:
            print(f"\nDropping constraint: {constraint}")
            conn.execute(text(f"ALTER TABLE categories DROP INDEX {constraint}"))
            conn.commit()
            print(f"  - Dropped {constraint}")
        except Exception as e:
            print(f"  - Could not drop {constraint}: {e}")
    
    # Also try common constraint names
    common_names = ['value', 'idx_value', 'categories_value_key', 'uc_value', 'unique_value']
    for name in common_names:
        try:
            conn.execute(text(f"ALTER TABLE categories DROP INDEX {name}"))
            conn.commit()
            print(f"  - Dropped {name}")
        except:
            pass
    
    # Now add the correct composite unique constraint
    try:
        print("\nAdding composite unique constraint (tenant_id, value)...")
        conn.execute(text("""
            ALTER TABLE categories 
            ADD UNIQUE INDEX idx_tenant_value (tenant_id, value)
        """))
        conn.commit()
        print("  - Success!")
    except Exception as e:
        print(f"  - Warning: {e}")
    
    # Verify the changes
    print("\nFinal indexes:")
    result = conn.execute(text("SHOW INDEX FROM categories"))
    for row in result:
        print(f"  - {row[2]} on column {row[4]}")

print("\nDone! Categories should now allow duplicate values across different tenants.")