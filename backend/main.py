from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import shutil
from datetime import datetime
import uuid

app = FastAPI(title="Entrecôte Café de Paris Menu API")

# Create directories for uploads
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data file paths
DATA_FILE = "menu_data.json"
CATEGORIES_FILE = "categories_data.json"
SETTINGS_FILE = "settings.json"

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
    nameAr: Optional[str] = None  # Arabic name
    price: str
    priceWithoutVat: Optional[str] = None  # Price without VAT
    description: str
    descriptionAr: Optional[str] = None  # Arabic description
    category: str
    image: Optional[str] = None  # Image URL
    calories: int
    walkMinutes: Optional[int] = 0
    runMinutes: Optional[int] = 0
    highSodium: bool = False
    glutenFree: bool = False
    dairyFree: bool = False
    nutFree: bool = False
    vegetarian: bool = False
    vegan: bool = False
    halal: bool = True  # Default to halal for Saudi Arabia
    containsCaffeine: bool = False
    allergens: List[str] = []
    spicyLevel: Optional[int] = 0  # 0-5 scale
    preparationTime: Optional[int] = None  # in minutes
    servingSize: Optional[str] = None

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
def load_menu_items():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_menu_items(items):
    with open(DATA_FILE, 'w') as f:
        json.dump(items, f, indent=2)

def load_categories():
    if os.path.exists(CATEGORIES_FILE):
        with open(CATEGORIES_FILE, 'r') as f:
            return json.load(f)
    # Default categories
    return [
        {"id": 1, "value": "appetizers", "label": "Appetizers", "labelAr": "المقبلات", "sortOrder": 1},
        {"id": 2, "value": "mains", "label": "Main Courses", "labelAr": "الأطباق الرئيسية", "sortOrder": 2},
        {"id": 3, "value": "steaks", "label": "Signature Steaks", "labelAr": "شرائح اللحم المميزة", "sortOrder": 3},
        {"id": 4, "value": "desserts", "label": "Desserts", "labelAr": "الحلويات", "sortOrder": 4},
        {"id": 5, "value": "beverages", "label": "Beverages", "labelAr": "المشروبات", "sortOrder": 5}
    ]

def save_categories(categories):
    with open(CATEGORIES_FILE, 'w') as f:
        json.dump(categories, f, indent=2)

def get_next_id(items):
    if not items:
        return 1
    return max(item['id'] for item in items) + 1

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    # Default settings
    return {
        "footerEnabled": False,
        "footerTextEn": "",
        "footerTextAr": ""
    }

def save_settings(settings):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

# Initialize with default data if file doesn't exist
if not os.path.exists(DATA_FILE):
    default_items = [
        {
            "id": 1,
            "name": "French Onion Soup",
            "price": "45 SAR",
            "description": "Classic French onion soup topped with melted Gruyère cheese and crusty bread",
            "category": "appetizers",
            "calories": 280,
            "walkMinutes": 56,
            "runMinutes": 28,
            "highSodium": True,
            "glutenFree": False,
            "dairyFree": False,
            "nutFree": True,
            "vegetarian": True,
            "vegan": False,
            "allergens": ["dairy", "gluten"]
        },
        {
            "id": 2,
            "name": "Entrecôte Café de Paris",
            "price": "195 SAR",
            "description": "Our signature ribeye steak with the famous Café de Paris butter sauce and golden fries",
            "category": "steaks",
            "calories": 850,
            "walkMinutes": 170,
            "runMinutes": 85,
            "highSodium": True,
            "glutenFree": True,
            "dairyFree": False,
            "nutFree": True,
            "vegetarian": False,
            "vegan": False,
            "allergens": ["dairy"]
        },
        {
            "id": 3,
            "name": "Caesar Salad",
            "price": "55 SAR",
            "description": "Crisp romaine lettuce, parmesan shavings, croutons, and our signature Caesar dressing",
            "category": "appetizers",
            "calories": 320,
            "walkMinutes": 64,
            "runMinutes": 32,
            "highSodium": False,
            "glutenFree": False,
            "dairyFree": False,
            "nutFree": True,
            "vegetarian": True,
            "vegan": False,
            "allergens": ["dairy", "eggs", "gluten"]
        }
    ]
    save_menu_items(default_items)

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Entrecôte Café de Paris Menu API",
        "version": "1.0",
        "endpoints": {
            "menu_items": "/api/menu-items",
            "categories": "/api/categories"
        }
    }

@app.get("/api/menu-items", response_model=List[MenuItem])
def get_menu_items(category: Optional[str] = None):
    """Get all menu items or filter by category"""
    items = load_menu_items()
    if category:
        items = [item for item in items if item['category'] == category]
    return items

@app.get("/api/menu-items/{item_id}", response_model=MenuItem)
def get_menu_item(item_id: int):
    """Get a specific menu item by ID"""
    items = load_menu_items()
    for item in items:
        if item['id'] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.post("/api/menu-items", response_model=MenuItem)
def create_menu_item(item: MenuItem):
    """Create a new menu item"""
    items = load_menu_items()
    new_item = item.dict()
    new_item['id'] = get_next_id(items)
    items.append(new_item)
    save_menu_items(items)
    return new_item

@app.put("/api/menu-items/{item_id}", response_model=MenuItem)
def update_menu_item(item_id: int, item_update: MenuItemUpdate):
    """Update an existing menu item"""
    items = load_menu_items()
    for i, item in enumerate(items):
        if item['id'] == item_id:
            update_data = item_update.dict(exclude_unset=True)
            items[i].update(update_data)
            save_menu_items(items)
            return items[i]
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(item_id: int):
    """Delete a menu item"""
    items = load_menu_items()
    for i, item in enumerate(items):
        if item['id'] == item_id:
            items.pop(i)
            save_menu_items(items)
            return {"message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/api/categories")
def get_categories():
    """Get all available categories"""
    categories = load_categories()
    return {"categories": sorted(categories, key=lambda x: x.get('sortOrder', 0))}

@app.post("/api/categories", response_model=Category)
def create_category(category: Category):
    """Create a new category"""
    categories = load_categories()
    new_category = category.dict()
    new_category['id'] = get_next_id(categories)
    categories.append(new_category)
    save_categories(categories)
    return new_category

@app.put("/api/categories/{category_id}", response_model=Category)
def update_category(category_id: int, category_update: Category):
    """Update a category"""
    categories = load_categories()
    for i, cat in enumerate(categories):
        if cat['id'] == category_id:
            update_data = category_update.dict(exclude_unset=True)
            categories[i].update(update_data)
            save_categories(categories)
            return categories[i]
    raise HTTPException(status_code=404, detail="Category not found")

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int):
    """Delete a category"""
    categories = load_categories()
    items = load_menu_items()
    
    # Find the category to delete
    category_to_delete = None
    for cat in categories:
        if cat['id'] == category_id:
            category_to_delete = cat
            break
    
    if not category_to_delete:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has items
    items_in_category = [item for item in items if item['category'] == category_to_delete['value']]
    if items_in_category:
        raise HTTPException(status_code=400, detail=f"Cannot delete category with {len(items_in_category)} items")
    
    # Delete the category
    categories = [cat for cat in categories if cat['id'] != category_id]
    save_categories(categories)
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
def get_allergen_icons():
    """Get all available allergen icons"""
    return {"allergens": ALLERGEN_ICONS}

@app.get("/api/stats")
def get_menu_stats():
    """Get menu statistics"""
    items = load_menu_items()
    categories_count = {}
    total_items = len(items)
    
    for item in items:
        cat = item['category']
        categories_count[cat] = categories_count.get(cat, 0) + 1
    
    return {
        "total_items": total_items,
        "categories": categories_count,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/settings", response_model=Settings)
def get_settings():
    """Get menu settings"""
    return load_settings()

@app.put("/api/settings", response_model=Settings)
def update_settings(settings: Settings):
    """Update menu settings"""
    settings_data = settings.dict()
    save_settings(settings_data)
    return settings_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)