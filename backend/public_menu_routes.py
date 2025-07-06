"""
Public menu routes that return data in the exact format expected by the frontend
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import Tenant, MenuItem, Category, Settings, AllergenIcon
from simple_cache import cache, cached, CACHE_TTL

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
    # Check cache first
    cache_key = f"public_menu:subdomain:{subdomain}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get settings for currency
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    currency = settings.currency if settings else "SAR"
    
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
        
        # Get allergens with full details
        allergen_data = [{
            "id": allergen.id,
            "name": allergen.name,
            "display_name": allergen.display_name,
            "display_name_ar": allergen.display_name_ar,
            "icon_url": allergen.icon_url
        } for allergen in item.allergens]
        
        # Format item for frontend
        item_data = {
            "id": item.id,
            "name": item.name,
            "nameAr": item.name_ar,
            "description": item.description,
            "descriptionAr": item.description_ar,
            "category": category_value,
            "categoryId": item.category_id,
            "image": item.image,
            "price": f"{item.price:.2f} {currency}" if item.price else None,
            "priceWithoutVat": f"{item.price_without_vat:.2f} {currency}" if item.price_without_vat else None,
            "promotionPrice": f"{item.promotion_price:.2f} {currency}" if item.promotion_price else None,
            "signatureDish": item.signature_dish,
            "instagramWorthy": item.instagram_worthy,
            "isFeatured": item.is_featured,
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
            "allergens": allergen_data,
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
            "vitaminD": item.vitamin_d,
            "calcium": item.calcium,
            "iron": item.iron,
            "caffeineMg": item.caffeine_mg,
            # Upsell fields
            "is_upsell": item.is_upsell,
            "upsell_style": item.upsell_style,
            "upsell_border_color": item.upsell_border_color,
            "upsell_background_color": item.upsell_background_color,
            "upsell_badge_text": item.upsell_badge_text,
            "upsell_badge_color": item.upsell_badge_color,
            "upsell_animation": item.upsell_animation,
            "upsell_icon": item.upsell_icon
        }
        
        result.append(item_data)
    
    # Cache the result
    cache.set(cache_key, result, CACHE_TTL["public_menu"])
    
    return result

@router.get("/{subdomain}/categories")
async def get_public_categories(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get all categories for public display in frontend format"""
    # Check cache first
    cache_key = f"categories:subdomain:{subdomain}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
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
    
    # Cache the result
    cache.set(cache_key, result, CACHE_TTL["categories"])
    
    return result

@router.get("/{subdomain}/settings")
async def get_public_settings(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Get public settings for menu display"""
    # Check cache first
    cache_key = f"settings:subdomain:{subdomain}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data
    
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get settings
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    if not settings:
        # Return default settings
        result = {
            "footerEnabled": True,
            "footerTextEn": None,
            "footerTextAr": None,
            "heroSubtitleEn": "Discover our exquisite selection of authentic French cuisine",
            "heroSubtitleAr": "اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة",
            "footerTaglineEn": "Authentic French dining experience in the heart of the Kingdom",
            "footerTaglineAr": "تجربة طعام فرنسية أصيلة في قلب المملكة",
            "currency": "SAR",
            "showCalories": True,
            "showPreparationTime": True,
            "showAllergens": True,
            "enableSearch": True,
            "showAllCategory": True,
            "showIncludeVat": True,
            "logoUrl": tenant.logo_url,
            "tenantName": tenant.name,
            # SEO defaults
            "metaTitleEn": None,
            "metaTitleAr": None,
            "metaDescriptionEn": None,
            "metaDescriptionAr": None,
            "metaKeywordsEn": None,
            "metaKeywordsAr": None,
            "ogImageUrl": None
        }
        cache.set(cache_key, result, CACHE_TTL["settings"])
        return result
    
    # Cache the result
    result = {
        "footerEnabled": settings.footer_enabled,
        "footerTextEn": settings.footer_text_en,
        "footerTextAr": settings.footer_text_ar,
        "heroSubtitleEn": settings.hero_subtitle_en,
        "heroSubtitleAr": settings.hero_subtitle_ar,
        "footerTaglineEn": settings.footer_tagline_en,
        "footerTaglineAr": settings.footer_tagline_ar,
        "currency": settings.currency,
        "showCalories": settings.show_calories,
        "showPreparationTime": settings.show_preparation_time,
        "showAllergens": settings.show_allergens,
        "enableSearch": settings.enable_search,
        "primaryColor": settings.primary_color,
        "secondaryColor": settings.secondary_color,
        "fontFamily": settings.font_family,
        "menuLayout": settings.menu_layout,
        "animationEnabled": settings.animation_enabled,
        "enableReviews": settings.enable_reviews,
        "enableRatings": settings.enable_ratings,
        "enableNutritionalInfo": settings.enable_nutritional_info,
        "enableAllergenInfo": settings.enable_allergen_info,
        "socialSharingEnabled": settings.social_sharing_enabled,
        "whatsappOrderingEnabled": settings.whatsapp_ordering_enabled,
        "whatsappNumber": settings.whatsapp_number,
        "instagramHandle": settings.instagram_handle,
        "tiktokHandle": settings.tiktok_handle,
        "websiteUrl": settings.website_url,
        "showAllCategory": settings.show_all_category,
        "showIncludeVat": settings.show_include_vat,
        "logoUrl": tenant.logo_url,
        "tenantName": tenant.name,
        "metaTitleEn": settings.meta_title_en,
        "metaTitleAr": settings.meta_title_ar,
        "metaDescriptionEn": settings.meta_description_en,
        "metaDescriptionAr": settings.meta_description_ar,
        "metaKeywordsEn": settings.meta_keywords_en,
        "metaKeywordsAr": settings.meta_keywords_ar,
        "ogImageUrl": settings.og_image_url
    }
    
    cache.set(cache_key, result, CACHE_TTL["settings"])
    
    return result