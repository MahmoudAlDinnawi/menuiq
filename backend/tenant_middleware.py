from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import re

def get_tenant_from_request(request: Request, db: Session) -> Optional[int]:
    """
    Extract tenant ID from request based on subdomain or header
    """
    # First check if there's a tenant header (for API access)
    tenant_header = request.headers.get("X-Tenant-ID")
    if tenant_header:
        return int(tenant_header)
    
    # Get host from request
    host = request.headers.get("host", "")
    
    # Extract subdomain
    # Expected format: subdomain.menuiq.io or subdomain.localhost:3000
    if "menuiq.io" in host:
        match = re.match(r"^([a-z0-9-]+)\.menuiq\.io", host)
        if match:
            subdomain = match.group(1)
            # Query database for tenant
            from models_multitenant import Tenant
            tenant = db.query(Tenant).filter(
                Tenant.subdomain == subdomain,
                Tenant.status == "active"
            ).first()
            if tenant:
                return tenant.id
    elif "localhost" in host:
        # For local development, use subdomain from localhost
        match = re.match(r"^([a-z0-9-]+)\.localhost", host)
        if match:
            subdomain = match.group(1)
            from models_multitenant import Tenant
            tenant = db.query(Tenant).filter(
                Tenant.subdomain == subdomain,
                Tenant.status == "active"
            ).first()
            if tenant:
                return tenant.id
    
    # Check for custom domain
    from models_multitenant import Tenant
    tenant = db.query(Tenant).filter(
        Tenant.domain == host.split(":")[0],  # Remove port if present
        Tenant.status == "active"
    ).first()
    if tenant:
        return tenant.id
    
    # Default tenant for backward compatibility (Entrecote)
    # Remove this in production
    if "entrecote" in host or host == "localhost:3000" or host == "localhost:8000":
        default_tenant = db.query(Tenant).filter(
            Tenant.subdomain == "entrecote"
        ).first()
        if default_tenant:
            return default_tenant.id
    
    return None

class TenantMiddleware:
    """
    Middleware to inject tenant_id into requests
    """
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Add tenant_id to scope
            request = Request(scope, receive)
            
            # Skip tenant check for system admin routes
            if request.url.path.startswith("/api/system"):
                await self.app(scope, receive, send)
                return
            
            # Get database session
            from database import SessionLocal
            db = SessionLocal()
            try:
                tenant_id = get_tenant_from_request(request, db)
                if tenant_id:
                    scope["tenant_id"] = tenant_id
                else:
                    # For now, allow requests without tenant for backward compatibility
                    # In production, you might want to return an error
                    scope["tenant_id"] = None
            finally:
                db.close()
        
        await self.app(scope, receive, send)