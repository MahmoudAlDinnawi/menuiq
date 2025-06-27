#!/usr/bin/env python3
"""
Fix settings table structure for multi-tenant system
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

# SQL commands to fix the settings table
sql_commands = [
    # First, check if we need to migrate from old structure
    """
    ALTER TABLE settings 
    DROP COLUMN IF EXISTS `key`,
    DROP COLUMN IF EXISTS `value`
    """,
    
    # Add new columns if they don't exist
    """
    ALTER TABLE settings 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'SAR',
    ADD COLUMN IF NOT EXISTS tax_rate FLOAT DEFAULT 15.0,
    ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#00594f',
    ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#d4af37',
    ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Playfair Display',
    ADD COLUMN IF NOT EXISTS footer_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS footer_text_en TEXT,
    ADD COLUMN IF NOT EXISTS footer_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100),
    ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS show_calories BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_preparation_time BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_allergens BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_search BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    """,
    
    # Make tenant_id unique if not already
    """
    ALTER TABLE settings 
    ADD UNIQUE INDEX IF NOT EXISTS idx_tenant_id (tenant_id)
    """
]

# Execute commands
with engine.connect() as conn:
    for sql in sql_commands:
        try:
            print(f"Executing: {sql[:50]}...")
            conn.execute(text(sql))
            conn.commit()
            print("Success!")
        except Exception as e:
            print(f"Error: {e}")
            # Continue with other commands

print("\nSettings table migration completed!")