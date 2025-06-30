"""
Authentication and Authorization Module

This module handles:
- Password hashing and verification using bcrypt
- JWT token creation and validation
- User authentication for both tenant users and system admins
- Authorization checks and permission validation
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, SystemAdmin
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security configuration
# SECRET_KEY should be a strong random string in production
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"  # JWT signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token expires after 24 hours

# Password hashing context using bcrypt
# Automatically handles salt generation and secure password storage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token authentication scheme
# Expects tokens in Authorization: Bearer <token> header
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_dict(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Dict:
    """Get current user info as dict from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")
    
    if not user_id or not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return {
        "id": user_id,
        "type": user_type,
        "tenant_id": payload.get("tenant_id"),
        "email": payload.get("email"),
        "role": payload.get("role")
    }

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current tenant user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")
    
    if not user_id or user_type != "tenant_user":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or not a tenant user"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

def get_current_tenant_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current tenant user - just returns the user since get_current_user already validates"""
    return current_user

def get_current_admin(
    current_user: Dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
) -> Dict:
    """Get current system admin"""
    if current_user["type"] != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a system administrator"
        )
    
    admin = db.query(SystemAdmin).filter(
        SystemAdmin.id == current_user["id"]
    ).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    return current_user

def require_system_admin(current_user: Dict = Depends(get_current_admin)):
    """Dependency to require system admin access"""
    return current_user

def get_tenant_id_from_request(
    request,
    current_user: Dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
) -> Optional[int]:
    """Get tenant ID from user or subdomain"""
    # If system admin, they can specify tenant via header
    if current_user["type"] == "system_admin":
        tenant_header = request.headers.get("X-Tenant-ID")
        if tenant_header:
            return int(tenant_header)
    
    # Otherwise use user's tenant
    return current_user.get("tenant_id")