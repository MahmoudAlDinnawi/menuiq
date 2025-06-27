"""
Migration script to add nutrition label columns to menu_items table
Run this script to update your database schema
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost/entrecote_menu"
)

def add_nutrition_columns():
    """Add nutrition label columns to menu_items table"""
    
    engine = create_engine(DATABASE_URL)
    
    # List of columns to add with their SQL definitions
    columns_to_add = [
        ("total_fat", "FLOAT"),
        ("saturated_fat", "FLOAT"),
        ("trans_fat", "FLOAT"),
        ("cholesterol", "INTEGER"),
        ("sodium", "INTEGER"),
        ("total_carbs", "FLOAT"),
        ("dietary_fiber", "FLOAT"),
        ("sugars", "FLOAT"),
        ("protein", "FLOAT"),
        ("vitamin_a", "INTEGER"),  # % Daily Value
        ("vitamin_c", "INTEGER"),  # % Daily Value
        ("calcium", "INTEGER"),    # % Daily Value
        ("iron", "INTEGER")        # % Daily Value
    ]
    
    with engine.connect() as conn:
        # Check which columns already exist
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'menu_items' 
            AND TABLE_SCHEMA = DATABASE()
        """))
        
        existing_columns = [row[0] for row in result]
        
        # Add missing columns
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                try:
                    print(f"Adding column: {column_name}")
                    conn.execute(text(f"""
                        ALTER TABLE menu_items 
                        ADD COLUMN {column_name} {column_type} NULL
                    """))
                    conn.commit()
                    print(f"✓ Column {column_name} added successfully")
                except Exception as e:
                    print(f"✗ Error adding column {column_name}: {str(e)}")
            else:
                print(f"- Column {column_name} already exists")
        
        # Also add the allergen_icons table if it doesn't exist
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS allergen_icons (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    allergen_name VARCHAR(50) UNIQUE NOT NULL,
                    icon_path VARCHAR(500) NOT NULL,
                    display_name VARCHAR(100),
                    display_name_ar VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("\n✓ Allergen icons table created/verified")
        except Exception as e:
            print(f"\n✗ Error creating allergen_icons table: {str(e)}")

if __name__ == "__main__":
    print("Starting database migration...")
    print("-" * 50)
    
    try:
        add_nutrition_columns()
        print("\n" + "=" * 50)
        print("Migration completed successfully!")
        print("You can now restart your backend server.")
    except Exception as e:
        print(f"\nMigration failed: {str(e)}")
        print("Please check your database connection and try again.")