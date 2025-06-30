#!/usr/bin/env python3
"""
Add SEO/meta tag fields to settings table
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

# SQL commands to add SEO fields
sql_commands = [
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255);",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_title_ar VARCHAR(255);",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_description_en TEXT;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_keywords_en TEXT;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_keywords_ar TEXT;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500);",  # Open Graph image for social sharing
]

print("🔧 Adding SEO fields to settings table...")

with engine.connect() as conn:
    for sql in sql_commands:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Executed: {sql[:60]}...")
        except Exception as e:
            print(f"⚠️  Error executing {sql[:60]}...: {e}")

print("\n✅ SEO fields migration complete!")