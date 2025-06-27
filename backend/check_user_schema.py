#!/usr/bin/env python3
"""Check the actual schema of the users table"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # For PostgreSQL
    if 'postgresql' in DATABASE_URL:
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        """))
        
        print("Users table schema (PostgreSQL):")
        print("-" * 80)
        print(f"{'Column':<20} {'Type':<20} {'Nullable':<10} {'Default':<20}")
        print("-" * 80)
        
        for row in result:
            print(f"{row[0]:<20} {row[1]:<20} {row[2]:<10} {str(row[3] or ''):<20}")
    
    # For MySQL
    elif 'mysql' in DATABASE_URL:
        result = conn.execute(text("DESCRIBE users"))
        
        print("Users table schema (MySQL):")
        print("-" * 80)
        print(f"{'Field':<20} {'Type':<20} {'Null':<10} {'Key':<10} {'Default':<20}")
        print("-" * 80)
        
        for row in result:
            print(f"{row[0]:<20} {row[1]:<20} {row[2]:<10} {row[3]:<10} {str(row[4] or ''):<20}")
    
    print("\n" + "-" * 80)
    
    # Get sample user data
    try:
        sample = conn.execute(text("SELECT * FROM users LIMIT 1")).fetchone()
        if sample:
            print("\nSample user record:")
            for i, (col, val) in enumerate(zip(result.keys(), sample)):
                print(f"  {col}: {val}")
        else:
            print("\nNo users found in database")
    except:
        pass