"""
Public menu routes that return data in the exact format expected by the frontend
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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
    skip: int = 0,
    limit: int = 50,
    fields: Optional[str] = None,  # e.g., "id,name,price,image,category"
    db: Session = Depends(get_db)
):
    """Get all menu items for public display in frontend format"""
    # Check cache first
    cache_key = f"public_menu:subdomain:{subdomain}:skip:{skip}:limit:{limit}:fields:{fields or 'all'}"
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        print(f"[PUBLIC API] Returning cached data for key: {cache_key}")
        return cached_data
    
    print(f"[PUBLIC API] Cache miss for key: {cache_key}, fetching from database")
    
    tenant = get_tenant_by_subdomain(db, subdomain)
    
    # Get settings for currency
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    currency = settings.currency if settings else "SAR"
    
    # Parse requested fields
    requested_fields = set(fields.split(',')) if fields else None
    
    # Define field groups for common use cases
    basic_fields = {'id', 'name', 'nameAr', 'price', 'image', 'category', 'categoryId'}
    nutritional_fields = {
        'calories', 'totalFat', 'saturatedFat', 'transFat', 'cholesterol', 
        'sodium', 'totalCarbs', 'dietaryFiber', 'sugars', 'protein',
        'vitaminA', 'vitaminC', 'vitaminD', 'calcium', 'iron', 'caffeineMg'
    }
    dietary_fields = {
        'halal', 'vegetarian', 'vegan', 'glutenFree', 'dairyFree', 
        'nutFree', 'spicyLevel', 'highSodium', 'containsCaffeine'
    }
    
    # Get total count for pagination
    total_count = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.is_available == True,
        MenuItem.parent_item_id == None
    ).scalar()
    
    # Get all active menu items (exclude sub-items from main list)
    items = db.query(MenuItem).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.is_available == True,
        MenuItem.parent_item_id == None  # Only get top-level items
    ).options(
        joinedload(MenuItem.sub_items),
        joinedload(MenuItem.allergens),
        joinedload(MenuItem.category)
    ).order_by(MenuItem.sort_order, MenuItem.id).offset(skip).limit(limit).all()
    
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
        
        # Format item for frontend - build dynamically based on requested fields
        item_data = {"id": item.id}  # Always include ID
        
        # Helper function to add field if requested
        def add_field(field_name, value):
            if requested_fields is None or field_name in requested_fields:
                item_data[field_name] = value
        
        # Basic fields
        add_field("name", item.name)
        add_field("nameAr", item.name_ar)
        add_field("description", item.description)
        add_field("descriptionAr", item.description_ar)
        add_field("category", category_value)
        add_field("categoryId", item.category_id)
        add_field("image", item.image)
        add_field("price", f"{item.price:.2f} {currency}" if item.price else None)
        add_field("priceWithoutVat", f"{item.price_without_vat:.2f} {currency}" if item.price_without_vat else None)
        add_field("promotionPrice", f"{item.promotion_price:.2f} {currency}" if item.promotion_price else None)
        
        # Feature flags
        add_field("signatureDish", item.signature_dish)
        add_field("instagramWorthy", item.instagram_worthy)
        add_field("isFeatured", item.is_featured)
        
        # Basic nutrition
        add_field("calories", item.calories)
        add_field("preparationTime", item.preparation_time)
        add_field("servingSize", item.serving_size)
        
        # Dietary restrictions
        add_field("halal", item.halal)
        add_field("vegetarian", item.vegetarian)
        add_field("vegan", item.vegan)
        add_field("glutenFree", item.gluten_free)
        add_field("dairyFree", item.dairy_free)
        add_field("nutFree", item.nut_free)
        add_field("spicyLevel", item.spicy_level)
        add_field("highSodium", item.high_sodium)
        add_field("containsCaffeine", item.contains_caffeine)
        add_field("organic", item.organic_certified)
        
        # Exercise info
        add_field("walkMinutes", item.walk_minutes)
        add_field("runMinutes", item.run_minutes)
        
        # Allergens
        add_field("allergens", allergen_data)
        
        # Detailed nutrition info
        add_field("totalFat", float(item.total_fat) if item.total_fat else None)
        add_field("saturatedFat", float(item.saturated_fat) if item.saturated_fat else None)
        add_field("transFat", float(item.trans_fat) if item.trans_fat else None)
        add_field("cholesterol", item.cholesterol)
        add_field("sodium", item.sodium)
        add_field("totalCarbs", float(item.total_carbs) if item.total_carbs else None)
        add_field("dietaryFiber", float(item.dietary_fiber) if item.dietary_fiber else None)
        add_field("sugars", float(item.sugars) if item.sugars else None)
        add_field("protein", float(item.protein) if item.protein else None)
        add_field("vitaminA", item.vitamin_a)
        add_field("vitaminC", item.vitamin_c)
        add_field("vitaminD", item.vitamin_d)
        add_field("calcium", item.calcium)
        add_field("iron", item.iron)
        add_field("caffeineMg", item.caffeine_mg)
        
        # Upsell fields
        add_field("is_upsell", item.is_upsell)
        add_field("upsell_style", item.upsell_style)
        add_field("upsell_border_color", item.upsell_border_color)
        add_field("upsell_background_color", item.upsell_background_color)
        add_field("upsell_badge_text", item.upsell_badge_text)
        add_field("upsell_badge_color", item.upsell_badge_color)
        add_field("upsell_animation", item.upsell_animation)
        add_field("upsell_icon", item.upsell_icon)
        
        # Multi-item fields
        add_field("is_multi_item", item.is_multi_item)
        add_field("price_min", f"{item.price_min:.2f} {currency}" if item.price_min else None)
        add_field("price_max", f"{item.price_max:.2f} {currency}" if item.price_max else None)
        add_field("display_as_grid", item.display_as_grid)
        
        # Sub-items (only if requested)
        if (requested_fields is None or "sub_items" in requested_fields) and item.is_multi_item:
            sub_items = []
            for sub in sorted(item.sub_items, key=lambda x: x.sub_item_order):
                # Get allergens for sub-item
                sub_allergen_data = [{
                    "id": allergen.id,
                    "name": allergen.name,
                    "display_name": allergen.display_name,
                    "display_name_ar": allergen.display_name_ar,
                    "icon_url": allergen.icon_url
                } for allergen in sub.allergens]
                
                # Sub-item inherits parent category if it doesn't have one
                sub_category = category_value  # Use parent's category
                
                sub_item_data = {
                    "id": sub.id,
                    "name": sub.name,
                    "nameAr": sub.name_ar,
                    "description": sub.description,
                    "descriptionAr": sub.description_ar,
                    "category": sub_category,  # Inherit parent category
                    "categoryId": item.category_id,  # Inherit parent category ID
                    "price": f"{sub.price:.2f} {currency}" if sub.price else None,
                    "priceWithoutVat": f"{sub.price_without_vat:.2f} {currency}" if sub.price_without_vat else None,
                    "promotionPrice": f"{sub.promotion_price:.2f} {currency}" if sub.promotion_price else None,
                    "image": sub.image,
                    
                    # All nutrition fields
                    "calories": sub.calories,
                    "preparationTime": sub.preparation_time,
                    "servingSize": sub.serving_size,
                    "totalFat": float(sub.total_fat) if sub.total_fat else None,
                    "saturatedFat": float(sub.saturated_fat) if sub.saturated_fat else None,
                    "transFat": float(sub.trans_fat) if sub.trans_fat else None,
                    "cholesterol": sub.cholesterol,
                    "sodium": sub.sodium,
                    "totalCarbs": float(sub.total_carbs) if sub.total_carbs else None,
                    "dietaryFiber": float(sub.dietary_fiber) if sub.dietary_fiber else None,
                    "sugars": float(sub.sugars) if sub.sugars else None,
                    "protein": float(sub.protein) if sub.protein else None,
                    "vitaminA": sub.vitamin_a,
                    "vitaminC": sub.vitamin_c,
                    "vitaminD": sub.vitamin_d,
                    "calcium": sub.calcium,
                    "iron": sub.iron,
                    "caffeineMg": sub.caffeine_mg,
                    
                    # Exercise info
                    "walkMinutes": sub.walk_minutes,
                    "runMinutes": sub.run_minutes,
                    
                    # Dietary flags
                    "halal": sub.halal,
                    "vegetarian": sub.vegetarian,
                    "vegan": sub.vegan,
                    "glutenFree": sub.gluten_free,
                    "dairyFree": sub.dairy_free,
                    "nutFree": sub.nut_free,
                    "spicyLevel": sub.spicy_level,
                    "highSodium": sub.high_sodium,
                    "containsCaffeine": sub.contains_caffeine,
                    "organic": sub.organic_certified,
                    
                    # Feature flags
                    "signatureDish": sub.signature_dish,
                    "limitedAvailability": sub.limited_availability,
                    
                    # Allergens with full details
                    "allergens": sub_allergen_data,
                    
                    # Additional fields
                    "ingredients": sub.ingredients,
                    "chefNotes": sub.chef_notes,
                    "pairingSuggestions": sub.pairing_suggestions,
                    
                    # Upsell fields for sub-items
                    "is_upsell": sub.is_upsell,
                    "upsell_style": sub.upsell_style,
                    "upsell_border_color": sub.upsell_border_color,
                    "upsell_background_color": sub.upsell_background_color,
                    "upsell_badge_text": sub.upsell_badge_text,
                    "upsell_badge_color": sub.upsell_badge_color,
                    "upsell_animation": sub.upsell_animation,
                    "upsell_icon": sub.upsell_icon,
                    
                    # Order
                    "sub_item_order": sub.sub_item_order
                }
                sub_items.append(sub_item_data)
            
            item_data["sub_items"] = sub_items
        elif item.is_multi_item:
            item_data["sub_items"] = []
        
        result.append(item_data)
    
    # Prepare response with pagination info
    response = {
        "items": result,
        "total": total_count,
        "skip": skip,
        "limit": limit
    }
    
    # Cache the result
    cache.set(cache_key, response, CACHE_TTL["public_menu"])
    
    return response

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
            "ogImageUrl": None,
            # Multi-item badge defaults
            "multiItemBadgeTextEn": "Multi",
            "multiItemBadgeTextAr": "متعدد",
            "multiItemBadgeColor": "#9333EA",
            "gtmContainerId": None
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
        "ogImageUrl": settings.og_image_url,
        "multiItemBadgeTextEn": settings.multi_item_badge_text_en,
        "multiItemBadgeTextAr": settings.multi_item_badge_text_ar,
        "multiItemBadgeColor": settings.multi_item_badge_color,
        "gtmContainerId": settings.gtm_container_id
    }
    
    cache.set(cache_key, result, CACHE_TTL["settings"])
    
    return result