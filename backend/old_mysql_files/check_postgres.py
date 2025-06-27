#!/usr/bin/env python3
"""
Check PostgreSQL connection and tables
"""

import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load environment variables
env_file = '.env.postgres' if os.getenv('ENVIRONMENT') != 'production' else '.env.production.postgres'
load_dotenv(env_file)

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")

# Create engine
engine = create_engine(DATABASE_URL)

# Test connection
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print(f"PostgreSQL version: {result.scalar()}")
        print("✅ Connection successful!")
        
        # List all tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\nExisting tables: {tables}")
        
        # Check if we can create tables
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100)
            )
        """))
        conn.commit()
        print("✅ Can create tables!")
        
        # Drop test table
        conn.execute(text("DROP TABLE IF EXISTS test_table"))
        conn.commit()
        
except Exception as e:
    print(f"❌ Error: {e}")