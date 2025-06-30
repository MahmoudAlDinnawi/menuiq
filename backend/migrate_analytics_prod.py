#!/usr/bin/env python3
"""
Production migration script for analytics tables
Safe to run multiple times - only creates tables if they don't exist
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Load appropriate environment
env_file = '.env.production' if os.path.exists('.env.production') else '.env'
load_dotenv(env_file)
print(f"📋 Using environment: {env_file}")

# Import after loading env to ensure correct database URL
from database import engine, Base
from models import AnalyticsSession, AnalyticsPageView, AnalyticsItemClick, AnalyticsDaily

def check_existing_tables():
    """Check which analytics tables already exist"""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    analytics_tables = [t for t in existing_tables if t.startswith('analytics_')]
    return analytics_tables

def migrate_analytics():
    """Create analytics tables in production"""
    print("🚀 Starting analytics migration...")
    
    # Check existing tables
    existing = check_existing_tables()
    if existing:
        print(f"ℹ️  Found existing analytics tables: {', '.join(existing)}")
    
    # Define analytics tables
    analytics_models = [
        AnalyticsSession,
        AnalyticsPageView,
        AnalyticsItemClick,
        AnalyticsDaily
    ]
    
    tables_to_create = []
    for model in analytics_models:
        if model.__tablename__ not in existing:
            tables_to_create.append(model.__table__)
            print(f"📊 Will create table: {model.__tablename__}")
        else:
            print(f"✓ Table already exists: {model.__tablename__}")
    
    if not tables_to_create:
        print("✅ All analytics tables already exist!")
        return
    
    # Create only missing tables
    try:
        Base.metadata.create_all(bind=engine, tables=tables_to_create)
        print("✅ Analytics tables created successfully!")
        
        # Verify creation
        new_existing = check_existing_tables()
        created = [t for t in new_existing if t not in existing and t.startswith('analytics_')]
        if created:
            print(f"📊 Successfully created: {', '.join(created)}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Safety check
    if len(sys.argv) > 1 and sys.argv[1] == '--force':
        print("⚠️  Running in FORCE mode")
    else:
        print("⚠️  This will create analytics tables in your database.")
        print("   Existing tables will NOT be affected.")
        response = input("   Continue? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("❌ Migration cancelled.")
            sys.exit(0)
    
    migrate_analytics()
    
    print("\n📝 Next steps:")
    print("1. Set up daily aggregation cron job")
    print("2. Restart your backend service")
    print("3. Deploy frontend changes")
    print("4. Visit your menu to generate analytics data")