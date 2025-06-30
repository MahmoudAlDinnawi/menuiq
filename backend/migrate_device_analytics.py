#!/usr/bin/env python3
"""
Add device detail columns to analytics tables
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env')

db_url = os.getenv('DATABASE_URL')
if db_url.startswith('postgresql://'):
    db_url = db_url.replace('postgresql://', '')
elif db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', '')

# Parse connection
user_pass, host_db = db_url.split('@')
user, password = user_pass.split(':', 1)
host_port_db = host_db.split('/', 1)

if ':' in host_port_db[0]:
    host, port = host_port_db[0].split(':')
else:
    host, port = host_port_db[0], '5432'

dbname = host_port_db[1]

try:
    conn = psycopg2.connect(
        host=host, port=port, user=user, 
        password=password, dbname=dbname
    )
    cur = conn.cursor()
    
    print("Adding device columns...")
    
    # Add columns
    for col in ['city VARCHAR(100)', 'device_brand VARCHAR(50)', 
                'device_model VARCHAR(100)', 'device_full_name VARCHAR(150)']:
        column_name = col.split()[0]
        try:
            cur.execute(f"ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS {col};")
            print(f"✓ Added {column_name}")
        except Exception as e:
            print(f"⚠️  {column_name}: {e}")
    
    # Add index
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_device_details 
        ON analytics_sessions(device_brand, device_model);
    """)
    
    conn.commit()
    print("✅ Migration complete!")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
