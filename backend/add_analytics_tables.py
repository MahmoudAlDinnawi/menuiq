"""
Add analytics tables migration script

This script adds analytics tables to track user sessions, page views, and item interactions.
Run this script to create the necessary tables for the analytics feature.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production')

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/menuiq_dev")
engine = create_engine(DATABASE_URL)

def add_analytics_tables():
    """Add analytics tables to the database"""
    
    with engine.connect() as conn:
        # Create analytics_sessions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS analytics_sessions (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                session_id VARCHAR(100) UNIQUE NOT NULL,
                started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                duration_seconds INTEGER,
                ip_address_hash VARCHAR(64),
                user_agent VARCHAR(500),
                device_type VARCHAR(50),
                browser VARCHAR(50),
                os VARCHAR(50),
                referrer VARCHAR(500),
                language VARCHAR(10),
                country VARCHAR(2),
                city VARCHAR(100)
            );
        """))
        
        # Create indexes for analytics_sessions
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_sessions_tenant_id ON analytics_sessions(tenant_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);"))
        
        # Create analytics_page_views table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS analytics_page_views (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL REFERENCES analytics_sessions(session_id),
                tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                page_type VARCHAR(50),
                category_id INTEGER REFERENCES categories(id),
                item_id INTEGER REFERENCES menu_items(id),
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                time_on_page_seconds INTEGER,
                scroll_depth INTEGER
            );
        """))
        
        # Create indexes for analytics_page_views
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_page_views_session_id ON analytics_page_views(session_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_page_views_tenant_id ON analytics_page_views(tenant_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_page_views_timestamp ON analytics_page_views(timestamp);"))
        
        # Create analytics_item_clicks table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS analytics_item_clicks (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL REFERENCES analytics_sessions(session_id),
                tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                item_id INTEGER NOT NULL REFERENCES menu_items(id),
                category_id INTEGER REFERENCES categories(id),
                action_type VARCHAR(50),
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Create indexes for analytics_item_clicks
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_item_clicks_session_id ON analytics_item_clicks(session_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_item_clicks_tenant_id ON analytics_item_clicks(tenant_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_item_clicks_item_id ON analytics_item_clicks(item_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_analytics_item_clicks_timestamp ON analytics_item_clicks(timestamp);"))
        
        # Create analytics_daily table for aggregated data
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS analytics_daily (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                date DATE NOT NULL,
                total_sessions INTEGER DEFAULT 0,
                unique_visitors INTEGER DEFAULT 0,
                total_page_views INTEGER DEFAULT 0,
                total_item_clicks INTEGER DEFAULT 0,
                avg_session_duration INTEGER,
                avg_pages_per_session DECIMAL(5,2),
                mobile_sessions INTEGER DEFAULT 0,
                desktop_sessions INTEGER DEFAULT 0,
                tablet_sessions INTEGER DEFAULT 0,
                top_categories JSONB,
                top_items JSONB,
                hourly_distribution JSONB
            );
        """))
        
        # Create unique index for analytics_daily
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_tenant_date ON analytics_daily(tenant_id, date);"))
        
        conn.commit()
        print("✅ Analytics tables created successfully!")

if __name__ == "__main__":
    print("Creating analytics tables...")
    add_analytics_tables()
    print("Done!")