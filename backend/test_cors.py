#!/usr/bin/env python3
"""
Test CORS configuration
"""
from main import app
from fastapi.middleware.cors import CORSMiddleware

print("Checking CORS middleware configuration...")

# Find CORS middleware
cors_middleware = None
for middleware in app.user_middleware:
    if middleware.cls == CORSMiddleware:
        cors_middleware = middleware
        break

if cors_middleware:
    print("✅ CORS middleware found")
    print(f"   Options: {cors_middleware.options}")
else:
    print("❌ CORS middleware not found!")