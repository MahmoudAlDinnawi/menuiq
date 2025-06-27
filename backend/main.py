from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from typing import List, Optional
import os
from datetime import datetime, timedelta
import shutil
from pathlib import Path
import bcrypt
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production')

# Import database and models
from database import get_db, engine
from models_final import (
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
    get_current_user, get_current_admin
)
# Import routers
from system_admin_routes import router as system_admin_router
from tenant_auth_routes import router as tenant_auth_router
from public_routes import router as public_router
from tenant_routes_v2 import router as tenant_router_v2
from public_menu_routes import router as public_menu_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MenuIQ API - PostgreSQL")

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# For production, allow all subdomains of menuiq.io
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://menuiq.io",
        "https://www.menuiq.io", 
        "https://app.menuiq.io",
        "https://api.menuiq.io",
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_origin_regex=r"https://[a-zA-Z0-9-]+\.menuiq\.io",  # This allows any subdomain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(system_admin_router)
app.include_router(tenant_auth_router)
app.include_router(public_router)
app.include_router(tenant_router_v2)
app.include_router(public_menu_router)

# Helper Functions
def get_tenant_by_subdomain(db: Session, subdomain: str) -> Tenant:
    try:
        tenant = db.query(Tenant).filter(
            func.lower(Tenant.subdomain) == func.lower(subdomain)
        ).first()
        if not tenant:
            raise HTTPException(status_code=404, detail=f"Tenant '{subdomain}' not found")
        # Check if tenant is active
        if tenant.status != 'active':
            raise HTTPException(status_code=403, detail="Tenant is inactive")
        return tenant
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting tenant by subdomain {subdomain}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

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

# System Admin Routes are now handled by system_admin_router

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
        password_hash=hashed_password,
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
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    access_token = create_access_token(data={
        "sub": user.email,
        "user_id": user.id,
        "user_type": "tenant_user",
        "tenant_id": tenant.id,
        "email": user.email,
        "role": user.role,
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
    try:
        tenant = get_tenant_by_subdomain(db, subdomain)
        categories = db.query(Category).filter(
            Category.tenant_id == tenant.id
        ).order_by(Category.sort_order, Category.id).all()
        return categories
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_categories for {subdomain}: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        # Return the actual error for debugging
        error_detail = {
            "error": str(e),
            "type": type(e).__name__,
            "subdomain": subdomain
        }
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/api/{subdomain}/categories", response_model=CategoryResponse)
def create_category(
    subdomain: str,
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify the subdomain matches the user's tenant
    tenant = get_tenant_by_subdomain(db, subdomain)
    if current_user.tenant_id != tenant.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_category = Category(
        name=category.name,
        description=category.description,
        image_url=category.image_url,
        is_active=category.is_active,
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
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_menu_items for {subdomain}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return detailed error for debugging
        error_detail = {
            "error": str(e),
            "type": type(e).__name__,
            "subdomain": subdomain
        }
        raise HTTPException(status_code=500, detail=error_detail)

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

# Allergen Icons
@app.get("/api/{subdomain}/allergen-icons")
def get_allergen_icons(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get allergen icons for a tenant"""
    try:
        tenant = get_tenant_by_subdomain(db, subdomain)
        
        # Get tenant-specific allergen icons
        icons = db.query(AllergenIcon).filter(
            AllergenIcon.tenant_id == tenant.id
        ).all()
        
        # If no tenant-specific icons, return default ones
        if not icons:
            # Return default allergen icons
            default_icons = [
                {"id": 1, "name": "Gluten", "icon": "🌾", "display_name": "Gluten"},
                {"id": 2, "name": "Dairy", "icon": "🥛", "display_name": "Dairy"},
                {"id": 3, "name": "Eggs", "icon": "🥚", "display_name": "Eggs"},
                {"id": 4, "name": "Fish", "icon": "🐟", "display_name": "Fish"},
                {"id": 5, "name": "Shellfish", "icon": "🦐", "display_name": "Shellfish"},
                {"id": 6, "name": "Tree Nuts", "icon": "🌰", "display_name": "Tree Nuts"},
                {"id": 7, "name": "Peanuts", "icon": "🥜", "display_name": "Peanuts"},
                {"id": 8, "name": "Soy", "icon": "🌱", "display_name": "Soy"},
                {"id": 9, "name": "Sesame", "icon": "🌻", "display_name": "Sesame"}
            ]
            return {"allergens": default_icons}
        
        # Return tenant-specific icons
        return {
            "allergens": [
                {
                    "id": icon.id,
                    "name": icon.name,
                    "icon": icon.icon or "🔸",
                    "display_name": icon.display_name or icon.name,
                    "icon_url": icon.icon_url
                } for icon in icons
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_allergen_icons: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

# Debug endpoint to list all routes
@app.get("/api/debug/routes")
def list_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if hasattr(route, "methods") else []
            })
    return {"routes": routes}

# Debug endpoint to check database schema
@app.get("/api/debug/schema/{table_name}")
def check_schema(table_name: str, db: Session = Depends(get_db)):
    """Check the actual columns in a table"""
    try:
        # Get one row to see actual data
        if table_name == "categories":
            sample = db.query(Category).first()
            if sample:
                return {
                    "table": table_name,
                    "sample_data": {
                        "id": sample.id if hasattr(sample, 'id') else None,
                        "tenant_id": sample.tenant_id if hasattr(sample, 'tenant_id') else None,
                        "value": sample.value if hasattr(sample, 'value') else None,
                        "label": sample.label if hasattr(sample, 'label') else None,
                        "label_ar": sample.label_ar if hasattr(sample, 'label_ar') else None,
                        "icon": sample.icon if hasattr(sample, 'icon') else None,
                        "sort_order": sample.sort_order if hasattr(sample, 'sort_order') else None,
                        "name": sample.name if hasattr(sample, 'name') else None,
                        "description": sample.description if hasattr(sample, 'description') else None,
                    },
                    "actual_attributes": dir(sample)
                }
        elif table_name == "menu_items":
            sample = db.query(MenuItem).first()
            if sample:
                return {
                    "table": table_name,
                    "sample_data": {
                        "id": sample.id if hasattr(sample, 'id') else None,
                        "name": sample.name if hasattr(sample, 'name') else None,
                        "price": sample.price if hasattr(sample, 'price') else None,
                        "image": sample.image if hasattr(sample, 'image') else None,
                        "image_url": sample.image_url if hasattr(sample, 'image_url') else None,
                    },
                    "has_attributes": {
                        "created_at": hasattr(sample, 'created_at'),
                        "updated_at": hasattr(sample, 'updated_at'),
                        "is_featured": hasattr(sample, 'is_featured'),
                        "is_spicy": hasattr(sample, 'is_spicy'),
                    }
                }
        return {"table": table_name, "no_data": True}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)