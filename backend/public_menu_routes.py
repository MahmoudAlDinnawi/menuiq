"""
Public menu routes that return data in the exact format expected by the frontend
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models_final import Tenant, MenuItem, Category, Settings, ItemAllergen

router = APIRouter(prefix="/api/public", tags=["public-menu"])

def get_tenant_by_subdomain(db: Session, subdomain: str) -> Tenant:
    """Get tenant by subdomain"""
    tenant = db.query(Tenant).filter(
        func.lower(Tenant.subdomain) == func.lower(subdomain)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Restaurant not found")
    
    if tenant.status != 'active':
        raise HTTPException(status_code=403, detail="Restaurant is inactive")
    
    return tenant

@router.get("/{subdomain}/menu-items")
async def get_public_menu_items(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get all menu items for public display in frontend format"""
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get all active menu items
    items = db.query(MenuItem).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.is_available == True
    ).order_by(MenuItem.sort_order, MenuItem.id).all()
    
    # Convert to frontend format
    result = []
    for item in items:
        # Get category value
        category_value = None
        if item.category:
            category_value = item.category.value or f"category_{item.category_id}"
        
        # Get allergens
        allergen_names = []
        allergens = db.query(ItemAllergen).filter(
            ItemAllergen.item_id == item.id
        ).all()
        for allergen in allergens:
            allergen_names.append(allergen.allergen_name)
        
        # Format item for frontend
        item_data = {
            "id": item.id,
            "name": item.name,
            "nameAr": item.name_ar,
            "description": item.description,
            "descriptionAr": item.description_ar,
            "category": category_value,
            "image": item.image,
            "price": f"{item.price:.2f} SAR" if item.price else None,
            "priceWithoutVat": f"{item.price_without_vat:.2f} SAR" if item.price_without_vat else None,
            "calories": item.calories,
            "preparationTime": item.preparation_time,
            "servingSize": item.serving_size,
            "halal": item.halal,
            "vegetarian": item.vegetarian,
            "vegan": item.vegan,
            "glutenFree": item.gluten_free,
            "dairyFree": item.dairy_free,
            "nutFree": item.nut_free,
            "spicyLevel": item.spicy_level,
            "highSodium": item.high_sodium,
            "containsCaffeine": item.contains_caffeine,
            "walkMinutes": item.walk_minutes,
            "runMinutes": item.run_minutes,
            "allergens": allergen_names,
            # Nutrition info
            "totalFat": float(item.total_fat) if item.total_fat else None,
            "saturatedFat": float(item.saturated_fat) if item.saturated_fat else None,
            "transFat": float(item.trans_fat) if item.trans_fat else None,
            "cholesterol": item.cholesterol,
            "sodium": item.sodium,
            "totalCarbs": float(item.total_carbs) if item.total_carbs else None,
            "dietaryFiber": float(item.dietary_fiber) if item.dietary_fiber else None,
            "sugars": float(item.sugars) if item.sugars else None,
            "protein": float(item.protein) if item.protein else None,
            "vitaminA": item.vitamin_a,
            "vitaminC": item.vitamin_c,
            "calcium": item.calcium,
            "iron": item.iron
        }
        
        result.append(item_data)
    
    return result

@router.get("/{subdomain}/categories")
async def get_public_categories(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get all categories for public display in frontend format"""
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get all active categories
    categories = db.query(Category).filter(
        Category.tenant_id == tenant.id,
        Category.is_active == True
    ).order_by(Category.sort_order, Category.id).all()
    
    # Convert to frontend format
    result = []
    for cat in categories:
        cat_data = {
            "id": cat.id,
            "value": cat.value or f"category_{cat.id}",
            "label": cat.label or cat.name,
            "labelAr": cat.label_ar or cat.name,
            "sortOrder": cat.sort_order
        }
        result.append(cat_data)
    
    return result

@router.get("/{subdomain}/settings")
async def get_public_settings(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get public settings for menu display"""
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get settings
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    if not settings:
        # Return default settings
        return {
            "footerEnabled": True,
            "footerTextEn": None,
            "footerTextAr": None,
            "currency": "SAR",
            "showCalories": True,
            "showPreparationTime": True,
            "showAllergens": True,
            "enableSearch": True
        }
    
    # Return settings in frontend format
    return {
        "footerEnabled": settings.footer_enabled,
        "footerTextEn": settings.footer_text_en,
        "footerTextAr": settings.footer_text_ar,
        "currency": settings.currency,
        "showCalories": settings.show_calories,
        "showPreparationTime": settings.show_preparation_time,
        "showAllergens": settings.show_allergens,
        "enableSearch": settings.enable_search
    }