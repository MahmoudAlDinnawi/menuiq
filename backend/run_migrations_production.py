#!/usr/bin/env python3
"""
Run all pending migrations for production deployment
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment from .env file
load_dotenv('.env')

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

print(f"🔧 Running migrations on database...")
print(f"📍 Database URL: {DATABASE_URL.split('@')[1]}")  # Show host/db without password

# Create engine
engine = create_engine(DATABASE_URL)

# List of migrations to run
migrations = [
    {
        "name": "SEO fields",
        "sql": [
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255);",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_title_ar VARCHAR(255);",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_description_en TEXT;",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_keywords_en TEXT;",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_keywords_ar TEXT;",
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500);"
        ]
    },
    {
        "name": "Show Include VAT field",
        "sql": [
            "ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_include_vat BOOLEAN DEFAULT TRUE;"
        ]
    },
    {
        "name": "Dashboard Logo URL field",
        "sql": [
            "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dashboard_logo_url VARCHAR(500);"
        ]
    }
]

# Run migrations
try:
    with engine.connect() as conn:
        for migration in migrations:
            print(f"\n📋 Running migration: {migration['name']}")
            for sql in migration['sql']:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"  ✅ {sql[:60]}...")
                except Exception as e:
                    print(f"  ⚠️  {sql[:60]}... - {str(e)}")

    print("\n✅ All migrations completed!")
    print("\n📝 Next steps:")
    print("1. Restart the backend service: sudo systemctl restart menuiq")
    print("2. Check service status: sudo systemctl status menuiq")
    print("3. Check logs if needed: sudo journalctl -u menuiq -f")
    
except Exception as e:
    print(f"\n❌ Error connecting to database: {e}")
    print("\nPlease check:")
    print("1. PostgreSQL is running: sudo systemctl status postgresql")
    print("2. Database exists: sudo -u postgres psql -l")
    print("3. User has access: sudo -u postgres psql -c '\\du'")