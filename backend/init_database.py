#!/usr/bin/env python3
"""
Initialize database tables for MenuIQ
"""

from database import engine, Base
from models_multitenant import *
import os
from dotenv import load_dotenv

load_dotenv()

def init_database():
    """Create all tables in the database"""
    print("🚀 Initializing MenuIQ Database")
    print("=" * 50)
    
    # Import all models to ensure they're registered
    print("✅ Models loaded")
    
    # Create all tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ All tables created successfully!")
    
    # List created tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("\nCreated tables:")
    for table in tables:
        print(f"  - {table}")
    
    print("\n✅ Database initialization complete!")
    print("\nNext steps:")
    print("1. Run the migration: python migrate_to_multitenant.py")
    print("2. Start the server: python main_mysql.py")

if __name__ == "__main__":
    init_database()