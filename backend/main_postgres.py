from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from typing import List, Optional
import os
from datetime import datetime
import shutil
from pathlib import Path
import bcrypt
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.postgres' if os.getenv('ENVIRONMENT') != 'production' else '.env.production.postgres')

# Import database and models
from database_postgres import get_db, engine
from models_multitenant import (
    Base, Tenant, User, SystemAdmin, Category, MenuItem, 
    ItemAllergen, Settings, AllergenIcon, ActivityLog
)
from pydantic_models import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    UserCreate, UserLogin, UserResponse,
    TenantCreate, TenantUpdate, TenantResponse,
    SystemAdminCreate, SystemAdminLogin, SystemAdminResponse,
    SettingsUpdate, SettingsResponse,
    AllergenIconCreate, AllergenIconUpdate, AllergenIconResponse,
    ChangePasswordRequest
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_admin, verify_token
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MenuIQ API - PostgreSQL")

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Helper Functions
def get_tenant_by_subdomain(db: Session, subdomain: str) -> Tenant:
    tenant = db.query(Tenant).filter(
        func.lower(Tenant.subdomain) == func.lower(subdomain)
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="Tenant is inactive")
    return tenant

def log_activity(db: Session, action: str, entity_type: str, entity_id: int = None,
                tenant_id: int = None, user_id: int = None, admin_id: int = None,
                details: str = None):
    log = ActivityLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        tenant_id=tenant_id,
        user_id=user_id,
        admin_id=admin_id,
        details=details
    )
    db.add(log)
    db.commit()

# System Admin Routes
@app.post("/api/admin/login", response_model=dict)
def admin_login(admin_data: SystemAdminLogin, db: Session = Depends(get_db)):
    admin = db.query(SystemAdmin).filter(SystemAdmin.email == admin_data.email).first()
    
    if not admin or not verify_password(admin_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    access_token = create_access_token(data={
        "sub": admin.email,
        "admin_id": admin.id,
        "is_admin": True
    })
    
    log_activity(db, "login", "system_admin", admin.id, admin_id=admin.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": SystemAdminResponse.from_orm(admin)
    }

@app.post("/api/admin/tenants", response_model=TenantResponse)
def create_tenant(
    tenant: TenantCreate,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if subdomain already exists
    existing = db.query(Tenant).filter(
        func.lower(Tenant.subdomain) == func.lower(tenant.subdomain)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subdomain already exists")
    
    db_tenant = Tenant(**tenant.dict())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    
    # Create default settings for the tenant
    settings = Settings(tenant_id=db_tenant.id)
    db.add(settings)
    db.commit()
    
    log_activity(db, "create", "tenant", db_tenant.id, admin_id=current_admin.id,
                details=f"Created tenant: {tenant.name}")
    
    return db_tenant

@app.get("/api/admin/tenants", response_model=List[TenantResponse])
def list_tenants(
    skip: int = 0,
    limit: int = 100,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    tenants = db.query(Tenant).offset(skip).limit(limit).all()
    return tenants

@app.put("/api/admin/tenants/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    tenant_update: TenantUpdate,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    for key, value in tenant_update.dict(exclude_unset=True).items():
        setattr(tenant, key, value)
    
    db.commit()
    db.refresh(tenant)
    
    log_activity(db, "update", "tenant", tenant_id, admin_id=current_admin.id)
    
    return tenant

# Tenant User Routes
@app.post("/api/{subdomain}/register", response_model=UserResponse)
def register_user(
    subdomain: str,
    user: UserCreate,
    db: Session = Depends(get_db)
):
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Check if email already exists for this tenant
    existing = db.query(User).filter(
        User.email == user.email,
        User.tenant_id == tenant.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        tenant_id=tenant.id,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_activity(db, "register", "user", db_user.id, tenant_id=tenant.id,
                details=f"New user registered: {user.email}")
    
    return db_user

@app.post("/api/{subdomain}/login", response_model=dict)
def login(
    subdomain: str,
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    user = db.query(User).filter(
        User.email == user_data.email,
        User.tenant_id == tenant.id
    ).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    access_token = create_access_token(data={
        "sub": user.email,
        "user_id": user.id,
        "tenant_id": tenant.id,
        "subdomain": subdomain
    })
    
    log_activity(db, "login", "user", user.id, tenant_id=tenant.id, user_id=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

# Menu Categories
@app.get("/api/{subdomain}/categories", response_model=List[CategoryResponse])
def get_categories(
    subdomain: str,
    db: Session = Depends(get_db)
):
    tenant = get_tenant_by_subdomain(db, subdomain)
    categories = db.query(Category).filter(
        Category.tenant_id == tenant.id
    ).order_by(Category.sort_order, Category.id).all()
    return categories

@app.post("/api/{subdomain}/categories", response_model=CategoryResponse)
def create_category(
    subdomain: str,
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_category = Category(
        name=category.name,
        description=category.description,
        tenant_id=current_user.tenant_id,
        sort_order=category.sort_order
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    log_activity(db, "create", "category", db_category.id, 
                tenant_id=current_user.tenant_id, user_id=current_user.id,
                details=f"Created category: {category.name}")
    
    return db_category

@app.put("/api/{subdomain}/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    subdomain: str,
    category_id: int,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category_update.dict(exclude_unset=True).items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    
    log_activity(db, "update", "category", category_id,
                tenant_id=current_user.tenant_id, user_id=current_user.id)
    
    return category

@app.delete("/api/{subdomain}/categories/{category_id}")
def delete_category(
    subdomain: str,
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has menu items
    items_count = db.query(MenuItem).filter(MenuItem.category_id == category_id).count()
    if items_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category with {items_count} menu items"
        )
    
    db.delete(category)
    db.commit()
    
    log_activity(db, "delete", "category", category_id,
                tenant_id=current_user.tenant_id, user_id=current_user.id)
    
    return {"message": "Category deleted successfully"}

# Menu Items
@app.get("/api/{subdomain}/menu-items", response_model=List[MenuItemResponse])
def get_menu_items(
    subdomain: str,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    query = db.query(MenuItem).filter(MenuItem.tenant_id == tenant.id)
    
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    
    if search:
        query = query.filter(
            or_(
                MenuItem.name.ilike(f"%{search}%"),
                MenuItem.description.ilike(f"%{search}%")
            )
        )
    
    items = query.offset(skip).limit(limit).all()
    return items

@app.post("/api/{subdomain}/menu-items", response_model=MenuItemResponse)
def create_menu_item(
    subdomain: str,
    menu_item: MenuItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify category belongs to tenant
    category = db.query(Category).filter(
        Category.id == menu_item.category_id,
        Category.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_item = MenuItem(
        **menu_item.dict(exclude={'allergen_ids'}),
        tenant_id=current_user.tenant_id
    )
    db.add(db_item)
    db.commit()
    
    # Add allergens
    if menu_item.allergen_ids:
        for allergen_id in menu_item.allergen_ids:
            db_allergen = ItemAllergen(
                item_id=db_item.id,
                allergen_id=allergen_id
            )
            db.add(db_allergen)
        db.commit()
    
    db.refresh(db_item)
    
    log_activity(db, "create", "menu_item", db_item.id,
                tenant_id=current_user.tenant_id, user_id=current_user.id,
                details=f"Created menu item: {menu_item.name}")
    
    return db_item

@app.put("/api/{subdomain}/menu-items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    subdomain: str,
    item_id: int,
    item_update: MenuItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == current_user.tenant_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Update basic fields
    update_data = item_update.dict(exclude={'allergen_ids'}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    # Update allergens if provided
    if item_update.allergen_ids is not None:
        # Remove existing allergens
        db.query(ItemAllergen).filter(ItemAllergen.item_id == item_id).delete()
        
        # Add new allergens
        for allergen_id in item_update.allergen_ids:
            db_allergen = ItemAllergen(
                item_id=item_id,
                allergen_id=allergen_id
            )
            db.add(db_allergen)
    
    db.commit()
    db.refresh(item)
    
    log_activity(db, "update", "menu_item", item_id,
                tenant_id=current_user.tenant_id, user_id=current_user.id)
    
    return item

@app.delete("/api/{subdomain}/menu-items/{item_id}")
def delete_menu_item(
    subdomain: str,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == current_user.tenant_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Delete allergen associations
    db.query(ItemAllergen).filter(ItemAllergen.item_id == item_id).delete()
    
    # Delete the item
    db.delete(item)
    db.commit()
    
    log_activity(db, "delete", "menu_item", item_id,
                tenant_id=current_user.tenant_id, user_id=current_user.id)
    
    return {"message": "Menu item deleted successfully"}

# Image Upload
@app.post("/api/{subdomain}/upload-image")
async def upload_image(
    subdomain: str,
    file: UploadFile = File(...),
    item_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Create tenant directory
    tenant_dir = UPLOAD_DIR / f"tenant_{current_user.tenant_id}"
    tenant_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = tenant_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update menu item if item_id provided
    if item_id:
        item = db.query(MenuItem).filter(
            MenuItem.id == item_id,
            MenuItem.tenant_id == current_user.tenant_id
        ).first()
        if item:
            item.image_url = f"/uploads/tenant_{current_user.tenant_id}/{filename}"
            db.commit()
    
    return {
        "filename": filename,
        "url": f"/uploads/tenant_{current_user.tenant_id}/{filename}"
    }

# Settings
@app.get("/api/{subdomain}/settings", response_model=SettingsResponse)
def get_settings(
    subdomain: str,
    db: Session = Depends(get_db)
):
    tenant = get_tenant_by_subdomain(db, subdomain)
    settings = db.query(Settings).filter(Settings.tenant_id == tenant.id).first()
    
    if not settings:
        # Create default settings
        settings = Settings(tenant_id=tenant.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@app.put("/api/{subdomain}/settings", response_model=SettingsResponse)
def update_settings(
    subdomain: str,
    settings_update: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(Settings).filter(
        Settings.tenant_id == current_user.tenant_id
    ).first()
    
    if not settings:
        settings = Settings(tenant_id=current_user.tenant_id)
        db.add(settings)
        db.commit()
    
    for key, value in settings_update.dict(exclude_unset=True).items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    
    log_activity(db, "update", "settings", settings.id,
                tenant_id=current_user.tenant_id, user_id=current_user.id)
    
    return settings

# Health Check
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)