from fastapi import Request, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models_final import Tenant
import re

def get_subdomain_from_origin(origin: str) -> Optional[str]:
    """Extract subdomain from origin URL"""
    if not origin:
        return None
    
    # Pattern to match subdomains of menuiq.io
    pattern = r'https?://([a-zA-Z0-9-]+)\.menuiq\.io'
    match = re.match(pattern, origin)
    
    if match:
        subdomain = match.group(1)
        # Exclude special subdomains
        if subdomain not in ['www', 'app', 'api']:
            return subdomain
    
    return None

def get_tenant_from_request(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[Tenant]:
    """Get tenant from request origin or subdomain"""
    origin = request.headers.get('origin', '')
    subdomain = get_subdomain_from_origin(origin)
    
    if subdomain:
        tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
        return tenant
    
    # Try to get from host header as fallback
    host = request.headers.get('host', '')
    if '.menuiq.io' in host:
        subdomain = host.split('.')[0]
        if subdomain not in ['www', 'app', 'api']:
            tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
            return tenant
    
    return None

async def tenant_context_middleware(request: Request, call_next):
    """Add tenant context to request state"""
    # Store the origin for later use
    request.state.origin = request.headers.get('origin', '')
    
    response = await call_next(request)
    return response