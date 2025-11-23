"""
Analytics Query Optimizer for MenuIQ
Optimizes analytics queries by using pre-aggregated data and efficient queries
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, cast, Date
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple
from models import AnalyticsDaily, AnalyticsSession, AnalyticsPageView, AnalyticsItemClick
from simple_cache import cache, CACHE_TTL

class AnalyticsOptimizer:
    """Provides optimized analytics queries using pre-aggregated data"""
    
    @staticmethod
    def get_dashboard_overview_optimized(
        db: Session,
        tenant_id: int,
        start_date: date,
        end_date: date
    ) -> Dict:
        """
        Get dashboard overview using direct queries on raw analytics tables
        This ensures all historical data is included
        """
        # Check cache first
        cache_key = f"analytics_overview:{tenant_id}:{start_date}:{end_date}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        # Query raw analytics tables directly for accurate counts
        session_stats = db.query(
            func.count(AnalyticsSession.id).label("total_sessions"),
            func.count(func.distinct(AnalyticsSession.ip_address_hash)).label("unique_visitors"),
            func.avg(AnalyticsSession.duration_seconds).label("avg_duration")
        ).filter(
            AnalyticsSession.tenant_id == tenant_id,
            cast(AnalyticsSession.started_at, Date) >= start_date,
            cast(AnalyticsSession.started_at, Date) <= end_date
        ).first()
        
        # Get page views count
        page_views = db.query(func.count(AnalyticsPageView.id)).filter(
            AnalyticsPageView.tenant_id == tenant_id,
            cast(AnalyticsPageView.timestamp, Date) >= start_date,
            cast(AnalyticsPageView.timestamp, Date) <= end_date
        ).scalar() or 0
        
        # Get item clicks count
        item_clicks = db.query(func.count(AnalyticsItemClick.id)).filter(
            AnalyticsItemClick.tenant_id == tenant_id,
            cast(AnalyticsItemClick.timestamp, Date) >= start_date,
            cast(AnalyticsItemClick.timestamp, Date) <= end_date
        ).scalar() or 0
        
        # Get device breakdown
        device_stats = db.query(
            AnalyticsSession.device_type,
            func.count(AnalyticsSession.id)
        ).filter(
            AnalyticsSession.tenant_id == tenant_id,
            cast(AnalyticsSession.started_at, Date) >= start_date,
            cast(AnalyticsSession.started_at, Date) <= end_date
        ).group_by(AnalyticsSession.device_type).all()
        
        device_breakdown = {"mobile": 0, "desktop": 0, "tablet": 0}
        for device_type, count in device_stats:
            if device_type and device_type.lower() in device_breakdown:
                device_breakdown[device_type.lower()] = count
        
        # Get today's sessions count
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_sessions = db.query(func.count(AnalyticsSession.id)).filter(
            AnalyticsSession.tenant_id == tenant_id,
            AnalyticsSession.started_at >= today_start
        ).scalar() or 0
        
        # Build result
        result = {
            "total_sessions": session_stats.total_sessions or 0,
            "unique_visitors": session_stats.unique_visitors or 0,
            "total_page_views": page_views,
            "total_item_clicks": item_clicks,
            "avg_session_duration": int(session_stats.avg_duration or 0),
            "device_breakdown": device_breakdown,
            "today_sessions": today_sessions
        }
        
        # Cache the result for 5 minutes
        cache.set(cache_key, result, 300)
        
        return result
    
    @staticmethod
    def _get_today_realtime_stats(db: Session, tenant_id: int) -> Dict:
        """Get real-time statistics for today only"""
        # Use a single optimized query with subqueries
        today_start = datetime.combine(date.today(), datetime.min.time())
        
        # Sessions and visitors count
        session_stats = db.query(
            func.count(AnalyticsSession.id).label("sessions"),
            func.count(func.distinct(AnalyticsSession.ip_address_hash)).label("visitors")
        ).filter(
            AnalyticsSession.tenant_id == tenant_id,
            AnalyticsSession.started_at >= today_start
        ).first()
        
        # Page views and item clicks in one query using UNION
        interaction_stats = db.query(
            func.sum(case((AnalyticsPageView.id != None, 1), else_=0)).label("page_views"),
            func.sum(case((AnalyticsItemClick.id != None, 1), else_=0)).label("item_clicks")
        ).select_from(
            AnalyticsSession
        ).outerjoin(
            AnalyticsPageView,
            and_(
                AnalyticsPageView.session_id == AnalyticsSession.session_id,
                AnalyticsPageView.timestamp >= today_start
            )
        ).outerjoin(
            AnalyticsItemClick,
            and_(
                AnalyticsItemClick.session_id == AnalyticsSession.session_id,
                AnalyticsItemClick.timestamp >= today_start
            )
        ).filter(
            AnalyticsSession.tenant_id == tenant_id,
            AnalyticsSession.started_at >= today_start
        ).first()
        
        # Device breakdown
        device_stats = db.query(
            AnalyticsSession.device_type,
            func.count(AnalyticsSession.id)
        ).filter(
            AnalyticsSession.tenant_id == tenant_id,
            AnalyticsSession.started_at >= today_start
        ).group_by(AnalyticsSession.device_type).all()
        
        devices = {"mobile": 0, "desktop": 0, "tablet": 0}
        for device_type, count in device_stats:
            if device_type and device_type.lower() in devices:
                devices[device_type.lower()] = count
        
        return {
            "sessions": session_stats.sessions or 0,
            "visitors": session_stats.visitors or 0,
            "page_views": interaction_stats.page_views or 0,
            "item_clicks": interaction_stats.item_clicks or 0,
            "devices": devices
        }
    
    @staticmethod
    def get_timeline_optimized(
        db: Session,
        tenant_id: int,
        days: int = 30
    ) -> List[Dict]:
        """Get optimized timeline data using pre-aggregated daily data"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Check cache
        cache_key = f"analytics_timeline:{tenant_id}:{days}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        # Get all daily data in one query
        daily_data = db.query(
            AnalyticsDaily.date,
            AnalyticsDaily.total_sessions,
            AnalyticsDaily.unique_visitors,
            AnalyticsDaily.total_page_views,
            AnalyticsDaily.total_item_clicks
        ).filter(
            AnalyticsDaily.tenant_id == tenant_id,
            AnalyticsDaily.date >= start_date,
            AnalyticsDaily.date < date.today()  # Exclude today
        ).order_by(AnalyticsDaily.date).all()
        
        # Convert to list of dicts
        timeline = []
        for day in daily_data:
            timeline.append({
                "date": day.date.isoformat(),
                "sessions": day.total_sessions,
                "visitors": day.unique_visitors,
                "page_views": day.total_page_views,
                "item_clicks": day.total_item_clicks
            })
        
        # Add today's real-time data if within range
        if date.today() >= start_date:
            today_stats = AnalyticsOptimizer._get_today_realtime_stats(db, tenant_id)
            timeline.append({
                "date": date.today().isoformat(),
                "sessions": today_stats["sessions"],
                "visitors": today_stats["visitors"],
                "page_views": today_stats["page_views"],
                "item_clicks": today_stats["item_clicks"]
            })
        
        # Fill in missing dates with zeros
        date_set = {datetime.fromisoformat(d["date"]).date() for d in timeline}
        current_date = start_date
        while current_date <= end_date:
            if current_date not in date_set:
                timeline.append({
                    "date": current_date.isoformat(),
                    "sessions": 0,
                    "visitors": 0,
                    "page_views": 0,
                    "item_clicks": 0
                })
            current_date += timedelta(days=1)
        
        # Sort by date
        timeline.sort(key=lambda x: x["date"])
        
        # Cache the result
        cache.set(cache_key, timeline, 300)  # 5 minutes cache
        
        return timeline
    
    @staticmethod
    def get_popular_items_optimized(
        db: Session,
        tenant_id: int,
        days: int = 30,
        limit: int = 10
    ) -> List[Dict]:
        """Get popular items using aggregated click data"""
        cache_key = f"popular_items:{tenant_id}:{days}:{limit}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Use aggregated data from analytics_daily
        popular_items = db.query(
            AnalyticsItemClick.item_id,
            func.count(AnalyticsItemClick.id).label("click_count")
        ).filter(
            AnalyticsItemClick.tenant_id == tenant_id,
            cast(AnalyticsItemClick.timestamp, Date) >= start_date,
            cast(AnalyticsItemClick.timestamp, Date) <= end_date
        ).group_by(
            AnalyticsItemClick.item_id
        ).order_by(
            func.count(AnalyticsItemClick.id).desc()
        ).limit(limit).all()
        
        # Get item details
        from models import MenuItem
        item_ids = [item_id for item_id, _ in popular_items]
        items = db.query(MenuItem).filter(
            MenuItem.id.in_(item_ids)
        ).all()
        
        item_map = {item.id: item for item in items}
        
        result = []
        for item_id, click_count in popular_items:
            if item_id in item_map:
                item = item_map[item_id]
                result.append({
                    "item_id": item_id,
                    "name": item.name,
                    "name_ar": item.name_ar,
                    "clicks": click_count,
                    "category_id": item.category_id
                })
        
        # Cache the result
        cache.set(cache_key, result, 600)  # 10 minutes cache
        
        return result