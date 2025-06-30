"""
Analytics API Routes

This module provides endpoints for:
- Recording user sessions and interactions
- Retrieving analytics data for tenant dashboard
- Aggregating analytics metrics
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, Date, cast
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List
import hashlib
import uuid
from user_agents import parse
import re

from database import get_db
from models import (
    AnalyticsSession, AnalyticsPageView, AnalyticsItemClick, 
    AnalyticsDaily, MenuItem, Category, Tenant
)
from auth import get_current_user_dict, get_tenant_id_from_request

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def get_device_type(user_agent_string: str) -> str:
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
    
    if not ua:
        return device_info
    
    # Apple devices
    if 'iPhone' in ua:
        device_info['brand'] = 'Apple'
        # Try to extract iOS version
        try:
            # Look for iOS version in different formats
            version_match = re.search(r'iPhone OS (\d+)[_\s]', ua) or re.search(r'CPU iPhone OS (\d+)[_\s]', ua)
            if version_match:
                ios_version = version_match.group(1)
                device_info['model'] = f'iPhone (iOS {ios_version})'
                device_info['full_name'] = f'Apple iPhone (iOS {ios_version})'
            else:
                device_info['model'] = 'iPhone'
                device_info['full_name'] = 'Apple iPhone'
        except:
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
    
    # Samsung devices - check first before generic Android
    elif 'SM-' in ua or 'Samsung' in ua or 'SAMSUNG' in ua:
        device_info['brand'] = 'Samsung'
        # Try to extract model
        model_match = re.search(r'SM-[A-Z]\d+[A-Z]?', ua)
        if model_match:
            device_info['model'] = model_match.group(0)
            device_info['full_name'] = f'Samsung {model_match.group(0)}'
        else:
            device_info['model'] = 'Galaxy'
            device_info['full_name'] = 'Samsung Galaxy'
    
    # Other specific Android devices
    elif 'Pixel' in ua:
        device_info['brand'] = 'Google'
        # Try to extract Pixel model
        pixel_match = re.search(r'Pixel\s?(\d+[a-zA-Z]?)', ua)
        if pixel_match:
            device_info['model'] = f'Pixel {pixel_match.group(1)}'
            device_info['full_name'] = f'Google Pixel {pixel_match.group(1)}'
        else:
            device_info['model'] = 'Pixel'
            device_info['full_name'] = 'Google Pixel'
    
    # Xiaomi devices
    elif 'Xiaomi' in ua or 'Mi ' in ua or 'Redmi' in ua:
        device_info['brand'] = 'Xiaomi'
        if 'Redmi' in ua:
            device_info['model'] = 'Redmi'
            device_info['full_name'] = 'Xiaomi Redmi'
        else:
            device_info['model'] = 'Mi'
            device_info['full_name'] = 'Xiaomi Mi'
    
    # Huawei devices
    elif 'HUAWEI' in ua or 'Huawei' in ua:
        device_info['brand'] = 'Huawei'
        device_info['model'] = 'Huawei Device'
        device_info['full_name'] = 'Huawei Device'
    
    # OnePlus devices
    elif 'OnePlus' in ua:
        device_info['brand'] = 'OnePlus'
        oneplus_match = re.search(r'OnePlus\s?([A-Z0-9]+)', ua)
        if oneplus_match:
            device_info['model'] = oneplus_match.group(1)
            device_info['full_name'] = f'OnePlus {oneplus_match.group(1)}'
        else:
            device_info['model'] = 'OnePlus'
            device_info['full_name'] = 'OnePlus Device'
    
    # Generic Android
    elif 'Android' in ua:
        device_info['brand'] = 'Android'
        # Try to extract Android version
        android_match = re.search(r'Android\s?(\d+)', ua)
        if android_match:
            device_info['model'] = f'Android {android_match.group(1)}'
            device_info['full_name'] = f'Android {android_match.group(1)} Device'
        else:
            device_info['model'] = 'Android Device'
            device_info['full_name'] = 'Android Device'
    
    # Windows
    elif 'Windows NT' in ua:
        device_info['brand'] = 'Windows'
        if 'Windows NT 10' in ua:
            device_info['model'] = 'Windows 10/11'
            device_info['full_name'] = 'Windows 10/11 PC'
        elif 'Windows NT 6.3' in ua:
            device_info['model'] = 'Windows 8.1'
            device_info['full_name'] = 'Windows 8.1 PC'
        elif 'Windows NT 6.2' in ua:
            device_info['model'] = 'Windows 8'
            device_info['full_name'] = 'Windows 8 PC'
        else:
            device_info['model'] = 'Windows PC'
            device_info['full_name'] = 'Windows PC'
    
    # Linux
    elif 'Linux' in ua and 'X11' in ua:
        device_info['brand'] = 'Linux'
        device_info['model'] = 'Desktop'
        device_info['full_name'] = 'Linux Desktop'
    
    # Check for bots/crawlers
    elif any(bot in ua.lower() for bot in ['bot', 'spider', 'crawler', 'scraper']):
        device_info['brand'] = 'Bot'
        device_info['model'] = 'Crawler'
        device_info['full_name'] = 'Web Crawler'
    
    return device_info

def hash_ip(ip_address: str) -> str:
    """Hash IP address for privacy"""
    return hashlib.sha256(ip_address.encode()).hexdigest()

# Public endpoints for tracking (no auth required)
@router.post("/track/session")
async def track_session_start(
    request: Request,
    subdomain: str,
    language: str = "en",
    db: Session = Depends(get_db)
):
    """Start a new analytics session"""
    # Get tenant by subdomain
    tenant = db.query(Tenant).filter(
        func.lower(Tenant.subdomain) == func.lower(subdomain)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get request details
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer", "")
    
    # Get device details once
    try:
        device_details = get_device_details(user_agent)
        if not isinstance(device_details, dict):
            device_details = {'brand': 'Unknown', 'model': 'Unknown', 'full_name': 'Unknown Device'}
        
        # Log unknown devices for future improvement
        if device_details['brand'] == 'Unknown' and user_agent:
            print(f"[Analytics] Unknown device detected - User Agent: {user_agent}")
            
    except Exception as e:
        print(f"Error getting device details: {e}")
        device_details = {'brand': 'Unknown', 'model': 'Unknown', 'full_name': 'Unknown Device'}
    
    # Create session
    session_id = str(uuid.uuid4())
    session = AnalyticsSession(
        tenant_id=tenant.id,
        session_id=session_id,
        ip_address_hash=hash_ip(client_ip),
        device_brand=device_details.get('brand', 'Unknown'),
        device_model=device_details.get('model', 'Unknown'),
        device_full_name=device_details.get('full_name', 'Unknown Device'),
        user_agent=user_agent,
        device_type=get_device_type(user_agent),
        browser=parse(user_agent).browser.family,
        os=parse(user_agent).os.family,
        referrer=referrer,
        language=language
    )
    
    db.add(session)
    db.commit()
    
    return {"session_id": session_id}

@router.post("/track/pageview")
async def track_page_view(
    session_id: str,
    page_type: str,  # menu, category, item_detail
    category_id: Optional[int] = None,
    item_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Track a page view"""
    # Get session
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create page view
    page_view = AnalyticsPageView(
        session_id=session_id,
        tenant_id=session.tenant_id,
        page_type=page_type,
        category_id=category_id,
        item_id=item_id
    )
    
    db.add(page_view)
    db.commit()
    
    return {"status": "recorded"}

@router.post("/track/item-click")
async def track_item_click(
    session_id: str,
    item_id: int,
    category_id: Optional[int] = None,
    action_type: str = "view_details",
    db: Session = Depends(get_db)
):
    """Track when a user clicks on an item"""
    # Get session
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create item click
    item_click = AnalyticsItemClick(
        session_id=session_id,
        tenant_id=session.tenant_id,
        item_id=item_id,
        category_id=category_id,
        action_type=action_type
    )
    
    db.add(item_click)
    db.commit()
    
    return {"status": "recorded"}

@router.post("/track/session-end")
async def track_session_end(
    session_id: str,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """End a session and calculate duration"""
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.ended_at = datetime.utcnow()
    session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
    
    db.commit()
    
    # Schedule daily aggregation update
    background_tasks.add_task(update_daily_analytics, session.tenant_id, date.today(), db)
    
    return {"status": "session_ended"}

# Protected endpoints for tenant dashboard
@router.get("/dashboard/overview")
async def get_analytics_overview(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get analytics overview for tenant dashboard"""
    tenant_id = current_user["tenant_id"]
    
    # Default to last 30 days
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Get today's real-time stats
    today_sessions = db.query(func.count(AnalyticsSession.id)).filter(
        AnalyticsSession.tenant_id == tenant_id,
        cast(AnalyticsSession.started_at, Date) == date.today()
    ).scalar() or 0
    
    # Get aggregated stats from daily table
    daily_stats = db.query(
        func.sum(AnalyticsDaily.total_sessions).label("total_sessions"),
        func.sum(AnalyticsDaily.unique_visitors).label("unique_visitors"),
        func.sum(AnalyticsDaily.total_page_views).label("total_page_views"),
        func.sum(AnalyticsDaily.total_item_clicks).label("total_item_clicks"),
        func.avg(AnalyticsDaily.avg_session_duration).label("avg_session_duration")
    ).filter(
        AnalyticsDaily.tenant_id == tenant_id,
        AnalyticsDaily.date >= start_date,
        AnalyticsDaily.date <= end_date
    ).first()
    
    # Also get real-time stats for the period (in case daily aggregation hasn't run)
    realtime_stats = db.query(
        func.count(AnalyticsSession.id).label("total_sessions"),
        func.count(func.distinct(AnalyticsSession.ip_address_hash)).label("unique_visitors")
    ).filter(
        AnalyticsSession.tenant_id == tenant_id,
        cast(AnalyticsSession.started_at, Date) >= start_date,
        cast(AnalyticsSession.started_at, Date) <= end_date
    ).first()
    
    # Get real-time page views
    realtime_page_views = db.query(func.count(AnalyticsPageView.id)).filter(
        AnalyticsPageView.tenant_id == tenant_id,
        cast(AnalyticsPageView.timestamp, Date) >= start_date,
        cast(AnalyticsPageView.timestamp, Date) <= end_date
    ).scalar() or 0
    
    # Get real-time item clicks
    realtime_item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
        AnalyticsItemClick.tenant_id == tenant_id,
        cast(AnalyticsItemClick.timestamp, Date) >= start_date,
        cast(AnalyticsItemClick.timestamp, Date) <= end_date
    ).scalar() or 0
    
    # Use the maximum of aggregated and real-time data
    total_sessions = max(daily_stats.total_sessions or 0, realtime_stats.total_sessions or 0)
    unique_visitors = max(daily_stats.unique_visitors or 0, realtime_stats.unique_visitors or 0)
    total_page_views = max(daily_stats.total_page_views or 0, realtime_page_views)
    total_item_clicks = max(daily_stats.total_item_clicks or 0, realtime_item_clicks)
    
    # Get device breakdown
    device_stats = db.query(
        func.sum(AnalyticsDaily.mobile_sessions).label("mobile"),
        func.sum(AnalyticsDaily.desktop_sessions).label("desktop"),
        func.sum(AnalyticsDaily.tablet_sessions).label("tablet")
    ).filter(
        AnalyticsDaily.tenant_id == tenant_id,
        AnalyticsDaily.date >= start_date,
        AnalyticsDaily.date <= end_date
    ).first()
    
    # Get real-time device breakdown for today
    today_devices = db.query(AnalyticsSession.device_type, func.count(AnalyticsSession.id)).filter(
        AnalyticsSession.tenant_id == tenant_id,
        cast(AnalyticsSession.started_at, Date) >= start_date,
        cast(AnalyticsSession.started_at, Date) <= end_date
    ).group_by(AnalyticsSession.device_type).all()
    
    device_realtime = {'mobile': 0, 'desktop': 0, 'tablet': 0}
    for device_type, count in today_devices:
        if device_type and device_type.lower() in device_realtime:
            device_realtime[device_type.lower()] = count
    
    # Prepare device breakdown
    device_breakdown = {
        "mobile": 0,
        "desktop": 0,
        "tablet": 0
    }
    
    # Add aggregated device data
    if device_stats and device_stats.mobile is not None:
        device_breakdown["mobile"] = device_stats.mobile
    if device_stats and device_stats.desktop is not None:
        device_breakdown["desktop"] = device_stats.desktop
    if device_stats and device_stats.tablet is not None:
        device_breakdown["tablet"] = device_stats.tablet
    
    # Add real-time device data (take the max of aggregated and real-time)
    device_breakdown["mobile"] = max(device_breakdown["mobile"], device_realtime['mobile'])
    device_breakdown["desktop"] = max(device_breakdown["desktop"], device_realtime['desktop'])
    device_breakdown["tablet"] = max(device_breakdown["tablet"], device_realtime['tablet'])
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "overview": {
            "total_sessions": total_sessions,
            "unique_visitors": unique_visitors,
            "total_page_views": total_page_views,
            "total_item_clicks": total_item_clicks,
            "avg_session_duration": int(daily_stats.avg_session_duration or 0),
            "today_sessions": today_sessions,
            "device_breakdown": device_breakdown
        }
    }

@router.get("/dashboard/timeline")
async def get_analytics_timeline(
    days: int = 30,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get daily analytics for timeline chart"""
    tenant_id = current_user["tenant_id"]
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    daily_data = db.query(
        AnalyticsDaily.date,
        AnalyticsDaily.total_sessions,
        AnalyticsDaily.unique_visitors,
        AnalyticsDaily.total_page_views,
        AnalyticsDaily.total_item_clicks
    ).filter(
        AnalyticsDaily.tenant_id == tenant_id,
        AnalyticsDaily.date >= start_date,
        AnalyticsDaily.date <= end_date
    ).order_by(AnalyticsDaily.date).all()
    
    # Convert to dict for easier manipulation
    daily_dict = {d.date: d for d in daily_data}
    
    # If today is in the range and not in daily data, add real-time stats
    if date.today() <= end_date and date.today() >= start_date and date.today() not in daily_dict:
        today_sessions = db.query(func.count(AnalyticsSession.id)).filter(
            AnalyticsSession.tenant_id == tenant_id,
            cast(AnalyticsSession.started_at, Date) == date.today()
        ).scalar() or 0
        
        today_visitors = db.query(func.count(func.distinct(AnalyticsSession.ip_address_hash))).filter(
            AnalyticsSession.tenant_id == tenant_id,
            cast(AnalyticsSession.started_at, Date) == date.today()
        ).scalar() or 0
        
        today_page_views = db.query(func.count(AnalyticsPageView.id)).filter(
            AnalyticsPageView.tenant_id == tenant_id,
            cast(AnalyticsPageView.timestamp, Date) == date.today()
        ).scalar() or 0
        
        today_item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
            AnalyticsItemClick.tenant_id == tenant_id,
            cast(AnalyticsItemClick.timestamp, Date) == date.today()
        ).scalar() or 0
        
        # Add today's data
        daily_dict[date.today()] = type('obj', (object,), {
            'date': date.today(),
            'total_sessions': today_sessions,
            'unique_visitors': today_visitors,
            'total_page_views': today_page_views,
            'total_item_clicks': today_item_clicks
        })()
    
    # Generate complete timeline with all dates
    timeline = []
    current_date = start_date
    while current_date <= end_date:
        if current_date in daily_dict:
            d = daily_dict[current_date]
            timeline.append({
                "date": current_date.isoformat(),
                "sessions": d.total_sessions,
                "visitors": d.unique_visitors,
                "page_views": d.total_page_views,
                "item_clicks": d.total_item_clicks
            })
        else:
            # No data for this date
            timeline.append({
                "date": current_date.isoformat(),
                "sessions": 0,
                "visitors": 0,
                "page_views": 0,
                "item_clicks": 0
            })
        current_date += timedelta(days=1)
    
    return {"timeline": timeline}

@router.get("/dashboard/top-items")
async def get_top_items(
    days: int = 30,
    limit: int = 10,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get most clicked menu items"""
    tenant_id = current_user["tenant_id"]
    start_date = datetime.utcnow() - timedelta(days=days)
    
    top_items = db.query(
        MenuItem.id,
        MenuItem.name,
        MenuItem.name_ar,
        MenuItem.image,
        func.count(AnalyticsItemClick.id).label("click_count")
    ).join(
        AnalyticsItemClick, MenuItem.id == AnalyticsItemClick.item_id
    ).filter(
        AnalyticsItemClick.tenant_id == tenant_id,
        AnalyticsItemClick.timestamp >= start_date
    ).group_by(
        MenuItem.id, MenuItem.name, MenuItem.name_ar, MenuItem.image
    ).order_by(
        desc("click_count")
    ).limit(limit).all()
    
    return {
        "top_items": [
            {
                "id": item.id,
                "name": item.name,
                "name_ar": item.name_ar,
                "image": item.image,
                "clicks": item.click_count
            }
            for item in top_items
        ]
    }

@router.get("/dashboard/category-performance")
async def get_category_performance(
    days: int = 30,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get category view statistics"""
    tenant_id = current_user["tenant_id"]
    start_date = datetime.utcnow() - timedelta(days=days)
    
    category_stats = db.query(
        Category.id,
        Category.name,
        Category.icon,
        func.count(AnalyticsPageView.id).label("view_count")
    ).join(
        AnalyticsPageView, Category.id == AnalyticsPageView.category_id
    ).filter(
        AnalyticsPageView.tenant_id == tenant_id,
        AnalyticsPageView.timestamp >= start_date,
        AnalyticsPageView.page_type == "category"
    ).group_by(
        Category.id, Category.name, Category.icon
    ).order_by(
        desc("view_count")
    ).all()
    
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon,
                "views": cat.view_count
            }
            for cat in category_stats
        ]
    }

@router.get("/dashboard/device-details")
async def get_device_details_dashboard(
    days: int = 30,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get detailed device information"""
    tenant_id = current_user["tenant_id"]
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all sessions with device details
    device_sessions = db.query(
        AnalyticsSession.device_brand,
        AnalyticsSession.device_model,
        AnalyticsSession.device_full_name,
        AnalyticsSession.device_type,
        func.count(AnalyticsSession.id).label("session_count")
    ).filter(
        AnalyticsSession.tenant_id == tenant_id,
        AnalyticsSession.started_at >= start_date,
        AnalyticsSession.device_brand.isnot(None)
    ).group_by(
        AnalyticsSession.device_brand,
        AnalyticsSession.device_model,
        AnalyticsSession.device_full_name,
        AnalyticsSession.device_type
    ).order_by(
        desc("session_count")
    ).limit(20).all()
    
    return {
        "devices": [
            {
                "brand": device.device_brand,
                "model": device.device_model,
                "full_name": device.device_full_name,
                "type": device.device_type,
                "sessions": device.session_count
            }
            for device in device_sessions
        ]
    }

def update_daily_analytics(tenant_id: int, target_date: date, db: Session):
    """Update daily analytics aggregation (background task)"""
    # This would be better as a scheduled job, but for now we'll update on session end
    # Calculate aggregated stats for the day
    
    # Get session stats
    session_stats = db.query(
        func.count(AnalyticsSession.id).label("total_sessions"),
        func.count(func.distinct(AnalyticsSession.ip_address_hash)).label("unique_visitors")
    ).filter(
        AnalyticsSession.tenant_id == tenant_id,
        cast(AnalyticsSession.started_at, Date) == target_date
    ).first()
    
    # Get page view stats
    page_views = db.query(func.count(AnalyticsPageView.id)).filter(
        AnalyticsPageView.tenant_id == tenant_id,
        cast(AnalyticsPageView.timestamp, Date) == target_date
    ).scalar() or 0
    
    # Get item clicks
    item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
        AnalyticsItemClick.tenant_id == tenant_id,
        cast(AnalyticsItemClick.timestamp, Date) == target_date
    ).scalar() or 0
    
    # Update or create daily record
    daily_record = db.query(AnalyticsDaily).filter(
        AnalyticsDaily.tenant_id == tenant_id,
        AnalyticsDaily.date == target_date
    ).first()
    
    if daily_record:
        daily_record.total_sessions = session_stats.total_sessions or 0
        daily_record.unique_visitors = session_stats.unique_visitors or 0
        daily_record.total_page_views = page_views
        daily_record.total_item_clicks = item_clicks
    else:
        daily_record = AnalyticsDaily(
            tenant_id=tenant_id,
            date=target_date,
            total_sessions=session_stats.total_sessions or 0,
            unique_visitors=session_stats.unique_visitors or 0,
            total_page_views=page_views,
            total_item_clicks=item_clicks
        )
        db.add(daily_record)
    
    db.commit()