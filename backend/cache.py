"""
Redis Cache Module

This module provides caching functionality for the MenuIQ application.
It uses Redis to cache frequently accessed data like:
- Public menu data
- Settings
- Analytics aggregations
"""

import redis
import json
import os
from typing import Optional, Any
from datetime import timedelta
import hashlib

# Redis connection settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Cache TTL settings (in seconds)
CACHE_TTL = {
    "public_menu": 300,      # 5 minutes for public menu data
    "settings": 600,         # 10 minutes for settings
    "analytics": 3600,       # 1 hour for analytics data
    "categories": 300,       # 5 minutes for categories
    "menu_items": 300,       # 5 minutes for menu items
}

class RedisCache:
    def __init__(self):
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def _generate_key(self, prefix: str, **kwargs) -> str:
        """Generate a cache key from prefix and parameters"""
        # Sort kwargs to ensure consistent key generation
        sorted_items = sorted(kwargs.items())
        key_parts = [f"{k}:{v}" for k, v in sorted_items if v is not None]
        key_suffix = ":".join(key_parts)
        
        if key_suffix:
            return f"{prefix}:{key_suffix}"
        return prefix
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"Cache get error: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        if not self.redis_client:
            return False
        
        try:
            json_value = json.dumps(value)
            if ttl:
                self.redis_client.setex(key, ttl, json_value)
            else:
                self.redis_client.set(key, json_value)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern"""
        if not self.redis_client:
            return False
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
            return False
    
    def invalidate_tenant_cache(self, tenant_id: int):
        """Invalidate all cache entries for a tenant"""
        patterns = [
            f"public_menu:tenant_id:{tenant_id}*",
            f"settings:tenant_id:{tenant_id}*",
            f"categories:tenant_id:{tenant_id}*",
            f"menu_items:tenant_id:{tenant_id}*",
        ]
        
        for pattern in patterns:
            self.delete_pattern(pattern)

# Singleton instance
cache = RedisCache()

# Decorator for caching
def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(**kwargs):
            # Generate cache key
            cache_key = cache._generate_key(prefix, **kwargs)
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call the function
            result = func(**kwargs)
            
            # Cache the result
            cache_ttl = ttl or CACHE_TTL.get(prefix, 300)
            cache.set(cache_key, result, cache_ttl)
            
            return result
        
        return wrapper
    return decorator

# Helper functions for common cache operations
def get_public_menu_cache(subdomain: str, language: str = "en") -> Optional[dict]:
    """Get public menu data from cache"""
    key = cache._generate_key("public_menu", subdomain=subdomain, language=language)
    return cache.get(key)

def set_public_menu_cache(subdomain: str, language: str, data: dict) -> bool:
    """Set public menu data in cache"""
    key = cache._generate_key("public_menu", subdomain=subdomain, language=language)
    return cache.set(key, data, CACHE_TTL["public_menu"])

def invalidate_public_menu_cache(subdomain: str):
    """Invalidate public menu cache for all languages"""
    pattern = f"public_menu:subdomain:{subdomain}*"
    cache.delete_pattern(pattern)

def get_settings_cache(tenant_id: int) -> Optional[dict]:
    """Get settings from cache"""
    key = cache._generate_key("settings", tenant_id=tenant_id)
    return cache.get(key)

def set_settings_cache(tenant_id: int, data: dict) -> bool:
    """Set settings in cache"""
    key = cache._generate_key("settings", tenant_id=tenant_id)
    return cache.set(key, data, CACHE_TTL["settings"])