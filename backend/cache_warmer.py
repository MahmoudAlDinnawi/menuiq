"""
Cache warming module for MenuIQ
Proactively populates cache after invalidation to improve performance
"""
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session
from simple_cache import cache, CACHE_TTL
import logging

logger = logging.getLogger(__name__)

class CacheWarmer:
    """Handles cache warming operations"""
    
    @staticmethod
    async def warm_public_menu_cache(
        db: Session,
        subdomain: str,
        tenant_id: int
    ):
        """Warm cache for public menu endpoints"""
        try:
            # Import here to avoid circular imports
            from public_menu_routes import get_public_menu_items, get_public_categories, get_public_settings
            
            # Warm menu items cache with different pagination options
            pagination_configs = [
                {"skip": 0, "limit": 50},
                {"skip": 0, "limit": 100},
                {"skip": 0, "limit": 20}
            ]
            
            # Common field selections
            field_configs = [
                None,  # All fields
                "id,name,nameAr,price,image,category,categoryId",  # Basic fields
                "id,name,price,image,calories,halal,vegetarian,vegan"  # Diet fields
            ]
            
            tasks = []
            
            # Warm menu items cache
            for pagination in pagination_configs:
                for fields in field_configs:
                    async def warm_menu_items(skip, limit, fields):
                        try:
                            cache_key = f"public_menu:subdomain:{subdomain}:skip:{skip}:limit:{limit}:fields:{fields or 'all'}"
                            # Simulate the request
                            await get_public_menu_items(
                                subdomain=subdomain,
                                skip=skip,
                                limit=limit,
                                fields=fields,
                                db=db
                            )
                            logger.info(f"Warmed cache for menu items: {cache_key}")
                        except Exception as e:
                            logger.error(f"Failed to warm menu cache: {e}")
                    
                    tasks.append(warm_menu_items(
                        pagination["skip"],
                        pagination["limit"],
                        fields
                    ))
            
            # Warm categories cache
            async def warm_categories():
                try:
                    cache_key = f"categories:subdomain:{subdomain}"
                    await get_public_categories(subdomain=subdomain, db=db)
                    logger.info(f"Warmed cache for categories: {cache_key}")
                except Exception as e:
                    logger.error(f"Failed to warm categories cache: {e}")
            
            tasks.append(warm_categories())
            
            # Warm settings cache
            async def warm_settings():
                try:
                    cache_key = f"settings:subdomain:{subdomain}"
                    await get_public_settings(subdomain=subdomain, db=db)
                    logger.info(f"Warmed cache for settings: {cache_key}")
                except Exception as e:
                    logger.error(f"Failed to warm settings cache: {e}")
            
            tasks.append(warm_settings())
            
            # Execute all warming tasks concurrently
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            logger.error(f"Cache warming failed for subdomain {subdomain}: {e}")
    
    @staticmethod
    async def warm_tenant_cache(
        db: Session,
        tenant_id: int,
        cache_types: Optional[List[str]] = None
    ):
        """Warm various tenant-specific caches"""
        if cache_types is None:
            cache_types = ["menu", "categories", "settings", "allergens"]
        
        tasks = []
        
        # Import models here to avoid circular imports
        from models import Tenant, MenuItem, Category, Settings, AllergenIcon
        
        # Get tenant subdomain
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            logger.error(f"Tenant {tenant_id} not found")
            return
        
        if "menu" in cache_types:
            tasks.append(
                CacheWarmer.warm_public_menu_cache(db, tenant.subdomain, tenant_id)
            )
        
        if "allergens" in cache_types:
            # Warm allergen icons cache
            cache_key = f"allergen_icons:tenant:{tenant_id}"
            allergens = db.query(AllergenIcon).filter(
                AllergenIcon.tenant_id == tenant_id
            ).all()
            
            allergen_data = [{
                "id": a.id,
                "name": a.name,
                "display_name": a.display_name,
                "display_name_ar": a.display_name_ar,
                "icon_url": a.icon_url
            } for a in allergens]
            
            cache.set(cache_key, allergen_data, CACHE_TTL.get("allergens", 3600))
            logger.info(f"Warmed cache for allergen icons: {cache_key}")
        
        # Execute all tasks
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    @staticmethod
    def invalidate_and_warm_async(
        db: Session,
        tenant_id: int,
        subdomain: str,
        cache_types: Optional[List[str]] = None
    ):
        """
        Invalidate cache and warm it in the background
        This is meant to be called from sync contexts
        """
        # Invalidate cache patterns
        patterns = [
            f"public_menu:subdomain:{subdomain}:*",
            f"categories:subdomain:{subdomain}",
            f"settings:subdomain:{subdomain}",
            f"allergen_icons:tenant:{tenant_id}"
        ]
        
        for pattern in patterns:
            # Simple cache doesn't support pattern deletion,
            # so we'll just let TTL handle it
            pass
        
        # Create a new event loop for the background task
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(
                CacheWarmer.warm_tenant_cache(db, tenant_id, cache_types)
            )
        except Exception as e:
            logger.error(f"Background cache warming failed: {e}")
        finally:
            loop.close()