#!/usr/bin/env python3
"""
Add show_include_vat field to settings table
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

# Create engine
engine = create_engine(DATABASE_URL)

# SQL command to add show_include_vat field
sql_command = """
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS show_include_vat BOOLEAN DEFAULT TRUE;
"""

print("🔧 Adding show_include_vat field to settings table...")

with engine.connect() as conn:
    try:
        conn.execute(text(sql_command))
        conn.commit()
        print("✅ Successfully added show_include_vat field")
    except Exception as e:
        print(f"⚠️  Error executing migration: {e}")

print("\n✅ Migration complete!")