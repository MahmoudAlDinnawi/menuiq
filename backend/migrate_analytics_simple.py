#!/usr/bin/env python3
"""
Simple analytics migration script that handles database connection issues
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load environment - production server uses .env
env_file = '.env'
load_dotenv(env_file)

def get_db_config():
    """Get database configuration from environment"""
    db_url = os.getenv('DATABASE_URL')
    
    if db_url:
        # Parse DATABASE_URL
        # Format: postgresql://user:password@host:port/dbname
        if db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', '')
        elif db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', '')
            
        # Split credentials and host
        if '@' in db_url:
            creds, host_db = db_url.split('@')
            if ':' in creds:
                user, password = creds.split(':', 1)
            else:
                user, password = creds, None
                
            # Split host and database
            if '/' in host_db:
                host_port, dbname = host_db.split('/', 1)
                if ':' in host_port:
                    host, port = host_port.split(':')
                else:
                    host, port = host_port, '5432'
            else:
                host, port, dbname = host_db, '5432', 'menuiq'
        else:
            raise ValueError("Invalid DATABASE_URL format")
            
        return {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'dbname': dbname
        }
    else:
        # Use individual environment variables
        return {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', ''),
            'dbname': os.getenv('DB_NAME', 'menuiq')
        }

def check_and_create_database(config):
    """Check if database exists and create if needed"""
    # Connect to postgres database to check/create our database
    postgres_config = config.copy()
    postgres_config['dbname'] = 'postgres'
    
    try:
        conn = psycopg2.connect(**postgres_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (config['dbname'],)
        )
        exists = cur.fetchone()
        
        if not exists:
            print(f"❌ Database '{config['dbname']}' does not exist!")
            response = input(f"Create database '{config['dbname']}'? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                cur.execute(f'CREATE DATABASE "{config["dbname"]}"')
                print(f"✅ Database '{config['dbname']}' created!")
            else:
                print("Cannot continue without database.")
                sys.exit(1)
        else:
            print(f"✅ Database '{config['dbname']}' exists")
            
        cur.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database connection error: {e}")
        return False

def create_analytics_tables(config):
    """Create analytics tables using raw SQL"""
    try:
        conn = psycopg2.connect(**config)
        cur = conn.cursor()
        
        # Check existing tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'analytics_%'
            ORDER BY table_name
        """)
        existing_tables = [row[0] for row in cur.fetchall()]
        
        if existing_tables:
            print(f"ℹ️  Found existing analytics tables: {', '.join(existing_tables)}")
        
        # Create analytics_sessions table
        if 'analytics_sessions' not in existing_tables:
            print("📊 Creating analytics_sessions table...")
            cur.execute("""
                CREATE TABLE analytics_sessions (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL,
                    session_id VARCHAR(100) UNIQUE NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    ended_at TIMESTAMP,
                    duration_seconds INTEGER,
                    ip_address_hash VARCHAR(64),
                    user_agent VARCHAR(500),
                    device_type VARCHAR(50),
                    browser VARCHAR(100),
                    os VARCHAR(100),
                    referrer TEXT,
                    language VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_analytics_sessions_tenant_id ON analytics_sessions(tenant_id);
                CREATE INDEX idx_analytics_sessions_started_at ON analytics_sessions(started_at);
            """)
        
        # Create analytics_page_views table
        if 'analytics_page_views' not in existing_tables:
            print("📊 Creating analytics_page_views table...")
            cur.execute("""
                CREATE TABLE analytics_page_views (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(100) NOT NULL,
                    tenant_id INTEGER NOT NULL,
                    page_type VARCHAR(50) NOT NULL,
                    category_id INTEGER,
                    item_id INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    time_on_page INTEGER,
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE SET NULL
                );
                CREATE INDEX idx_analytics_page_views_session_id ON analytics_page_views(session_id);
                CREATE INDEX idx_analytics_page_views_tenant_id ON analytics_page_views(tenant_id);
                CREATE INDEX idx_analytics_page_views_timestamp ON analytics_page_views(timestamp);
            """)
        
        # Create analytics_item_clicks table
        if 'analytics_item_clicks' not in existing_tables:
            print("📊 Creating analytics_item_clicks table...")
            cur.execute("""
                CREATE TABLE analytics_item_clicks (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(100) NOT NULL,
                    tenant_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    category_id INTEGER,
                    action_type VARCHAR(50) DEFAULT 'view_details',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                );
                CREATE INDEX idx_analytics_item_clicks_session_id ON analytics_item_clicks(session_id);
                CREATE INDEX idx_analytics_item_clicks_tenant_id ON analytics_item_clicks(tenant_id);
                CREATE INDEX idx_analytics_item_clicks_item_id ON analytics_item_clicks(item_id);
                CREATE INDEX idx_analytics_item_clicks_timestamp ON analytics_item_clicks(timestamp);
            """)
        
        # Create analytics_daily table
        if 'analytics_daily' not in existing_tables:
            print("📊 Creating analytics_daily table...")
            cur.execute("""
                CREATE TABLE analytics_daily (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL,
                    date DATE NOT NULL,
                    total_sessions INTEGER DEFAULT 0,
                    unique_visitors INTEGER DEFAULT 0,
                    total_page_views INTEGER DEFAULT 0,
                    total_item_clicks INTEGER DEFAULT 0,
                    avg_session_duration FLOAT DEFAULT 0,
                    mobile_sessions INTEGER DEFAULT 0,
                    desktop_sessions INTEGER DEFAULT 0,
                    tablet_sessions INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(tenant_id, date),
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_analytics_daily_tenant_date ON analytics_daily(tenant_id, date);
            """)
        
        conn.commit()
        
        # Verify tables were created
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'analytics_%'
            ORDER BY table_name
        """)
        final_tables = [row[0] for row in cur.fetchall()]
        
        print(f"\n✅ Analytics tables ready: {', '.join(final_tables)}")
        
        cur.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Error creating tables: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)

def main():
    print("🚀 Starting analytics migration...")
    
    # Get database configuration
    config = get_db_config()
    print(f"📋 Using database: {config['dbname']} on {config['host']}")
    
    # Check database exists
    if not check_and_create_database(config):
        print("❌ Could not connect to database")
        sys.exit(1)
    
    # Confirm before proceeding
    print("\n⚠️  This will create analytics tables in your database.")
    print("   Existing tables will NOT be affected.")
    response = input("   Continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Migration cancelled.")
        sys.exit(0)
    
    # Create tables
    create_analytics_tables(config)
    
    print("\n📝 Next steps:")
    print("1. Restart your backend service")
    print("2. Deploy frontend changes")
    print("3. Set up daily aggregation cron job")
    print("4. Visit your menu to generate analytics data")

if __name__ == "__main__":
    main()