#!/usr/bin/env python3
"""
Migration script to add show_all_category field to settings table
"""
import os
import sys
from sqlalchemy import text

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def add_show_all_category_field():
    """Add show_all_category field to settings table"""
    
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='settings' AND column_name='show_all_category'
            """))
            
            if result.fetchone():
                print("Column 'show_all_category' already exists in settings table")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE settings 
                ADD COLUMN show_all_category BOOLEAN DEFAULT TRUE
            """))
            conn.commit()
            
            print("✓ Successfully added 'show_all_category' column to settings table")
            
        except Exception as e:
            print(f"Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    print("Starting migration to add show_all_category field...")
    add_show_all_category_field()
    print("Migration completed successfully!")