#!/bin/bash

# Analytics Update Deployment Script
# Run this on the production server after pulling the latest code

echo "🚀 Deploying Analytics Updates..."

# 1. Ensure we're in the backend directory
cd /path/to/menuiq/backend

# 2. Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# 3. Update database schema
echo "🗄️ Updating database schema..."
python -c "
from sqlalchemy import create_engine, text
from database import engine

sql_commands = [
    # Add device columns to analytics_sessions
    'ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS city VARCHAR(100);',
    'ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_brand VARCHAR(50);',
    'ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);',
    'ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_full_name VARCHAR(150);',
    
    # Add missing columns to analytics_daily
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS avg_pages_per_session FLOAT DEFAULT 0;',
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS top_categories JSONB;',
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS top_items JSONB;',
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS hourly_distribution JSONB;',
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
    'ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
    
    # Add indexes
    'CREATE INDEX IF NOT EXISTS idx_device_details ON analytics_sessions(device_brand, device_model);'
]

with engine.connect() as conn:
    for sql in sql_commands:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f'✅ {sql[:50]}...')
        except Exception as e:
            print(f'⚠️  {e}')

print('✅ Database schema updated!')
"

# 4. Run aggregation for today
echo "📊 Running analytics aggregation for today..."
python aggregate_analytics.py --today

# 5. Restart the service
echo "🔄 Restarting MenuIQ service..."
sudo systemctl restart menuiq

# 6. Check service status
echo "✅ Checking service status..."
sudo systemctl status menuiq --no-pager

echo "🎉 Analytics update deployed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "  - Enhanced device detection (shows iPhone, Samsung, etc.)"
echo "  - Fixed device data collection"
echo "  - Added device details API endpoint"
echo "  - Improved analytics dashboard"
echo ""
echo "🔍 Verify deployment:"
echo "  1. Check analytics page shows device breakdown"
echo "  2. Device details table shows specific models"
echo "  3. Real-time data updates correctly"