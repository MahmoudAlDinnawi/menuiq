from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import os

from database import get_db
from models import (
    Tenant, User, MenuItem, Category, 
    ActivityLog, Settings, SystemAdmin, AllergenIcon
)
from auth import (
    get_current_admin, require_system_admin, 
    get_password_hash, create_access_token
)

router = APIRouter(prefix="/api/admin", tags=["system-admin"])

# Pydantic models

class TenantCreate(BaseModel):
    name: str
    subdomain: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    plan: str = "free"
    status: str = "active"
    # Admin user details
    admin_email: EmailStr
    admin_password: str
    admin_name: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    max_menu_items: Optional[int] = None
    max_categories: Optional[int] = None

# Pydantic models for tenant users
class TenantUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"  # admin, editor, viewer

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SystemAdminCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

# Authentication endpoints
@router.post("/login")
async def system_admin_login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """System admin login"""
    from auth import verify_password
    
    # Find admin
    admin = db.query(SystemAdmin).filter(
        SystemAdmin.email == login_data.email
    ).first()
    
    if not admin or not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create token
    token_data = {
        "user_id": admin.id,
        "email": admin.email,
        "user_type": "system_admin"
    }
    
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "username": admin.username
        }
    }

@router.post("/auth/register", dependencies=[Depends(require_system_admin)])
async def create_system_admin(
    admin_data: SystemAdminCreate,
    db: Session = Depends(get_db)
):
    """Create a new system admin (only existing admins can do this)"""
    # Check if email exists
    existing = db.query(SystemAdmin).filter(
        SystemAdmin.email == admin_data.email
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create admin
    admin = SystemAdmin(
        email=admin_data.email,
        username=admin_data.username,
        password_hash=get_password_hash(admin_data.password)
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "username": admin.username,
        "message": "System admin created successfully"
    }

@router.get("/stats", dependencies=[Depends(require_system_admin)])
async def get_system_stats(db: Session = Depends(get_db)):
    """Get system-wide statistics"""
    total_tenants = db.query(func.count(Tenant.id)).scalar()
    active_tenants = db.query(func.count(Tenant.id)).filter(Tenant.status == "active").scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_menu_items = db.query(func.count(MenuItem.id)).scalar()
    
    # Calculate MRR (Monthly Recurring Revenue)
    # This is simplified - in production, you'd have a proper billing system
    plan_prices = {
        "free": 0,
        "basic": 29,
        "premium": 99,
        "enterprise": 299
    }
    
    revenue = 0
    for plan, price in plan_prices.items():
        count = db.query(func.count(Tenant.id)).filter(
            Tenant.plan == plan,
            Tenant.status == "active"
        ).scalar()
        revenue += count * price
    
    return {
        "totalTenants": total_tenants,
        "activeTenants": active_tenants,
        "totalUsers": total_users,
        "totalMenuItems": total_menu_items,
        "revenue": revenue
    }

@router.get("/tenants")
async def get_tenants(db: Session = Depends(get_db)):
    """Get all tenants"""
    tenants = db.query(Tenant).all()
    
    result = []
    for tenant in tenants:
        # Get counts
        menu_items_count = db.query(func.count(MenuItem.id)).filter(
            MenuItem.tenant_id == tenant.id
        ).scalar()
        users_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant.id
        ).scalar()
        
        result.append({
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "domain": tenant.domain,
            "contact_email": tenant.contact_email,
            "contact_phone": tenant.contact_phone,
            "plan": tenant.plan,
            "status": tenant.status,
            "menu_items_count": menu_items_count,
            "users_count": users_count,
            "created_at": tenant.created_at,
            "updated_at": tenant.updated_at
        })
    
    return result

@router.post("/tenants")
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_admin: Dict = Depends(get_current_admin)
):
    """Create a new tenant"""
    # Check if subdomain exists
    existing = db.query(Tenant).filter(Tenant.subdomain == tenant_data.subdomain).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain already exists"
        )
    
    # Set plan limits
    plan_limits = {
        "free": {"max_menu_items": 50, "max_categories": 10},
        "basic": {"max_menu_items": 200, "max_categories": 20},
        "premium": {"max_menu_items": 1000, "max_categories": 50},
        "enterprise": {"max_menu_items": 10000, "max_categories": 200}
    }
    
    limits = plan_limits.get(tenant_data.plan, plan_limits["free"])
    
    # Create tenant
    tenant = Tenant(
        name=tenant_data.name,
        subdomain=tenant_data.subdomain,
        contact_email=tenant_data.contact_email,
        contact_phone=tenant_data.contact_phone,
        plan=tenant_data.plan,
        status=tenant_data.status,
        max_menu_items=limits["max_menu_items"],
        max_categories=limits["max_categories"]
    )
    
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    # Create default settings for tenant
    settings = Settings(
        tenant_id=tenant.id,
        currency="SAR",
        tax_rate=15.0,
        primary_color="#00594f"
    )
    db.add(settings)
    
    # Create default categories
    default_categories = [
        {"name": "Appetizers", "description": "Start your meal with our delicious appetizers", "sort_order": 1},
        {"name": "Main Courses", "description": "Hearty and satisfying main dishes", "sort_order": 2},
        {"name": "Desserts", "description": "Sweet treats to end your meal", "sort_order": 3},
        {"name": "Beverages", "description": "Refreshing drinks and beverages", "sort_order": 4}
    ]
    
    for cat_data in default_categories:
        category = Category(
            tenant_id=tenant.id,
            is_active=True,
            **cat_data
        )
        db.add(category)
    
    # Create default allergen icons
    default_allergens = [
        {"name": "milk", "display_name": "Milk", "display_name_ar": "حليب", 
         "icon_url": "/src/assets/allergy_icons/milk.svg", "sort_order": 1},
        {"name": "eggs", "display_name": "Eggs", "display_name_ar": "بيض", 
         "icon_url": "/src/assets/allergy_icons/egg.svg", "sort_order": 2},
        {"name": "fish", "display_name": "Fish", "display_name_ar": "سمك", 
         "icon_url": "/src/assets/allergy_icons/fish.svg", "sort_order": 3},
        {"name": "shellfish", "display_name": "Shellfish", "display_name_ar": "محار", 
         "icon_url": "/src/assets/allergy_icons/Shellfish.svg", "sort_order": 4},
        {"name": "tree_nuts", "display_name": "Tree Nuts", "display_name_ar": "مكسرات", 
         "icon_url": "/src/assets/allergy_icons/nuts.svg", "sort_order": 5},
        {"name": "wheat", "display_name": "Wheat/Gluten", "display_name_ar": "قمح/جلوتين", 
         "icon_url": "/src/assets/allergy_icons/gulten.svg", "sort_order": 6},
        {"name": "soybeans", "display_name": "Soybeans", "display_name_ar": "فول الصويا", 
         "icon_url": "/src/assets/allergy_icons/soy.svg", "sort_order": 7},
        {"name": "sesame", "display_name": "Sesame", "display_name_ar": "سمسم", 
         "icon_url": "/src/assets/allergy_icons/sesame.svg", "sort_order": 8},
        {"name": "mustard", "display_name": "Mustard", "display_name_ar": "خردل", 
         "icon_url": "/src/assets/allergy_icons/mustard.svg", "sort_order": 9},
        {"name": "salt", "display_name": "Salt", "display_name_ar": "ملح", 
         "icon_url": "/src/assets/allergy_icons/salt.svg", "sort_order": 10}
    ]
    
    for allergen_data in default_allergens:
        allergen = AllergenIcon(
            tenant_id=tenant.id,
            is_active=True,
            **allergen_data
        )
        db.add(allergen)
    
    # Create admin user with provided credentials
    existing_user = db.query(User).filter(User.email == tenant_data.admin_email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin email already exists"
        )
    
    # Hash the password
    hashed_password = get_password_hash(tenant_data.admin_password)
    
    # Create the admin user with only essential fields
    user_created = False
    try:
        # First, let's create a minimal user
        admin_user = User(
            tenant_id=tenant.id,
            email=tenant_data.admin_email,
            username=tenant_data.admin_name or f"{tenant.name} Admin",
            password_hash=hashed_password,
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.flush()  # Try to flush without committing
        
        # If flush succeeds, commit
        db.commit()
        db.refresh(admin_user)
        user_created = True
    except Exception as e:
        db.rollback()
        print(f"Failed to create user with ORM: {str(e)}")
        
        # Try direct SQL insert as fallback
        try:
            db.execute(
                text("""
                    INSERT INTO users (tenant_id, email, username, password_hash, role, is_active)
                    VALUES (:tenant_id, :email, :username, :password_hash, :role, :is_active)
                """),
                {
                    "tenant_id": tenant.id,
                    "email": tenant_data.admin_email,
                    "username": tenant_data.admin_name or f"{tenant.name} Admin",
                    "password_hash": hashed_password,
                    "role": "admin",
                    "is_active": True
                }
            )
            db.commit()
            user_created = True
            print(f"Created user via direct SQL")
        except Exception as e2:
            db.rollback()
            print(f"Failed to create user with SQL: {str(e2)}")
        
    # Log activity
    try:
        log = ActivityLog(
            admin_id=current_admin["id"],
            action="create_tenant",
            entity_type="tenant",
            entity_id=tenant.id,
            details={"tenant_name": tenant.name, "subdomain": tenant.subdomain}
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to log activity: {str(e)}")
    
    response = {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "message": "Tenant created successfully"
    }
    
    if user_created:
        response["admin_user"] = {
            "email": tenant_data.admin_email,
            "message": "User created successfully. Password has been set."
        }
    else:
        response["admin_user"] = {
            "email": tenant_data.admin_email,
            "message": "User creation failed. Please create manually.",
            "error": True
        }
        response["warning"] = "Tenant created but admin user creation failed. Please create the user manually."
    
    return response

@router.put("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_admin: Dict = Depends(get_current_admin)
):
    """Update a tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Update fields
    update_data = tenant_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    tenant.updated_at = datetime.utcnow()
    
    # Log activity
    log = ActivityLog(
        admin_id=current_admin["id"],
        tenant_id=tenant_id,
        action="update_tenant",
        entity_type="tenant",
        entity_id=tenant_id,
        details=update_data
    )
    db.add(log)
    
    db.commit()
    db.refresh(tenant)
    
    return {"message": "Tenant updated successfully", "tenant": tenant}

@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_admin: Dict = Depends(get_current_admin)
):
    """Delete a tenant and all associated data"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    tenant_name = tenant.name
    
    # Delete tenant (cascade will handle related data)
    db.delete(tenant)
    
    # Log activity
    log = ActivityLog(
        admin_id=current_admin["id"],
        action="delete_tenant",
        entity_type="tenant",
        entity_id=tenant_id,
        details={"tenant_name": tenant_name}
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "Tenant deleted successfully"}