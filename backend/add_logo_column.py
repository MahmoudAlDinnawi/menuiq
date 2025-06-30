#!/usr/bin/env python3
"""
Add logo_url column to tenants table if it doesn't exist
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

# SQL command to add logo_url column if it doesn't exist
sql_command = "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);"

print("🔧 Adding logo_url column to tenants table...")

with engine.connect() as conn:
    try:
        conn.execute(text(sql_command))
        conn.commit()
        print("✅ Column added successfully (or already exists)")
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n✅ Migration complete!")