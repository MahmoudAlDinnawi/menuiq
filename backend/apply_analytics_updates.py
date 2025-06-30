#!/usr/bin/env python3
"""
Apply analytics updates for real-time device tracking
"""

import os
import re

# 1. Update analytics_routes.py
print("Updating analytics_routes.py...")

with open('analytics_routes.py', 'r') as f:
    content = f.read()

# Add import for re if not present
if 'import re' not in content:
    import_pos = content.find('from user_agents import parse')
    if import_pos > 0:
        end_line = content.find('\n', import_pos)
        content = content[:end_line+1] + 'import re\n' + content[end_line+1:]

# Create the enhanced device functions
device_functions = '''def get_device_type(user_agent_string: str) -> str:
    """Determine device type from user agent"""
    ua_lower = user_agent_string.lower()
    
    # Check for tablets first
    if 'ipad' in ua_lower or 'tablet' in ua_lower:
        return "tablet"
    elif 'iphone' in ua_lower or 'android' in ua_lower or 'mobile' in ua_lower:
        return "mobile"
    else:
        return "desktop"

def get_device_details(user_agent_string: str) -> dict:
    """Extract detailed device information from user agent"""
    ua = user_agent_string
    device_info = {
        'brand': 'Unknown',
        'model': 'Unknown',
        'full_name': 'Unknown Device'
    }
    
    # Apple devices
    if 'iPhone' in ua:
        device_info['brand'] = 'Apple'
        # Look for iOS version
        if 'iPhone OS ' in ua:
            parts = ua.split('iPhone OS ')[1].split(' ')[0]
            ios_version = parts.split('_')[0]
            device_info['model'] = f'iPhone (iOS {ios_version})'
            device_info['full_name'] = f'Apple iPhone (iOS {ios_version})'
        else:
            device_info['model'] = 'iPhone'
            device_info['full_name'] = 'Apple iPhone'
    
    elif 'iPad' in ua:
        device_info['brand'] = 'Apple'
        device_info['model'] = 'iPad'
        device_info['full_name'] = 'Apple iPad'
    
    elif 'Macintosh' in ua or 'Mac OS' in ua:
        device_info['brand'] = 'Apple'
        device_info['model'] = 'Mac'
        device_info['full_name'] = 'Apple Mac'
    
    # Samsung devices
    elif 'Samsung' in ua:
        device_info['brand'] = 'Samsung'
        device_info['model'] = 'Galaxy'
        device_info['full_name'] = 'Samsung Galaxy'
    
    # Android devices
    elif 'Android' in ua:
        device_info['brand'] = 'Android'
        device_info['model'] = 'Android Device'
        device_info['full_name'] = 'Android Device'
        # Try to get more specific
        if 'Pixel' in ua:
            device_info['brand'] = 'Google'
            device_info['model'] = 'Pixel'
            device_info['full_name'] = 'Google Pixel'
    
    # Windows
    elif 'Windows' in ua:
        device_info['brand'] = 'Windows'
        device_info['model'] = 'PC'
        device_info['full_name'] = 'Windows PC'
    
    return device_info'''

# Replace the old get_device_type function
old_pattern = r'def get_device_type\(user_agent_string: str\) -> str:.*?return "desktop"'
content = re.sub(old_pattern, device_functions, content, flags=re.DOTALL)

# Update session creation to include device details
session_pattern = r'(session = AnalyticsSession\([^)]+)'
match = re.search(session_pattern, content)
if match and 'device_brand=' not in match.group(0):
    old_session = match.group(1)
    new_session = old_session + ''',
        device_brand=get_device_details(user_agent).get('brand'),
        device_model=get_device_details(user_agent).get('model'),
        device_full_name=get_device_details(user_agent).get('full_name')'''
    content = content.replace(old_session, new_session)

# Fix device stats handling
content = content.replace(
    'device_stats.mobile or 0',
    '(device_stats.mobile if device_stats else 0) or 0'
)
content = content.replace(
    'device_stats.desktop or 0',
    '(device_stats.desktop if device_stats else 0) or 0'
)
content = content.replace(
    'device_stats.tablet or 0',
    '(device_stats.tablet if device_stats else 0) or 0'
)

# Save updated analytics_routes.py
with open('analytics_routes.py', 'w') as f:
    f.write(content)
print("✅ Updated analytics_routes.py")

# 2. Update models.py
print("\nUpdating models.py...")

with open('models.py', 'r') as f:
    models_content = f.read()

# Find AnalyticsSession class and add device columns
if 'device_brand' not in models_content:
    # Find where to insert (after country column)
    country_pos = models_content.find('country = Column(String(2))')
    if country_pos > 0:
        insert_pos = models_content.find('\n', country_pos) + 1
        new_columns = '''    city = Column(String(100))
    device_brand = Column(String(50))
    device_model = Column(String(100))
    device_full_name = Column(String(150))
'''
        models_content = models_content[:insert_pos] + new_columns + models_content[insert_pos:]
        
        with open('models.py', 'w') as f:
            f.write(models_content)
        print("✅ Updated models.py")
    else:
        print("⚠️  Could not find where to add device columns in models.py")
else:
    print("ℹ️  Device columns already exist in models.py")

# 3. Create migration script
print("\nCreating migration script...")

migration_script = '''#!/usr/bin/env python3
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
'''

with open('migrate_device_analytics.py', 'w') as f:
    f.write(migration_script)
os.chmod('migrate_device_analytics.py', 0o755)
print("✅ Created migrate_device_analytics.py")

# 4. Create aggregation script
print("\nCreating aggregation script...")

aggregation_script = '''#!/usr/bin/env python3
"""
Analytics aggregation script
Usage: python aggregate_analytics.py [--today]
"""
import os
import sys
from datetime import date, timedelta
from sqlalchemy import create_engine, func, cast, Date
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')

from database import engine
from models import (
    AnalyticsSession, AnalyticsPageView, 
    AnalyticsItemClick, AnalyticsDaily, Tenant
)

def aggregate_date(db, tenant_id, target_date):
    """Aggregate analytics for a specific date"""
    
    sessions = db.query(AnalyticsSession).filter(
        AnalyticsSession.tenant_id == tenant_id,
        cast(AnalyticsSession.started_at, Date) == target_date
    ).all()
    
    if not sessions:
        return None
    
    # Calculate metrics
    total_sessions = len(sessions)
    unique_visitors = len(set(s.ip_address_hash for s in sessions if s.ip_address_hash))
    
    durations = [s.duration_seconds for s in sessions if s.duration_seconds and s.duration_seconds > 0]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Count devices
    device_counts = {'mobile': 0, 'desktop': 0, 'tablet': 0}
    for session in sessions:
        device_type = (session.device_type or 'desktop').lower()
        if device_type in device_counts:
            device_counts[device_type] += 1
    
    # Get page views and clicks
    page_views = db.query(func.count(AnalyticsPageView.id)).filter(
        AnalyticsPageView.tenant_id == tenant_id,
        cast(AnalyticsPageView.timestamp, Date) == target_date
    ).scalar() or 0
    
    item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
        AnalyticsItemClick.tenant_id == tenant_id,
        cast(AnalyticsItemClick.timestamp, Date) == target_date
    ).scalar() or 0
    
    # Update or create daily record
    daily = db.query(AnalyticsDaily).filter(
        AnalyticsDaily.tenant_id == tenant_id,
        AnalyticsDaily.date == target_date
    ).first()
    
    if daily:
        daily.total_sessions = total_sessions
        daily.unique_visitors = unique_visitors
        daily.total_page_views = page_views
        daily.total_item_clicks = item_clicks
        daily.avg_session_duration = avg_duration
        daily.mobile_sessions = device_counts['mobile']
        daily.desktop_sessions = device_counts['desktop']
        daily.tablet_sessions = device_counts['tablet']
    else:
        daily = AnalyticsDaily(
            tenant_id=tenant_id,
            date=target_date,
            total_sessions=total_sessions,
            unique_visitors=unique_visitors,
            total_page_views=page_views,
            total_item_clicks=item_clicks,
            avg_session_duration=avg_duration,
            mobile_sessions=device_counts['mobile'],
            desktop_sessions=device_counts['desktop'],
            tablet_sessions=device_counts['tablet']
        )
        db.add(daily)
    
    db.commit()
    return device_counts

def main():
    Session = sessionmaker(bind=engine)
    db = Session()
    
    # Determine date
    if len(sys.argv) > 1 and sys.argv[1] == '--today':
        target_date = date.today()
        print(f"Aggregating for TODAY ({target_date})")
    else:
        target_date = date.today() - timedelta(days=1)
        print(f"Aggregating for YESTERDAY ({target_date})")
    
    try:
        tenants = db.query(Tenant).filter(Tenant.status == 'active').all()
        
        for tenant in tenants:
            devices = aggregate_date(db, tenant.id, target_date)
            if devices:
                print(f"✅ {tenant.name}: Mobile={devices['mobile']}, "
                      f"Desktop={devices['desktop']}, Tablet={devices['tablet']}")
            else:
                print(f"ℹ️  {tenant.name}: No data")
        
        print("\\nAggregation complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
'''

with open('aggregate_analytics.py', 'w') as f:
    f.write(aggregation_script)
os.chmod('aggregate_analytics.py', 0o755)
print("✅ Created aggregate_analytics.py")

print("\n✅ All updates completed!")
print("\n📋 Files created/updated:")
print("  - analytics_routes.py (updated)")
print("  - models.py (updated)")
print("  - migrate_device_analytics.py (new)")
print("  - aggregate_analytics.py (new)")

# Clean up the update script
os.remove('analytics_updates.py')
print("\n🧹 Cleaned up temporary files")