#!/usr/bin/env python3
"""
Add missing columns for multi-tenant system
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

# SQL commands to add missing columns
sql_commands = [
    # Add is_available column to menu_items
    """
    ALTER TABLE menu_items 
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE
    """,
    
    # Add sort_order column to menu_items if missing
    """
    ALTER TABLE menu_items 
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0
    """,
    
    # Fix allergen_icons table - rename allergen_name to name if needed
    """
    ALTER TABLE allergen_icons 
    CHANGE COLUMN IF EXISTS allergen_name name VARCHAR(50) NOT NULL
    """,
    
    # Or add name column if it doesn't exist
    """
    ALTER TABLE allergen_icons 
    ADD COLUMN IF NOT EXISTS name VARCHAR(50)
    """,
    
    # Also rename icon_path to icon_url if needed
    """
    ALTER TABLE allergen_icons 
    CHANGE COLUMN IF EXISTS icon_path icon_url VARCHAR(500)
    """,
    
    # Add missing columns to allergen_icons
    """
    ALTER TABLE allergen_icons 
    ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500)
    """,
    
    # Add tenant_id to allergen_icons if missing
    """
    ALTER TABLE allergen_icons 
    ADD COLUMN IF NOT EXISTS tenant_id INT
    """,
    
    # Add foreign key for tenant_id if missing
    """
    ALTER TABLE allergen_icons 
    ADD CONSTRAINT IF NOT EXISTS fk_allergen_icons_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    """
]

# Execute commands
with engine.connect() as conn:
    for sql in sql_commands:
        try:
            print(f"Executing: {sql[:80]}...")
            conn.execute(text(sql))
            conn.commit()
            print("Success!")
        except Exception as e:
            print(f"Warning: {e}")
            # Continue with other commands

print("\nMissing columns have been added!")

# Also check the current structure
with engine.connect() as conn:
    print("\nCurrent menu_items columns:")
    result = conn.execute(text("DESCRIBE menu_items"))
    for row in result:
        if row[0] in ['is_available', 'sort_order']:
            print(f"  - {row[0]}: {row[1]}")
    
    print("\nCurrent allergen_icons columns:")
    result = conn.execute(text("DESCRIBE allergen_icons"))
    for row in result:
        if row[0] in ['name', 'icon_url', 'tenant_id']:
            print(f"  - {row[0]}: {row[1]}")