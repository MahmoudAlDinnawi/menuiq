"""
Inspect database schema to understand exact structure
"""
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production')

# Database connection
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "menuiq_production")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def inspect_schema():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cur = conn.cursor()
    
    tables = ['tenants', 'users', 'categories', 'menu_items', 'settings', 'allergen_icons', 'item_allergens']
    
    for table in tables:
        print(f"\n{'='*50}")
        print(f"TABLE: {table}")
        print('='*50)
        
        # Get column information
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, (table,))
        
        columns = cur.fetchall()
        for col in columns:
            print(f"  {col[0]:<30} {col[1]:<20} {'NULL' if col[2] == 'YES' else 'NOT NULL':<10} {col[3] or ''}")
        
        # Get indexes
        cur.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = %s
        """, (table,))
        
        indexes = cur.fetchall()
        if indexes:
            print("\n  Indexes:")
            for idx in indexes:
                print(f"    {idx[0]}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_schema()