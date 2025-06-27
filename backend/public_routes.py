from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models_multitenant import MenuItem as DBMenuItem, Category as DBCategory, Tenant, Settings, AllergenIcon
from pydantic import BaseModel

router = APIRouter(prefix="/api/public", tags=["public"])

def get_tenant_from_subdomain(subdomain: str, db: Session) -> Tenant:
    """Get tenant from subdomain"""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

def get_category_by_value(db: Session, value: str, tenant_id: int):
    return db.query(DBCategory).filter(
        DBCategory.value == value,
        DBCategory.tenant_id == tenant_id
    ).first()

def convert_db_item_to_response(db_item: DBMenuItem):
    """Convert database item to API response format"""
    allergens = [allergen.allergen for allergen in db_item.allergens]
    
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

@router.get("/{subdomain}/menu-items")
def get_public_menu_items(
    subdomain: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get menu items for a tenant (public access)"""
    tenant = get_tenant_from_subdomain(subdomain, db)
    
    query = db.query(DBMenuItem).filter(
        DBMenuItem.tenant_id == tenant.id,
        DBMenuItem.is_available == True
    )
    
    if category:
        cat = get_category_by_value(db, category, tenant.id)
        if cat:
            query = query.filter(DBMenuItem.category_id == cat.id)
    
    items = query.all()
    return [convert_db_item_to_response(item) for item in items]

@router.get("/{subdomain}/categories")
def get_public_categories(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get categories for a tenant (public access)"""
    tenant = get_tenant_from_subdomain(subdomain, db)
    
    categories = db.query(DBCategory).filter(
        DBCategory.tenant_id == tenant.id
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

@router.get("/{subdomain}/settings")
def get_public_settings(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get settings for a tenant (public access)"""
    tenant = get_tenant_from_subdomain(subdomain, db)
    
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    if not settings:
        return {
            "currency": "SAR",
            "language": "en",
            "footerEnabled": False,
            "footerTextEn": "",
            "footerTextAr": ""
        }
    
    return {
        "currency": settings.currency,
        "language": settings.language,
        "footerEnabled": settings.footer_enabled,
        "footerTextEn": settings.footer_text_en,
        "footerTextAr": settings.footer_text_ar,
        "primaryColor": settings.primary_color,
        "secondaryColor": settings.secondary_color,
        "showCalories": settings.show_calories,
        "showPreparationTime": settings.show_preparation_time,
        "showAllergens": settings.show_allergens
    }

@router.get("/{subdomain}/allergen-icons")
def get_public_allergen_icons(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get allergen icons for a tenant (public access)"""
    tenant = get_tenant_from_subdomain(subdomain, db)
    
    icons = db.query(AllergenIcon).filter(
        AllergenIcon.tenant_id == tenant.id
    ).all()
    
    return {
        "allergens": [
            {
                "id": icon.id,
                "name": icon.name,
                "icon_url": icon.icon_url,
                "display_name": icon.display_name,
                "display_name_ar": icon.display_name_ar
            } for icon in icons
        ]
    }