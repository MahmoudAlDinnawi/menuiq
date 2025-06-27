"""
Check the actual database schema to create models that match exactly
"""
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.production' if os.getenv('ENVIRONMENT') == 'production' else '.env')

# Database connection from environment
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "menuiq_production")
DB_USER = os.getenv("DB_USER", "menuiq_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_PORT = os.getenv("DB_PORT", "5432")

def check_schema():
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cur = conn.cursor()
        
        # Tables to check
        tables = ['tenants', 'users', 'categories', 'menu_items', 'settings', 'allergen_icons', 'item_allergens']
        
        schema_info = {}
        
        for table in tables:
            print(f"\n{'='*60}")
            print(f"TABLE: {table}")
            print('='*60)
            
            # Get column information
            cur.execute("""
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position
            """, (table,))
            
            columns = cur.fetchall()
            table_columns = []
            
            for col in columns:
                col_name, data_type, nullable, default, max_length = col
                print(f"  {col_name:<30} {data_type:<15} {'NULL' if nullable == 'YES' else 'NOT NULL':<10}")
                table_columns.append({
                    'name': col_name,
                    'type': data_type,
                    'nullable': nullable == 'YES',
                    'default': default,
                    'max_length': max_length
                })
            
            schema_info[table] = table_columns
            
            # Check for foreign keys
            cur.execute("""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = %s
            """, (table,))
            
            fks = cur.fetchall()
            if fks:
                print("\n  Foreign Keys:")
                for fk in fks:
                    print(f"    {fk[0]} -> {fk[1]}.{fk[2]}")
        
        cur.close()
        conn.close()
        
        return schema_info
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    schema_info = check_schema()
    
    # Generate model suggestions
    if schema_info:
        print("\n\n" + "="*60)
        print("SUGGESTED MODEL DEFINITIONS")
        print("="*60)
        
        # Map PostgreSQL types to SQLAlchemy types
        type_mapping = {
            'integer': 'Integer',
            'character varying': 'String',
            'text': 'Text',
            'boolean': 'Boolean',
            'timestamp without time zone': 'DateTime',
            'double precision': 'Float',
            'numeric': 'Float',
            'smallint': 'Integer'
        }
        
        for table, columns in schema_info.items():
            print(f"\n# {table} table")
            print(f"class {table.title().replace('_', '')}(Base):")
            print(f'    __tablename__ = "{table}"')
            print()
            
            for col in columns:
                col_type = type_mapping.get(col['type'], 'String')
                if col_type == 'String' and col['max_length']:
                    col_type = f"String({col['max_length']})"
                
                nullable = ", nullable=False" if not col['nullable'] else ""
                primary_key = ", primary_key=True" if col['name'] == 'id' else ""
                
                print(f"    {col['name']} = Column({col_type}{primary_key}{nullable})")