# Analytics Deployment Guide

## Step 1: Push to GitHub

First, commit and push your changes:

```bash
# In backend directory
git add .
git commit -m "Add analytics tracking system"
git push origin main

# In frontend directory
cd ../frontend
git add .
git commit -m "Add analytics dashboard and tracking"
git push origin main
```

## Step 2: On Production Server - Backend

After pulling the latest code on your production server:

### 1. Install New Dependencies

```bash
cd backend
source venv/bin/activate
pip install user-agents
pip freeze > requirements.txt
```

### 2. Run Database Migration

Create and run this migration script:

```bash
# Create migration file
cat > migrate_analytics.py << 'EOF'
#!/usr/bin/env python3
"""
Production migration script for analytics tables
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load production environment
load_dotenv('.env.production')

# Import models to ensure tables are registered
from database import engine, Base
from models import AnalyticsSession, AnalyticsPageView, AnalyticsItemClick, AnalyticsDaily

def migrate_analytics():
    """Create analytics tables in production"""
    print("🚀 Starting analytics migration...")
    
    # Create only the analytics tables (don't drop existing tables!)
    with engine.begin() as conn:
        # Check if tables already exist
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'analytics_%'
        """))
        existing_tables = [row[0] for row in result]
        
        if existing_tables:
            print(f"⚠️  Found existing analytics tables: {existing_tables}")
            response = input("Do you want to continue? (y/n): ")
            if response.lower() != 'y':
                print("Migration cancelled.")
                return
    
    # Create tables
    Base.metadata.create_all(bind=engine, tables=[
        AnalyticsSession.__table__,
        AnalyticsPageView.__table__,
        AnalyticsItemClick.__table__,
        AnalyticsDaily.__table__
    ])
    
    print("✅ Analytics tables created successfully!")
    
    # Verify tables were created
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'analytics_%'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
        print(f"📊 Created tables: {', '.join(tables)}")

if __name__ == "__main__":
    migrate_analytics()
EOF

# Run migration
python migrate_analytics.py
```

### 3. Set Up Daily Analytics Aggregation (Cron Job)

Create the aggregation script:

```bash
cat > aggregate_analytics_cron.py << 'EOF'
#!/usr/bin/env python3
"""
Daily analytics aggregation script for cron
"""
import os
import sys
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine, func, cast, Date
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load production environment
load_dotenv('.env.production')

from database import engine
from models import (
    AnalyticsSession, AnalyticsPageView, AnalyticsItemClick, 
    AnalyticsDaily, Tenant
)

def aggregate_yesterday():
    """Aggregate yesterday's analytics data"""
    Session = sessionmaker(bind=engine)
    db = Session()
    
    yesterday = date.today() - timedelta(days=1)
    
    try:
        tenants = db.query(Tenant).filter(Tenant.status == 'active').all()
        
        for tenant in tenants:
            # Get session stats
            sessions = db.query(AnalyticsSession).filter(
                AnalyticsSession.tenant_id == tenant.id,
                cast(AnalyticsSession.started_at, Date) == yesterday
            ).all()
            
            if not sessions:
                continue
                
            total_sessions = len(sessions)
            unique_visitors = len(set(s.ip_address_hash for s in sessions if s.ip_address_hash))
            
            # Calculate average session duration
            durations = [s.duration_seconds for s in sessions if s.duration_seconds]
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            # Count device types
            device_counts = {'mobile': 0, 'desktop': 0, 'tablet': 0}
            for session in sessions:
                device_type = (session.device_type or 'desktop').lower()
                if device_type in device_counts:
                    device_counts[device_type] += 1
            
            # Get page views and clicks
            page_views = db.query(func.count(AnalyticsPageView.id)).filter(
                AnalyticsPageView.tenant_id == tenant.id,
                cast(AnalyticsPageView.timestamp, Date) == yesterday
            ).scalar() or 0
            
            item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
                AnalyticsItemClick.tenant_id == tenant.id,
                cast(AnalyticsItemClick.timestamp, Date) == yesterday
            ).scalar() or 0
            
            # Update or create daily record
            daily_record = db.query(AnalyticsDaily).filter(
                AnalyticsDaily.tenant_id == tenant.id,
                AnalyticsDaily.date == yesterday
            ).first()
            
            if daily_record:
                daily_record.total_sessions = total_sessions
                daily_record.unique_visitors = unique_visitors
                daily_record.total_page_views = page_views
                daily_record.total_item_clicks = item_clicks
                daily_record.avg_session_duration = avg_duration
                daily_record.mobile_sessions = device_counts['mobile']
                daily_record.desktop_sessions = device_counts['desktop']
                daily_record.tablet_sessions = device_counts['tablet']
            else:
                daily_record = AnalyticsDaily(
                    tenant_id=tenant.id,
                    date=yesterday,
                    total_sessions=total_sessions,
                    unique_visitors=unique_visitors,
                    total_page_views=page_views,
                    total_item_clicks=item_clicks,
                    avg_session_duration=avg_duration,
                    mobile_sessions=device_counts['mobile'],
                    desktop_sessions=device_counts['desktop'],
                    tablet_sessions=device_counts['tablet']
                )
                db.add(daily_record)
            
            db.commit()
            print(f"✅ Aggregated {tenant.name}: {total_sessions} sessions")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    aggregate_yesterday()
EOF

# Make it executable
chmod +x aggregate_analytics_cron.py

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * cd /path/to/your/backend && /path/to/your/venv/bin/python aggregate_analytics_cron.py >> /var/log/analytics_aggregation.log 2>&1") | crontab -
```

### 4. Restart Backend Service

```bash
# If using systemd
sudo systemctl restart menuiq-backend

# If using supervisor
sudo supervisorctl restart menuiq-backend

# If using PM2
pm2 restart menuiq-backend
```

## Step 3: On Production Server - Frontend

### 1. Update Environment Variables

Make sure your frontend .env has the correct API URL:

```bash
cd frontend
echo "REACT_APP_API_URL=https://api.yourdomain.com" > .env.production
```

### 2. Build Frontend

```bash
npm install
npm run build
```

### 3. Deploy Build Files

```bash
# Copy build files to your web server directory
# Example for nginx:
sudo cp -r build/* /var/www/menuiq/
```

## Step 4: Verify Deployment

### 1. Check Analytics Tables

```bash
cd backend
source venv/bin/activate
python -c "
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM analytics_sessions'))
    print(f'Sessions: {result.scalar()}')
"
```

### 2. Test Analytics Endpoints

```bash
# Test session creation
curl -X POST "https://api.yourdomain.com/api/analytics/track/session?subdomain=demo&language=en"

# Should return: {"session_id":"..."}
```

### 3. Monitor Logs

```bash
# Check backend logs
tail -f /var/log/menuiq/backend.log

# Check aggregation logs
tail -f /var/log/analytics_aggregation.log
```

## Step 5: Optional - Clean Up Old Sessions

Create a cleanup script to remove old analytics data (optional):

```bash
cat > cleanup_old_analytics.py << 'EOF'
#!/usr/bin/env python3
"""
Clean up analytics data older than 90 days
"""
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv('.env.production')

from database import engine
from models import AnalyticsSession, AnalyticsPageView, AnalyticsItemClick

def cleanup_old_data(days_to_keep=90):
    Session = sessionmaker(bind=engine)
    db = Session()
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    try:
        # Delete old sessions
        deleted_sessions = db.query(AnalyticsSession).filter(
            AnalyticsSession.started_at < cutoff_date
        ).delete()
        
        # Delete old page views
        deleted_views = db.query(AnalyticsPageView).filter(
            AnalyticsPageView.timestamp < cutoff_date
        ).delete()
        
        # Delete old clicks
        deleted_clicks = db.query(AnalyticsItemClick).filter(
            AnalyticsItemClick.timestamp < cutoff_date
        ).delete()
        
        db.commit()
        print(f"Cleaned up: {deleted_sessions} sessions, {deleted_views} page views, {deleted_clicks} clicks")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_data()
EOF

# Add to monthly cron
(crontab -l 2>/dev/null; echo "0 3 1 * * cd /path/to/your/backend && /path/to/your/venv/bin/python cleanup_old_analytics.py >> /var/log/analytics_cleanup.log 2>&1") | crontab -
```

## Troubleshooting

### If migrations fail:
1. Check database connection in .env.production
2. Ensure database user has CREATE TABLE permissions
3. Check PostgreSQL logs

### If analytics not tracking:
1. Check browser console for 404 errors
2. Verify API URL in frontend build
3. Check CORS settings in backend

### If aggregation not working:
1. Check cron logs: `grep CRON /var/log/syslog`
2. Run aggregation manually to test
3. Verify timezone settings

## Security Notes

1. Analytics data is privacy-focused:
   - IP addresses are hashed
   - No personal data is stored
   - Sessions are anonymous

2. Ensure HTTPS is used in production
3. Consider rate limiting on tracking endpoints
4. Monitor for unusual traffic patterns