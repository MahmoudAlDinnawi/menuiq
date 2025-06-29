"""
Migration script to add caffeine_mg and vitamin_d fields to menu_items table
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

print(f"Connecting to database...")

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'menu_items' 
            AND column_name IN ('caffeine_mg', 'vitamin_d')
        """))
        
        existing_columns = [row[0] for row in result]
        
        # Add caffeine_mg column if it doesn't exist
        if 'caffeine_mg' not in existing_columns:
            print("Adding caffeine_mg column...")
            conn.execute(text("""
                ALTER TABLE menu_items 
                ADD COLUMN caffeine_mg INTEGER DEFAULT NULL
            """))
            conn.commit()
            print("✓ Added caffeine_mg column")
        else:
            print("✓ caffeine_mg column already exists")
        
        # Add vitamin_d column if it doesn't exist
        if 'vitamin_d' not in existing_columns:
            print("Adding vitamin_d column...")
            conn.execute(text("""
                ALTER TABLE menu_items 
                ADD COLUMN vitamin_d INTEGER DEFAULT NULL
            """))
            conn.commit()
            print("✓ Added vitamin_d column")
        else:
            print("✓ vitamin_d column already exists")
        
        print("\nMigration completed successfully!")
        
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)