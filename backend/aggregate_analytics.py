#!/usr/bin/env python3
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
        
        print("\nAggregation complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
