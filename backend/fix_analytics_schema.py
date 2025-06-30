#!/usr/bin/env python3
"""
Fix missing columns in analytics tables
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

# SQL commands to add missing columns
sql_commands = [
    # Add time_on_page_seconds to analytics_page_views if it doesn't exist
    "ALTER TABLE analytics_page_views ADD COLUMN IF NOT EXISTS time_on_page_seconds INTEGER DEFAULT 0;",
    
    # Add any other missing columns that might be needed
    "ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS city VARCHAR(100);",
    "ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_brand VARCHAR(50);",
    "ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);",
    "ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_full_name VARCHAR(150);",
    
    # Add missing columns to analytics_daily
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS avg_pages_per_session FLOAT DEFAULT 0;",
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS top_categories JSONB;",
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS top_items JSONB;",
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS hourly_distribution JSONB;",
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
    "ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
]

print("🔧 Fixing analytics database schema...")

with engine.connect() as conn:
    for sql in sql_commands:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Executed: {sql[:60]}...")
        except Exception as e:
            print(f"⚠️  Error executing {sql[:60]}...: {e}")

print("\n✅ Database schema fix complete!")
print("\n🚀 Now restart the service:")
print("   sudo systemctl restart menuiq")