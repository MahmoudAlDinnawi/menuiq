"""Add website_url column to settings table"""
from sqlalchemy import create_engine, text
from database import engine

def add_website_url_column():
    # Use the existing engine from database.py
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='settings' 
            AND column_name='website_url'
        """))
        
        if not result.fetchone():
            # Add the column if it doesn't exist
            conn.execute(text("""
                ALTER TABLE settings 
                ADD COLUMN website_url VARCHAR(255)
            """))
            conn.commit()
            print("Added website_url column to settings table")
        else:
            print("website_url column already exists")

if __name__ == "__main__":
    add_website_url_column()