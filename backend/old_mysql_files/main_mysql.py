from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import shutil
from datetime import datetime
import uuid
from database import get_db, engine, Base, SessionLocal
from models_multitenant import MenuItem as DBMenuItem, Category as DBCategory, ItemAllergen, Settings as DBSettings, AllergenIcon, Tenant, User
from pydantic import BaseModel
from auth import get_current_tenant_user
import system_admin_routes
import tenant_auth_routes
import public_routes

app = FastAPI(title="MenuIQ API - Multi-tenant Restaurant Menu System")

# Include system admin routes
app.include_router(system_admin_routes.router)

# Include tenant authentication routes
app.include_router(tenant_auth_routes.router)

# Include public routes
app.include_router(public_routes.router)

# Create directories for uploads
UPLOAD_DIR = "uploads"
ALLERGEN_ICONS_DIR = os.path.join(UPLOAD_DIR, "allergen-icons")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
if not os.path.exists(ALLERGEN_ICONS_DIR):
    os.makedirs(ALLERGEN_ICONS_DIR)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure CORS for MenuIQ multi-tenant SaaS
# Function to check if origin is allowed
def is_allowed_origin(origin: str) -> bool:
    allowed_patterns = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://menuiq.io",
        "https://www.menuiq.io",
        "https://app.menuiq.io",
    ]
    
    # Check exact matches
    if origin in allowed_patterns:
        return True
    
    # Check if it's a subdomain of menuiq.io
    if origin.startswith("https://") and origin.endswith(".menuiq.io"):
        return True
    
    # Development environment
    if os.getenv("ENVIRONMENT") == "development":
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
            return True
    
    return False

# Configure CORS with callback
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.menuiq\.io|https://menuiq\.io|https://www\.menuiq\.io|https://app\.menuiq\.io|http://localhost:3000|http://localhost:3001|http://127\.0\.0\.1:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Saudi Arabia specific allergen icons
ALLERGEN_ICONS = {
    "gluten": {"name": "Gluten", "icon": "wheat"},
    "dairy": {"name": "Dairy", "icon": "milk"},
    "eggs": {"name": "Eggs", "icon": "egg"},
    "fish": {"name": "Fish", "icon": "fish"},
    "shellfish": {"name": "Shellfish", "icon": "shrimp"},
    "nuts": {"name": "Tree Nuts", "icon": "nut"},
    "peanuts": {"name": "Peanuts", "icon": "peanut"},
    "soy": {"name": "Soy", "icon": "soy"},
    "sesame": {"name": "Sesame", "icon": "sesame"},
    "celery": {"name": "Celery", "icon": "celery"},
    "mustard": {"name": "Mustard", "icon": "mustard"},
    "lupin": {"name": "Lupin", "icon": "lupin"},
    "molluscs": {"name": "Molluscs", "icon": "mollusc"},
    "sulphites": {"name": "Sulphites", "icon": "sulphur"}
}

# Pydantic models
class MenuItem(BaseModel):
    id: Optional[int] = None
    name: str
    nameAr: Optional[str] = None
    price: str
    priceWithoutVat: Optional[str] = None
    description: str
    descriptionAr: Optional[str] = None
    category: str
    image: Optional[str] = None
    calories: int
    walkMinutes: Optional[int] = 0
    runMinutes: Optional[int] = 0
    highSodium: bool = False
    glutenFree: bool = False
    dairyFree: bool = False
    nutFree: bool = False
    vegetarian: bool = False
    vegan: bool = False
    halal: bool = True
    containsCaffeine: bool = False
    allergens: List[str] = []
    spicyLevel: Optional[int] = 0
    preparationTime: Optional[int] = None
    servingSize: Optional[str] = None
    # Nutrition label fields
    totalFat: Optional[float] = None
    saturatedFat: Optional[float] = None
    transFat: Optional[float] = None
    cholesterol: Optional[int] = None
    sodium: Optional[int] = None
    totalCarbs: Optional[float] = None
    dietaryFiber: Optional[float] = None
    sugars: Optional[float] = None
    protein: Optional[float] = None
    vitaminA: Optional[int] = None
    vitaminC: Optional[int] = None
    calcium: Optional[int] = None
    iron: Optional[int] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    nameAr: Optional[str] = None
    price: Optional[str] = None
    priceWithoutVat: Optional[str] = None
    description: Optional[str] = None
    descriptionAr: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    calories: Optional[int] = None
    walkMinutes: Optional[int] = None
    runMinutes: Optional[int] = None
    highSodium: Optional[bool] = None
    glutenFree: Optional[bool] = None
    dairyFree: Optional[bool] = None
    nutFree: Optional[bool] = None
    vegetarian: Optional[bool] = None
    vegan: Optional[bool] = None
    halal: Optional[bool] = None
    containsCaffeine: Optional[bool] = None
    allergens: Optional[List[str]] = None
    spicyLevel: Optional[int] = None
    preparationTime: Optional[int] = None
    servingSize: Optional[str] = None
    # Nutrition label fields
    totalFat: Optional[float] = None
    saturatedFat: Optional[float] = None
    transFat: Optional[float] = None
    cholesterol: Optional[int] = None
    sodium: Optional[int] = None
    totalCarbs: Optional[float] = None
    dietaryFiber: Optional[float] = None
    sugars: Optional[float] = None
    protein: Optional[float] = None
    vitaminA: Optional[int] = None
    vitaminC: Optional[int] = None
    calcium: Optional[int] = None
    iron: Optional[int] = None

class Category(BaseModel):
    id: Optional[int] = None
    value: str
    label: str
    labelAr: Optional[str] = None
    icon: Optional[str] = None
    sortOrder: Optional[int] = 0

class Settings(BaseModel):
    footerEnabled: bool = False
    footerTextEn: str = ""
    footerTextAr: str = ""

# Helper functions
def get_category_by_value(db: Session, value: str, tenant_id: int):
    return db.query(DBCategory).filter(
        DBCategory.value == value,
        DBCategory.tenant_id == tenant_id
    ).first()

def convert_db_item_to_response(db_item: DBMenuItem):
    """Convert database item to API response format"""
    allergens = [allergen.allergen_name for allergen in db_item.allergens]
    
    return {
        "id": db_item.id,
        "name": db_item.name,
        "nameAr": db_item.name_ar,
        "price": db_item.price,
        "priceWithoutVat": db_item.price_without_vat,
        "description": db_item.description,
        "descriptionAr": db_item.description_ar,
        "category": db_item.category.value if db_item.category else None,
        "image": db_item.image,
        "calories": db_item.calories,
        "walkMinutes": db_item.walk_minutes,
        "runMinutes": db_item.run_minutes,
        "highSodium": db_item.high_sodium,
        "glutenFree": db_item.gluten_free,
        "dairyFree": db_item.dairy_free,
        "nutFree": db_item.nut_free,
        "vegetarian": db_item.vegetarian,
        "vegan": db_item.vegan,
        "halal": db_item.halal,
        "containsCaffeine": db_item.contains_caffeine,
        "allergens": allergens,
        "spicyLevel": db_item.spicy_level,
        "preparationTime": db_item.preparation_time,
        "servingSize": db_item.serving_size,
        # Nutrition label fields
        "totalFat": db_item.total_fat,
        "saturatedFat": db_item.saturated_fat,
        "transFat": db_item.trans_fat,
        "cholesterol": db_item.cholesterol,
        "sodium": db_item.sodium,
        "totalCarbs": db_item.total_carbs,
        "dietaryFiber": db_item.dietary_fiber,
        "sugars": db_item.sugars,
        "protein": db_item.protein,
        "vitaminA": db_item.vitamin_a,
        "vitaminC": db_item.vitamin_c,
        "calcium": db_item.calcium,
        "iron": db_item.iron
    }

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Entrecôte Café de Paris Menu API - MySQL Version",
        "version": "2.0",
        "database": "MySQL",
        "endpoints": {
            "menu_items": "/api/menu-items",
            "categories": "/api/categories",
            "settings": "/api/settings"
        }
    }

@app.get("/api/menu-items", response_model=List[MenuItem])
def get_menu_items(
    request: Request,
    category: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Get all menu items or filter by category"""
    # Try to get authenticated user
    current_user = None
    try:
        from auth import get_current_user
        auth_header = request.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            from auth import decode_token
            payload = decode_token(token)
            if payload.get('user_type') == 'tenant_user':
                current_user = db.query(User).filter(
                    User.id == payload['user_id'],
                    User.tenant_id == payload['tenant_id']
                ).first()
    except:
        pass
    
    # If authenticated, use user's tenant
    if current_user:
        query = db.query(DBMenuItem).filter(DBMenuItem.tenant_id == current_user.tenant_id)
    else:
        # Otherwise, try to get tenant from request origin
        from tenant_middleware import get_tenant_from_request
        tenant = get_tenant_from_request(request, db)
        if not tenant:
            raise HTTPException(status_code=400, detail="Could not determine tenant")
        query = db.query(DBMenuItem).filter(DBMenuItem.tenant_id == tenant.id)
    
    if category:
        cat = get_category_by_value(db, category, current_user.tenant_id)
        if cat:
            query = query.filter(DBMenuItem.category_id == cat.id)
    
    items = query.all()
    return [convert_db_item_to_response(item) for item in items]

@app.get("/api/menu-items/{item_id}", response_model=MenuItem)
def get_menu_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Get a specific menu item by ID for the current tenant"""
    item = db.query(DBMenuItem).filter(
        DBMenuItem.id == item_id,
        DBMenuItem.tenant_id == current_user.tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return convert_db_item_to_response(item)

@app.post("/api/menu-items/bulk")
def bulk_create_menu_items(
    items: List[MenuItem], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Bulk create multiple menu items for the current tenant"""
    try:
        created_items = []
        for item in items:
            # Get category
            category = get_category_by_value(db, item.category, current_user.tenant_id)
            if not category:
                raise HTTPException(status_code=400, detail=f"Invalid category: {item.category}")
            
            # Create item
            db_item = DBMenuItem(
                tenant_id=current_user.tenant_id,
                name=item.name,
                name_ar=item.nameAr,
                price=item.price,
                price_without_vat=item.priceWithoutVat,
                description=item.description,
                description_ar=item.descriptionAr,
                category_id=category.id,
                image=item.image,
                calories=item.calories,
                walk_minutes=item.walkMinutes,
                run_minutes=item.runMinutes,
                high_sodium=item.highSodium,
                gluten_free=item.glutenFree,
                dairy_free=item.dairyFree,
                nut_free=item.nutFree,
                vegetarian=item.vegetarian,
                vegan=item.vegan,
                halal=item.halal,
                contains_caffeine=item.containsCaffeine,
                spicy_level=item.spicyLevel,
                preparation_time=item.preparationTime,
                serving_size=item.servingSize,
                # Nutrition label fields
                total_fat=item.totalFat,
                saturated_fat=item.saturatedFat,
                trans_fat=item.transFat,
                cholesterol=item.cholesterol,
                sodium=item.sodium,
                total_carbs=item.totalCarbs,
                dietary_fiber=item.dietaryFiber,
                sugars=item.sugars,
                protein=item.protein,
                vitamin_a=item.vitaminA,
                vitamin_c=item.vitaminC,
                calcium=item.calcium,
                iron=item.iron
            )
            
            db.add(db_item)
            created_items.append(db_item)
        
        db.commit()
        
        # Refresh and convert to response format
        response_items = []
        for db_item in created_items:
            db.refresh(db_item)
            response_items.append(convert_db_item_to_response(db_item))
        
        return {"success": True, "items": response_items, "count": len(response_items)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/menu-items", response_model=MenuItem)
def create_menu_item(
    item: MenuItem, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Create a new menu item for the current tenant"""
    # Get category
    category = get_category_by_value(db, item.category, current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Create item
    db_item = DBMenuItem(
        tenant_id=current_user.tenant_id,
        name=item.name,
        name_ar=item.nameAr,
        price=item.price,
        price_without_vat=item.priceWithoutVat,
        description=item.description,
        description_ar=item.descriptionAr,
        category_id=category.id,
        image=item.image,
        calories=item.calories,
        walk_minutes=item.walkMinutes,
        run_minutes=item.runMinutes,
        high_sodium=item.highSodium,
        gluten_free=item.glutenFree,
        dairy_free=item.dairyFree,
        nut_free=item.nutFree,
        vegetarian=item.vegetarian,
        vegan=item.vegan,
        halal=item.halal,
        contains_caffeine=item.containsCaffeine,
        spicy_level=item.spicyLevel,
        preparation_time=item.preparationTime,
        serving_size=item.servingSize,
        # Nutrition label fields
        total_fat=item.totalFat,
        saturated_fat=item.saturatedFat,
        trans_fat=item.transFat,
        cholesterol=item.cholesterol,
        sodium=item.sodium,
        total_carbs=item.totalCarbs,
        dietary_fiber=item.dietaryFiber,
        sugars=item.sugars,
        protein=item.protein,
        vitamin_a=item.vitaminA,
        vitamin_c=item.vitaminC,
        calcium=item.calcium,
        iron=item.iron
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Add allergens
    for allergen in item.allergens:
        db_allergen = ItemAllergen(menu_item_id=db_item.id, allergen_name=allergen)
        db.add(db_allergen)
    
    db.commit()
    db.refresh(db_item)
    
    return convert_db_item_to_response(db_item)

@app.put("/api/menu-items/{item_id}", response_model=MenuItem)
def update_menu_item(
    item_id: int, 
    item_update: MenuItemUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Update an existing menu item for the current tenant"""
    db_item = db.query(DBMenuItem).filter(
        DBMenuItem.id == item_id,
        DBMenuItem.tenant_id == current_user.tenant_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update fields
    update_data = item_update.dict(exclude_unset=True)
    
    # Handle category separately
    if 'category' in update_data:
        category = get_category_by_value(db, update_data['category'], current_user.tenant_id)
        if category:
            db_item.category_id = category.id
        del update_data['category']
    
    # Handle allergens separately
    if 'allergens' in update_data:
        # Delete existing allergens
        db.query(ItemAllergen).filter(ItemAllergen.menu_item_id == item_id).delete()
        
        # Add new allergens
        for allergen in update_data['allergens']:
            db_allergen = ItemAllergen(menu_item_id=item_id, allergen_name=allergen)
            db.add(db_allergen)
        
        del update_data['allergens']
    
    # Map field names
    field_mapping = {
        'nameAr': 'name_ar',
        'priceWithoutVat': 'price_without_vat',
        'descriptionAr': 'description_ar',
        'walkMinutes': 'walk_minutes',
        'runMinutes': 'run_minutes',
        'highSodium': 'high_sodium',
        'glutenFree': 'gluten_free',
        'dairyFree': 'dairy_free',
        'nutFree': 'nut_free',
        'containsCaffeine': 'contains_caffeine',
        'spicyLevel': 'spicy_level',
        'preparationTime': 'preparation_time',
        'servingSize': 'serving_size',
        # Nutrition label fields
        'totalFat': 'total_fat',
        'saturatedFat': 'saturated_fat',
        'transFat': 'trans_fat',
        'totalCarbs': 'total_carbs',
        'dietaryFiber': 'dietary_fiber',
        'vitaminA': 'vitamin_a',
        'vitaminC': 'vitamin_c'
    }
    
    for api_field, db_field in field_mapping.items():
        if api_field in update_data:
            setattr(db_item, db_field, update_data[api_field])
            del update_data[api_field]
    
    # Update remaining fields
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    
    return convert_db_item_to_response(db_item)

@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Delete a menu item for the current tenant"""
    db_item = db.query(DBMenuItem).filter(
        DBMenuItem.id == item_id,
        DBMenuItem.tenant_id == current_user.tenant_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    
    return {"message": "Item deleted successfully"}

@app.get("/api/categories")
def get_categories(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all available categories"""
    # Try to get authenticated user
    tenant_id = None
    try:
        auth_header = request.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            from auth import decode_token
            payload = decode_token(token)
            if payload.get('user_type') == 'tenant_user':
                tenant_id = payload.get('tenant_id')
    except:
        pass
    
    # If no authenticated user, get tenant from request
    if not tenant_id:
        from tenant_middleware import get_tenant_from_request
        tenant = get_tenant_from_request(request, db)
        if tenant:
            tenant_id = tenant.id
        else:
            raise HTTPException(status_code=400, detail="Could not determine tenant")
    
    categories = db.query(DBCategory).filter(
        DBCategory.tenant_id == tenant_id
    ).order_by(DBCategory.sort_order).all()
    return {
        "categories": [
            {
                "id": cat.id,
                "value": cat.value,
                "label": cat.label,
                "labelAr": cat.label_ar,
                "icon": cat.icon,
                "sortOrder": cat.sort_order
            }
            for cat in categories
        ]
    }

@app.post("/api/categories", response_model=Category)
def create_category(
    category: Category, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Create a new category for the current tenant"""
    db_category = DBCategory(
        tenant_id=current_user.tenant_id,
        value=category.value,
        label=category.label,
        label_ar=category.labelAr,
        icon=category.icon,
        sort_order=category.sortOrder
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return {
        "id": db_category.id,
        "value": db_category.value,
        "label": db_category.label,
        "labelAr": db_category.label_ar,
        "icon": db_category.icon,
        "sortOrder": db_category.sort_order
    }

@app.put("/api/categories/{category_id}", response_model=Category)
def update_category(
    category_id: int, 
    category_update: Category, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Update a category for the current tenant"""
    db_category = db.query(DBCategory).filter(
        DBCategory.id == category_id,
        DBCategory.tenant_id == current_user.tenant_id
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_category.value = category_update.value
    db_category.label = category_update.label
    db_category.label_ar = category_update.labelAr
    db_category.icon = category_update.icon
    db_category.sort_order = category_update.sortOrder
    
    db.commit()
    db.refresh(db_category)
    
    return {
        "id": db_category.id,
        "value": db_category.value,
        "label": db_category.label,
        "labelAr": db_category.label_ar,
        "icon": db_category.icon,
        "sortOrder": db_category.sort_order
    }

@app.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Delete a category for the current tenant"""
    db_category = db.query(DBCategory).filter(
        DBCategory.id == category_id,
        DBCategory.tenant_id == current_user.tenant_id
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has items (only for this tenant)
    items_count = db.query(DBMenuItem).filter(
        DBMenuItem.category_id == category_id,
        DBMenuItem.tenant_id == current_user.tenant_id
    ).count()
    if items_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category with {items_count} items")
    
    db.delete(db_category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image for menu items"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP are allowed.")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return the URL
    return {"url": f"/uploads/{unique_filename}"}

@app.get("/api/allergen-icons")
def get_allergen_icons(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all available allergen icons"""
    # Try to get tenant from authentication or request
    tenant_id = None
    try:
        auth_header = request.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            from auth import decode_token
            payload = decode_token(token)
            if payload.get('user_type') == 'tenant_user':
                tenant_id = payload.get('tenant_id')
    except:
        pass
    
    if not tenant_id:
        from tenant_middleware import get_tenant_from_request
        tenant = get_tenant_from_request(request, db)
        if tenant:
            tenant_id = tenant.id
    
    # Return empty list if no tenant found (for public menus without allergen icons)
    if not tenant_id:
        return {"allergens": []}
    
    icons = db.query(AllergenIcon).filter(
        AllergenIcon.tenant_id == tenant_id
    ).all()
    return {"allergens": [
        {
            "id": icon.id,
            "name": icon.name,
            "icon_url": icon.icon_url,
            "display_name": icon.display_name,
            "display_name_ar": icon.display_name_ar
        } for icon in icons
    ]}

@app.post("/api/allergen-icons/{allergen_name}")
async def upload_allergen_icon(
    allergen_name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user),
    display_name: str = Form(...),
    display_name_ar: Optional[str] = Form(None)
):
    """Upload an icon for a specific allergen for the current tenant"""
    # Validate file extension
    allowed_extensions = {".png", ".jpg", ".jpeg", ".svg", ".webp"}
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    # Generate unique filename
    unique_filename = f"{allergen_name}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(ALLERGEN_ICONS_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Check if allergen icon already exists for this tenant
    existing_icon = db.query(AllergenIcon).filter(
        AllergenIcon.name == allergen_name,
        AllergenIcon.tenant_id == current_user.tenant_id
    ).first()
    
    icon_url = f"/uploads/allergen-icons/{unique_filename}"
    
    if existing_icon:
        # Delete old file if exists and different
        if existing_icon.icon_url and existing_icon.icon_url != icon_url:
            old_file_path = os.path.join("uploads", existing_icon.icon_url.split("/uploads/")[-1])
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        # Update existing
        existing_icon.icon_url = icon_url
        existing_icon.display_name = display_name
        existing_icon.display_name_ar = display_name_ar
    else:
        # Create new
        new_icon = AllergenIcon(
            tenant_id=current_user.tenant_id,
            name=allergen_name,
            icon_url=icon_url,
            display_name=display_name,
            display_name_ar=display_name_ar
        )
        db.add(new_icon)
    
    db.commit()
    
    return {
        "allergen_name": allergen_name,
        "icon_url": icon_url,
        "display_name": display_name,
        "display_name_ar": display_name_ar
    }

@app.delete("/api/allergen-icons/{allergen_name}")
def delete_allergen_icon(
    allergen_name: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Delete an allergen icon for the current tenant"""
    icon = db.query(AllergenIcon).filter(
        AllergenIcon.name == allergen_name,
        AllergenIcon.tenant_id == current_user.tenant_id
    ).first()
    if not icon:
        raise HTTPException(status_code=404, detail="Allergen icon not found")
    
    # Delete file
    if icon.icon_url:
        file_path = os.path.join("uploads", icon.icon_url.split("/uploads/")[-1])
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Delete from database
    db.delete(icon)
    db.commit()
    
    return {"message": "Allergen icon deleted successfully"}

@app.get("/api/stats")
def get_menu_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Get menu statistics for the current tenant"""
    total_items = db.query(DBMenuItem).filter(
        DBMenuItem.tenant_id == current_user.tenant_id
    ).count()
    
    categories_count = {}
    categories = db.query(DBCategory).filter(
        DBCategory.tenant_id == current_user.tenant_id
    ).all()
    for cat in categories:
        count = db.query(DBMenuItem).filter(
            DBMenuItem.category_id == cat.id,
            DBMenuItem.tenant_id == current_user.tenant_id
        ).count()
        categories_count[cat.value] = count
    
    return {
        "total_items": total_items,
        "categories": categories_count,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/settings", response_model=Settings)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Get menu settings for the current tenant"""
    # Get settings for current tenant
    db_settings = db.query(DBSettings).filter(
        DBSettings.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_settings:
        # Return default settings if none exist
        return {
            "footerEnabled": False,
            "footerTextEn": "",
            "footerTextAr": ""
        }
    
    return {
        "footerEnabled": db_settings.footer_enabled,
        "footerTextEn": db_settings.footer_text_en or "",
        "footerTextAr": db_settings.footer_text_ar or ""
    }

@app.put("/api/settings", response_model=Settings)
def update_settings(
    settings: Settings, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_user)
):
    """Update menu settings for the current tenant"""
    # Get or create settings for current tenant
    db_settings = db.query(DBSettings).filter(
        DBSettings.tenant_id == current_user.tenant_id
    ).first()
    
    if db_settings:
        # Update existing settings
        db_settings.footer_enabled = settings.footerEnabled
        db_settings.footer_text_en = settings.footerTextEn
        db_settings.footer_text_ar = settings.footerTextAr
    else:
        # Create new settings
        db_settings = DBSettings(
            tenant_id=current_user.tenant_id,
            footer_enabled=settings.footerEnabled,
            footer_text_en=settings.footerTextEn,
            footer_text_ar=settings.footerTextAr
        )
        db.add(db_settings)
    
    db.commit()
    db.refresh(db_settings)
    
    return {
        "footerEnabled": db_settings.footer_enabled,
        "footerTextEn": db_settings.footer_text_en or "",
        "footerTextAr": db_settings.footer_text_ar or ""
    }

# Initialize default categories if none exist
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # For multi-tenant system, check if any tenants exist first
        tenant_count = db.query(Tenant).count()
        if tenant_count == 0:
            print("No tenants found. Please run migrate_to_multitenant.py to initialize the system.")
            return
        
        # Check if default tenant has categories
        default_tenant = db.query(Tenant).filter_by(subdomain="entrecote").first()
        if default_tenant:
            categories_count = db.query(DBCategory).filter_by(tenant_id=default_tenant.id).count()
            if categories_count == 0:
                # Add default categories for the default tenant
                default_categories = [
                    {"value": "appetizers", "label": "Appetizers", "label_ar": "المقبلات", "sort_order": 1, "tenant_id": default_tenant.id},
                    {"value": "mains", "label": "Main Courses", "label_ar": "الأطباق الرئيسية", "sort_order": 2, "tenant_id": default_tenant.id},
                    {"value": "steaks", "label": "Signature Steaks", "label_ar": "شرائح اللحم المميزة", "sort_order": 3, "tenant_id": default_tenant.id},
                    {"value": "desserts", "label": "Desserts", "label_ar": "الحلويات", "sort_order": 4, "tenant_id": default_tenant.id},
                    {"value": "beverages", "label": "Beverages", "label_ar": "المشروبات", "sort_order": 5, "tenant_id": default_tenant.id}
                ]
                
                for cat_data in default_categories:
                    db_cat = DBCategory(**cat_data)
                    db.add(db_cat)
                
                db.commit()
                print(f"Default categories added for tenant: {default_tenant.name}")
    except Exception as e:
        print(f"Startup initialization error: {e}")
        # Don't fail startup if initialization has issues
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)