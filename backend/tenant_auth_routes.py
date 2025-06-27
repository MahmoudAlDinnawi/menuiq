from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict
from pydantic import BaseModel, EmailStr
from database import get_db
from models_final import User, Tenant
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_tenant_user
)

router = APIRouter(prefix="/api/auth", tags=["tenant-auth"])

class TenantLoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_subdomain: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/tenant/login")
async def tenant_login(
    login_data: TenantLoginRequest,
    db: Session = Depends(get_db)
):
    """Tenant user login"""
    # Find tenant by subdomain
    tenant = db.query(Tenant).filter(
        Tenant.subdomain == login_data.tenant_subdomain
    ).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Find user
    user = db.query(User).filter(
        User.email == login_data.email,
        User.tenant_id == tenant.id
    ).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create token
    token_data = {
        "user_id": user.id,
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role,
        "user_type": "tenant_user"
    }
    
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain
            }
        }
    }

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.tenant_id
    ).first()
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan
        }
    }

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}