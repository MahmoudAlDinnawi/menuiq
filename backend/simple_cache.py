"""
Simple In-Memory Cache Module

This module provides a simple in-memory caching solution when Redis is not available.
It uses Python's built-in dict with TTL support.
"""

import time
from typing import Optional, Any, Dict
from functools import wraps
import threading

class SimpleCache:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
        
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if cache entry is expired"""
        if 'expires_at' not in entry:
            return False
        return time.time() > entry['expires_at']
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self.lock:
            if key not in self.cache:
                return None
            
            entry = self.cache[key]
            if self._is_expired(entry):
                del self.cache[key]
                return None
            
            return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL (in seconds)"""
        with self.lock:
            entry = {'value': value}
            if ttl:
                entry['expires_at'] = time.time() + ttl
            
            self.cache[key] = entry
            return True
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern (simple prefix match)"""
        with self.lock:
            keys_to_delete = [k for k in self.cache.keys() if k.startswith(pattern.replace('*', ''))]
            for key in keys_to_delete:
                del self.cache[key]
            return True
    
    def clear(self):
        """Clear all cache"""
        with self.lock:
            self.cache.clear()
    
    def cleanup_expired(self):
        """Remove expired entries"""
        with self.lock:
            expired_keys = [k for k, v in self.cache.items() if self._is_expired(v)]
            for key in expired_keys:
                del self.cache[key]

# Singleton instance
cache = SimpleCache()

# Cache TTL settings (in seconds)
CACHE_TTL = {
    "public_menu": 300,      # 5 minutes for public menu data
    "settings": 600,         # 10 minutes for settings
    "categories": 300,       # 5 minutes for categories
    "menu_items": 300,       # 5 minutes for menu items
}

def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(**kwargs):
            # Generate cache key
            key_parts = [f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None]
            cache_key = f"{prefix}:" + ":".join(key_parts) if key_parts else prefix
            
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

# Helper functions
def invalidate_tenant_cache(tenant_id: int):
    """Invalidate all cache entries for a tenant"""
    patterns = [
        f"public_menu:tenant_id:{tenant_id}",
        f"settings:tenant_id:{tenant_id}",
        f"categories:tenant_id:{tenant_id}",
        f"menu_items:tenant_id:{tenant_id}",
    ]
    
    for pattern in patterns:
        cache.delete_pattern(pattern)

def invalidate_public_menu_cache(subdomain: str):
    """Invalidate public menu cache for a subdomain"""
    cache.delete_pattern(f"public_menu:subdomain:{subdomain}")