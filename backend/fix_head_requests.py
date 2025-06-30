#!/usr/bin/env python3
"""
Add HEAD request support to FastAPI endpoints
"""

# Add this to your main.py file after including routers

from fastapi import Request, Response
from fastapi.routing import APIRoute

def add_head_support(app):
    """
    Add HEAD support to all GET endpoints
    """
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            if "GET" in route.methods:
                # Add HEAD method support
                route.methods.add("HEAD")
            routes.append(route)
    
    return app

# Usage in main.py:
# After including all routers, add:
# app = add_head_support(app)