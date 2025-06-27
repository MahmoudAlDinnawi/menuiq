#!/usr/bin/env python3
"""
Fix categories table to allow duplicate values across different tenants
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

# SQL commands to fix the categories table
sql_commands = [
    # First, drop the existing unique constraint on value
    """
    ALTER TABLE categories 
    DROP INDEX IF EXISTS value
    """,
    
    # Drop any other unique constraints on value column
    """
    ALTER TABLE categories 
    DROP INDEX IF EXISTS idx_value
    """,
    
    # Drop any other unique constraints that might exist
    """
    ALTER TABLE categories 
    DROP INDEX IF EXISTS categories_value_key
    """,
    
    # Create a composite unique index for tenant_id + value
    """
    ALTER TABLE categories 
    ADD UNIQUE INDEX idx_tenant_value (tenant_id, value)
    """,
    
    # Also ensure tenant_id column exists and is not nullable
    """
    ALTER TABLE categories 
    MODIFY COLUMN tenant_id INT NOT NULL
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

print("\nCategories table constraint fixed!")
print("Now categories can have duplicate values across different tenants.")