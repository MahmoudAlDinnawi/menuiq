"""
Simplified tenant routes for the dashboard
Clean implementation that matches the database structure
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import os
import shutil
from datetime import datetime
from pathlib import Path

from database import get_db
from models_multitenant import (
    Tenant, User, Category, MenuItem, Settings, 
    AllergenIcon, ItemAllergen
)
from pydantic_models import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    SettingsUpdate, SettingsResponse
)
from auth import get_current_user_dict

router = APIRouter(prefix="/api/tenant", tags=["tenant"])

# Helper function to get tenant
def get_tenant_from_user(user_dict: dict, db: Session) -> Tenant:
    """Get tenant from authenticated user"""
    tenant = db.query(Tenant).filter(
        Tenant.id == user_dict["tenant_id"]
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant.status != 'active':
        raise HTTPException(status_code=403, detail="Tenant is inactive")
    
    return tenant

# Dashboard Stats
@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the tenant"""
    tenant = get_tenant_from_user(current_user, db)
    
    # Get counts
    total_categories = db.query(func.count(Category.id)).filter(
        Category.tenant_id == tenant.id
    ).scalar() or 0
    
    total_items = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id
    ).scalar() or 0
    
    active_items = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.is_available == True
    ).scalar() or 0
    
    # Get recent items
    recent_items = db.query(MenuItem).filter(
        MenuItem.tenant_id == tenant.id
    ).order_by(MenuItem.created_at.desc()).limit(5).all()
    
    return {
        "tenant": {
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "status": tenant.status
        },
        "stats": {
            "total_categories": total_categories,
            "total_items": total_items,
            "active_items": active_items,
            "inactive_items": total_items - active_items
        },
        "limits": {
            "max_categories": tenant.max_categories,
            "max_items": tenant.max_menu_items,
            "categories_used": total_categories,
            "items_used": total_items
        },
        "recent_items": [
            {
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "category_id": item.category_id,
                "created_at": item.created_at
            } for item in recent_items
        ]
    }

# Categories CRUD
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get all categories for the tenant"""
    tenant = get_tenant_from_user(current_user, db)
    
    categories = db.query(Category).filter(
        Category.tenant_id == tenant.id
    ).order_by(Category.sort_order, Category.id).all()
    
    return categories

@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    tenant = get_tenant_from_user(current_user, db)
    
    # Check limits
    current_count = db.query(func.count(Category.id)).filter(
        Category.tenant_id == tenant.id
    ).scalar() or 0
    
    if current_count >= tenant.max_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Category limit reached. Maximum allowed: {tenant.max_categories}"
        )
    
    # Create category
    db_category = Category(
        tenant_id=tenant.id,
        name=category.name,
        description=category.description,
        image_url=category.image_url,
        is_active=category.is_active,
        sort_order=category.sort_order
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Update a category"""
    tenant = get_tenant_from_user(current_user, db)
    
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == tenant.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update fields
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    category.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Delete a category"""
    tenant = get_tenant_from_user(current_user, db)
    
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == tenant.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has items
    items_count = db.query(func.count(MenuItem.id)).filter(
        MenuItem.category_id == category_id
    ).scalar() or 0
    
    if items_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {items_count} menu items. Please move or delete items first."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

# Menu Items CRUD
@router.get("/menu-items", response_model=List[MenuItemResponse])
async def get_menu_items(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    is_available: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get menu items with optional filters"""
    tenant = get_tenant_from_user(current_user, db)
    
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
    
    if is_available is not None:
        query = query.filter(MenuItem.is_available == is_available)
    
    items = query.order_by(MenuItem.sort_order, MenuItem.id).offset(skip).limit(limit).all()
    
    # Load allergens for each item
    for item in items:
        item.allergens = []
        allergen_records = db.query(ItemAllergen).filter(
            ItemAllergen.menu_item_id == item.id
        ).all()
        for allergen in allergen_records:
            item.allergens.append({
                "id": allergen.id,
                "name": allergen.allergen_name
            })
    
    return items

@router.get("/menu-items/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: int,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get a specific menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Load allergens
    item.allergens = []
    allergen_records = db.query(ItemAllergen).filter(
        ItemAllergen.menu_item_id == item.id
    ).all()
    for allergen in allergen_records:
        item.allergens.append({
            "id": allergen.id,
            "name": allergen.allergen_name
        })
    
    return item

@router.post("/menu-items", response_model=MenuItemResponse)
async def create_menu_item(
    menu_item: MenuItemCreate,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Create a new menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    # Check limits
    current_count = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id
    ).scalar() or 0
    
    if current_count >= tenant.max_menu_items:
        raise HTTPException(
            status_code=400,
            detail=f"Menu item limit reached. Maximum allowed: {tenant.max_menu_items}"
        )
    
    # Verify category exists and belongs to tenant
    if menu_item.category_id:
        category = db.query(Category).filter(
            Category.id == menu_item.category_id,
            Category.tenant_id == tenant.id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Create menu item
    item_data = menu_item.dict(exclude={'allergen_ids'})
    db_item = MenuItem(
        tenant_id=tenant.id,
        **item_data
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Add allergens if provided
    if hasattr(menu_item, 'allergen_ids') and menu_item.allergen_ids:
        for allergen_id in menu_item.allergen_ids:
            # Get allergen name from AllergenIcon
            allergen_icon = db.query(AllergenIcon).filter(
                AllergenIcon.id == allergen_id,
                AllergenIcon.tenant_id == tenant.id
            ).first()
            
            if allergen_icon:
                allergen = ItemAllergen(
                    menu_item_id=db_item.id,
                    allergen_name=allergen_icon.name
                )
                db.add(allergen)
        
        db.commit()
    
    # Load allergens for response
    db_item.allergens = []
    allergen_records = db.query(ItemAllergen).filter(
        ItemAllergen.menu_item_id == db_item.id
    ).all()
    for allergen in allergen_records:
        db_item.allergens.append({
            "id": allergen.id,
            "name": allergen.allergen_name
        })
    
    return db_item

@router.put("/menu-items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    item_update: MenuItemUpdate,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Update a menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify category if being changed
    if item_update.category_id is not None:
        category = db.query(Category).filter(
            Category.id == item_update.category_id,
            Category.tenant_id == tenant.id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Update basic fields
    update_data = item_update.dict(exclude={'allergen_ids'}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    
    # Update allergens if provided
    if hasattr(item_update, 'allergen_ids') and item_update.allergen_ids is not None:
        # Remove existing allergens
        db.query(ItemAllergen).filter(
            ItemAllergen.menu_item_id == item_id
        ).delete()
        
        # Add new allergens
        for allergen_id in item_update.allergen_ids:
            allergen_icon = db.query(AllergenIcon).filter(
                AllergenIcon.id == allergen_id,
                AllergenIcon.tenant_id == tenant.id
            ).first()
            
            if allergen_icon:
                allergen = ItemAllergen(
                    menu_item_id=item_id,
                    allergen_name=allergen_icon.name
                )
                db.add(allergen)
    
    db.commit()
    db.refresh(item)
    
    # Load allergens for response
    item.allergens = []
    allergen_records = db.query(ItemAllergen).filter(
        ItemAllergen.menu_item_id == item.id
    ).all()
    for allergen in allergen_records:
        item.allergens.append({
            "id": allergen.id,
            "name": allergen.allergen_name
        })
    
    return item

@router.delete("/menu-items/{item_id}")
async def delete_menu_item(
    item_id: int,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Delete a menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Delete allergen associations
    db.query(ItemAllergen).filter(
        ItemAllergen.menu_item_id == item_id
    ).delete()
    
    # Delete the item
    db.delete(item)
    db.commit()
    
    return {"message": "Menu item deleted successfully"}

# Image Upload
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    type: str = "item",  # 'item' or 'category'
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Upload an image for menu items or categories"""
    tenant = get_tenant_from_user(current_user, db)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Create tenant directory
    tenant_dir = UPLOAD_DIR / f"tenant_{tenant.id}"
    tenant_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split('.')[-1]
    filename = f"{type}_{timestamp}.{file_extension}"
    file_path = tenant_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL
    return {
        "filename": filename,
        "url": f"/uploads/tenant_{tenant.id}/{filename}",
        "type": type
    }

# Settings
@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get tenant settings"""
    tenant = get_tenant_from_user(current_user, db)
    
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = Settings(
            tenant_id=tenant.id,
            currency="SAR",
            tax_rate=15.0,
            language="en",
            primary_color="#00594f",
            secondary_color="#d4af37",
            font_family="Playfair Display",
            footer_enabled=True,
            show_calories=True,
            show_preparation_time=True,
            show_allergens=True,
            enable_search=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Update tenant settings"""
    tenant = get_tenant_from_user(current_user, db)
    
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    if not settings:
        # Create settings if they don't exist
        settings = Settings(tenant_id=tenant.id)
        db.add(settings)
    
    # Update fields
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(settings)
    
    return settings

# Allergen Icons
@router.get("/allergen-icons")
async def get_allergen_icons(
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get allergen icons for the tenant"""
    tenant = get_tenant_from_user(current_user, db)
    
    icons = db.query(AllergenIcon).filter(
        AllergenIcon.tenant_id == tenant.id
    ).all()
    
    # If no custom icons, return default ones
    if not icons:
        default_icons = [
            {"id": 1, "name": "gluten", "display_name": "Gluten", "icon": "🌾"},
            {"id": 2, "name": "dairy", "display_name": "Dairy", "icon": "🥛"},
            {"id": 3, "name": "eggs", "display_name": "Eggs", "icon": "🥚"},
            {"id": 4, "name": "fish", "display_name": "Fish", "icon": "🐟"},
            {"id": 5, "name": "shellfish", "display_name": "Shellfish", "icon": "🦐"},
            {"id": 6, "name": "tree_nuts", "display_name": "Tree Nuts", "icon": "🌰"},
            {"id": 7, "name": "peanuts", "display_name": "Peanuts", "icon": "🥜"},
            {"id": 8, "name": "soy", "display_name": "Soy", "icon": "🌱"},
            {"id": 9, "name": "sesame", "display_name": "Sesame", "icon": "🌻"}
        ]
        return default_icons
    
    # Format custom icons
    return [
        {
            "id": icon.id,
            "name": icon.name,
            "display_name": icon.display_name or icon.name,
            "display_name_ar": icon.display_name_ar,
            "icon": icon.icon_url or "🔸"
        } for icon in icons
    ]