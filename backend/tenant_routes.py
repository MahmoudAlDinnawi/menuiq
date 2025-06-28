"""
Enhanced tenant routes with support for all rich menu fields
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import os
import shutil
from datetime import datetime
from pathlib import Path
from decimal import Decimal

from database import get_db
from models_enhanced import (
    Tenant, User, Category, MenuItem, Settings, 
    AllergenIcon, ItemAllergen, MenuItemImage,
    MenuItemReview, DietaryCertification, PreparationStep
)
from auth import get_current_user_dict

router = APIRouter(prefix="/api/tenant", tags=["tenant"])

# Helper function
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
    """Get enhanced dashboard statistics"""
    tenant = get_tenant_from_user(current_user, db)
    
    # Basic counts
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
    
    featured_items = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.is_featured == True
    ).scalar() or 0
    
    signature_dishes = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.signature_dish == True
    ).scalar() or 0
    
    # Get items with promotions
    promo_items = db.query(func.count(MenuItem.id)).filter(
        MenuItem.tenant_id == tenant.id,
        MenuItem.promotion_price.isnot(None),
        MenuItem.promotion_start_date <= datetime.now().date(),
        MenuItem.promotion_end_date >= datetime.now().date()
    ).scalar() or 0
    
    # Get recent items with enhanced info
    recent_items = db.query(MenuItem).filter(
        MenuItem.tenant_id == tenant.id
    ).order_by(MenuItem.created_at.desc()).limit(10).all()
    
    # Get popular items (by review count)
    popular_items = db.query(MenuItem).filter(
        MenuItem.tenant_id == tenant.id
    ).order_by(MenuItem.review_count.desc()).limit(5).all()
    
    # Get settings
    settings = db.query(Settings).filter(
        Settings.tenant_id == tenant.id
    ).first()
    
    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "status": tenant.status,
            "logo_url": tenant.logo_url
        },
        "stats": {
            "total_categories": total_categories,
            "total_items": total_items,
            "active_items": active_items,
            "inactive_items": total_items - active_items,
            "featured_items": featured_items,
            "signature_dishes": signature_dishes,
            "promo_items": promo_items
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
                "price": str(item.price) if item.price else None,
                "category_id": item.category_id,
                "created_at": item.created_at,
                "badge_text": item.badge_text,
                "is_featured": item.is_featured,
                "customer_rating": float(item.customer_rating) if item.customer_rating else None
            } for item in recent_items
        ],
        "popular_items": [
            {
                "id": item.id,
                "name": item.name,
                "review_count": item.review_count,
                "customer_rating": float(item.customer_rating) if item.customer_rating else None,
                "best_seller_rank": item.best_seller_rank
            } for item in popular_items
        ],
        "settings": settings
    }

# Enhanced Categories CRUD
@router.post("/categories")
async def create_category(
    category_data: dict,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Create a new category with enhanced fields"""
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
    
    # Create category with enhanced fields
    db_category = Category(
        tenant_id=tenant.id,
        name=category_data.get("name"),
        description=category_data.get("description"),
        description_ar=category_data.get("description_ar"),
        value=category_data.get("value") or category_data.get("name", "").lower().replace(" ", "_"),
        label=category_data.get("label") or category_data.get("name"),
        label_ar=category_data.get("label_ar"),
        icon=category_data.get("icon", "🍴"),
        color_theme=category_data.get("color_theme", "#6B7280"),
        is_active=category_data.get("is_active", True),
        is_featured=category_data.get("is_featured", False),
        display_style=category_data.get("display_style", "grid"),
        sort_order=category_data.get("sort_order", 0),
        hero_image=category_data.get("hero_image"),
        meta_keywords=category_data.get("meta_keywords"),
        meta_description=category_data.get("meta_description")
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

# Enhanced Menu Items CRUD
@router.get("/menu-items")
async def get_menu_items(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    is_available: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    has_promotion: Optional[bool] = None,
    dietary_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "sort_order",
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Get menu items with enhanced filtering"""
    tenant = get_tenant_from_user(current_user, db)
    
    query = db.query(MenuItem).filter(MenuItem.tenant_id == tenant.id)
    
    # Apply filters
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    
    if search:
        query = query.filter(
            or_(
                MenuItem.name.ilike(f"%{search}%"),
                MenuItem.description.ilike(f"%{search}%"),
                MenuItem.tags.contains([search])
            )
        )
    
    if is_available is not None:
        query = query.filter(MenuItem.is_available == is_available)
    
    if is_featured is not None:
        query = query.filter(MenuItem.is_featured == is_featured)
    
    if has_promotion:
        query = query.filter(
            MenuItem.promotion_price.isnot(None),
            MenuItem.promotion_start_date <= datetime.now().date(),
            MenuItem.promotion_end_date >= datetime.now().date()
        )
    
    if dietary_filter:
        if dietary_filter == "vegetarian":
            query = query.filter(MenuItem.vegetarian == True)
        elif dietary_filter == "vegan":
            query = query.filter(MenuItem.vegan == True)
        elif dietary_filter == "gluten_free":
            query = query.filter(MenuItem.gluten_free == True)
        elif dietary_filter == "halal":
            query = query.filter(MenuItem.halal == True)
    
    # Apply sorting
    if sort_by == "price":
        query = query.order_by(MenuItem.price)
    elif sort_by == "rating":
        query = query.order_by(MenuItem.customer_rating.desc())
    elif sort_by == "newest":
        query = query.order_by(MenuItem.created_at.desc())
    elif sort_by == "popular":
        query = query.order_by(MenuItem.best_seller_rank)
    else:
        query = query.order_by(MenuItem.sort_order, MenuItem.id)
    
    items = query.offset(skip).limit(limit).all()
    
    # Convert to dict with all enhanced fields
    result = []
    for item in items:
        item_dict = {
            "id": item.id,
            "tenant_id": item.tenant_id,
            "category_id": item.category_id,
            # Basic info
            "name": item.name,
            "name_ar": item.name_ar,
            "description": item.description,
            "description_ar": item.description_ar,
            "price": float(item.price) if item.price else None,
            "price_without_vat": float(item.price_without_vat) if item.price_without_vat else None,
            "promotion_price": float(item.promotion_price) if item.promotion_price else None,
            "image": item.image,
            "video_url": item.video_url,
            "ar_model_url": item.ar_model_url,
            # Badge & highlights
            "badge_text": item.badge_text,
            "badge_color": item.badge_color,
            "highlight_message": item.highlight_message,
            # Availability
            "is_available": item.is_available,
            "is_featured": item.is_featured,
            "is_spicy": item.is_spicy,
            "spicy_level": item.spicy_level,
            "signature_dish": item.signature_dish,
            "instagram_worthy": item.instagram_worthy,
            "limited_availability": item.limited_availability,
            "pre_order_required": item.pre_order_required,
            "min_order_quantity": item.min_order_quantity,
            "max_daily_orders": item.max_daily_orders,
            # Dietary
            "halal": item.halal,
            "vegetarian": item.vegetarian,
            "vegan": item.vegan,
            "gluten_free": item.gluten_free,
            "dairy_free": item.dairy_free,
            "nut_free": item.nut_free,
            "organic_certified": item.organic_certified,
            "local_ingredients": item.local_ingredients,
            "fair_trade": item.fair_trade,
            # Warnings
            "high_sodium": item.high_sodium,
            "contains_caffeine": item.contains_caffeine,
            # Culinary
            "cooking_method": item.cooking_method,
            "origin_country": item.origin_country,
            "texture_notes": item.texture_notes,
            "flavor_profile": item.flavor_profile,
            "plating_style": item.plating_style,
            "recommended_time": item.recommended_time,
            "seasonal_availability": item.seasonal_availability,
            "portion_size": item.portion_size,
            # Pairings
            "pairing_suggestions": item.pairing_suggestions,
            "wine_pairing": item.wine_pairing,
            "beer_pairing": item.beer_pairing,
            "cocktail_pairing": item.cocktail_pairing,
            "mocktail_pairing": item.mocktail_pairing,
            "chef_notes": item.chef_notes,
            "customization_options": item.customization_options,
            # Time & Exercise
            "preparation_time": item.preparation_time,
            "walk_minutes": item.walk_minutes,
            "run_minutes": item.run_minutes,
            # Nutrition
            "calories": item.calories,
            "serving_size": item.serving_size,
            "ingredients": item.ingredients,
            "total_fat": float(item.total_fat) if item.total_fat else None,
            "saturated_fat": float(item.saturated_fat) if item.saturated_fat else None,
            "trans_fat": float(item.trans_fat) if item.trans_fat else None,
            "cholesterol": item.cholesterol,
            "sodium": item.sodium,
            "total_carbs": float(item.total_carbs) if item.total_carbs else None,
            "dietary_fiber": float(item.dietary_fiber) if item.dietary_fiber else None,
            "sugars": float(item.sugars) if item.sugars else None,
            "protein": float(item.protein) if item.protein else None,
            "vitamin_a": item.vitamin_a,
            "vitamin_c": item.vitamin_c,
            "calcium": item.calcium,
            "iron": item.iron,
            # Sustainability
            "carbon_footprint": item.carbon_footprint,
            "sustainability_info": item.sustainability_info,
            # Recognition
            "michelin_recommended": item.michelin_recommended,
            "award_winning": item.award_winning,
            "customer_rating": float(item.customer_rating) if item.customer_rating else None,
            "review_count": item.review_count,
            "best_seller_rank": item.best_seller_rank,
            "reorder_rate": float(item.reorder_rate) if item.reorder_rate else None,
            "reward_points": item.reward_points,
            # Related
            "pairs_well_with": item.pairs_well_with,
            "similar_items": item.similar_items,
            "tags": item.tags,
            # Promotions
            "promotion_start_date": item.promotion_start_date.isoformat() if item.promotion_start_date else None,
            "promotion_end_date": item.promotion_end_date.isoformat() if item.promotion_end_date else None,
            # Metadata
            "sort_order": item.sort_order,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
            # Related data
            "allergens": [{"id": a.id, "name": a.allergen_name} for a in item.allergens],
            "images": [
                {
                    "id": img.id,
                    "image_url": img.image_url,
                    "caption": img.caption,
                    "is_primary": img.is_primary
                } for img in item.images
            ],
            "certifications": [
                {
                    "id": cert.id,
                    "type": cert.certification_type,
                    "body": cert.certifying_body,
                    "number": cert.certificate_number
                } for cert in item.certifications
            ]
        }
        
        result.append(item_dict)
    
    return result

@router.post("/menu-items")
async def create_menu_item(
    item_data: dict,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Create a new menu item with all enhanced fields"""
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
    if item_data.get("category_id"):
        category = db.query(Category).filter(
            Category.id == item_data["category_id"],
            Category.tenant_id == tenant.id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Prepare data with proper type conversions
    db_item = MenuItem(
        tenant_id=tenant.id,
        category_id=item_data.get("category_id"),
        # Basic info
        name=item_data.get("name"),
        name_ar=item_data.get("name_ar"),
        description=item_data.get("description"),
        description_ar=item_data.get("description_ar"),
        price=Decimal(str(item_data["price"])) if item_data.get("price") else None,
        price_without_vat=Decimal(str(item_data["price_without_vat"])) if item_data.get("price_without_vat") else None,
        promotion_price=Decimal(str(item_data["promotion_price"])) if item_data.get("promotion_price") else None,
        image=item_data.get("image"),
        video_url=item_data.get("video_url"),
        ar_model_url=item_data.get("ar_model_url"),
        # Badge & highlights
        badge_text=item_data.get("badge_text"),
        badge_color=item_data.get("badge_color"),
        highlight_message=item_data.get("highlight_message"),
        # Availability
        is_available=item_data.get("is_available", True),
        is_featured=item_data.get("is_featured", False),
        is_spicy=item_data.get("is_spicy", False),
        spicy_level=item_data.get("spicy_level", 0),
        signature_dish=item_data.get("signature_dish", False),
        instagram_worthy=item_data.get("instagram_worthy", False),
        limited_availability=item_data.get("limited_availability", False),
        pre_order_required=item_data.get("pre_order_required", False),
        min_order_quantity=item_data.get("min_order_quantity", 1),
        max_daily_orders=item_data.get("max_daily_orders"),
        # Dietary
        halal=item_data.get("halal", True),
        vegetarian=item_data.get("vegetarian", False),
        vegan=item_data.get("vegan", False),
        gluten_free=item_data.get("gluten_free", False),
        dairy_free=item_data.get("dairy_free", False),
        nut_free=item_data.get("nut_free", False),
        organic_certified=item_data.get("organic_certified", False),
        local_ingredients=item_data.get("local_ingredients", False),
        fair_trade=item_data.get("fair_trade", False),
        # Warnings
        high_sodium=item_data.get("high_sodium", False),
        contains_caffeine=item_data.get("contains_caffeine", False),
        # Culinary
        cooking_method=item_data.get("cooking_method"),
        origin_country=item_data.get("origin_country"),
        texture_notes=item_data.get("texture_notes"),
        flavor_profile=item_data.get("flavor_profile"),
        plating_style=item_data.get("plating_style"),
        recommended_time=item_data.get("recommended_time"),
        seasonal_availability=item_data.get("seasonal_availability"),
        portion_size=item_data.get("portion_size"),
        # Pairings
        pairing_suggestions=item_data.get("pairing_suggestions"),
        wine_pairing=item_data.get("wine_pairing"),
        beer_pairing=item_data.get("beer_pairing"),
        cocktail_pairing=item_data.get("cocktail_pairing"),
        mocktail_pairing=item_data.get("mocktail_pairing"),
        chef_notes=item_data.get("chef_notes"),
        customization_options=item_data.get("customization_options"),
        # Time & Exercise
        preparation_time=item_data.get("preparation_time"),
        walk_minutes=item_data.get("walk_minutes"),
        run_minutes=item_data.get("run_minutes"),
        # Nutrition
        calories=item_data.get("calories"),
        serving_size=item_data.get("serving_size"),
        ingredients=item_data.get("ingredients"),
        total_fat=Decimal(str(item_data["total_fat"])) if item_data.get("total_fat") else None,
        saturated_fat=Decimal(str(item_data["saturated_fat"])) if item_data.get("saturated_fat") else None,
        trans_fat=Decimal(str(item_data["trans_fat"])) if item_data.get("trans_fat") else None,
        cholesterol=item_data.get("cholesterol"),
        sodium=item_data.get("sodium"),
        total_carbs=Decimal(str(item_data["total_carbs"])) if item_data.get("total_carbs") else None,
        dietary_fiber=Decimal(str(item_data["dietary_fiber"])) if item_data.get("dietary_fiber") else None,
        sugars=Decimal(str(item_data["sugars"])) if item_data.get("sugars") else None,
        protein=Decimal(str(item_data["protein"])) if item_data.get("protein") else None,
        vitamin_a=item_data.get("vitamin_a"),
        vitamin_c=item_data.get("vitamin_c"),
        calcium=item_data.get("calcium"),
        iron=item_data.get("iron"),
        # Sustainability
        carbon_footprint=item_data.get("carbon_footprint"),
        sustainability_info=item_data.get("sustainability_info"),
        # Recognition
        michelin_recommended=item_data.get("michelin_recommended", False),
        award_winning=item_data.get("award_winning", False),
        reward_points=item_data.get("reward_points", 0),
        # Related
        pairs_well_with=item_data.get("pairs_well_with"),
        similar_items=item_data.get("similar_items"),
        tags=item_data.get("tags", []),
        # Promotions
        promotion_start_date=datetime.fromisoformat(item_data["promotion_start_date"]).date() if item_data.get("promotion_start_date") else None,
        promotion_end_date=datetime.fromisoformat(item_data["promotion_end_date"]).date() if item_data.get("promotion_end_date") else None,
        # Metadata
        sort_order=item_data.get("sort_order", 0)
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Add allergens if provided
    if item_data.get("allergen_ids"):
        for allergen_id in item_data["allergen_ids"]:
            allergen_icon = db.query(AllergenIcon).filter(
                AllergenIcon.id == allergen_id,
                AllergenIcon.tenant_id == tenant.id
            ).first()
            
            if allergen_icon:
                allergen = ItemAllergen(
                    item_id=db_item.id,
                    allergen_name=allergen_icon.name,
                    severity="moderate"
                )
                db.add(allergen)
        
        db.commit()
    
    return {"id": db_item.id, "message": "Menu item created successfully"}

@router.put("/menu-items/{item_id}")
async def update_menu_item(
    item_id: int,
    item_data: dict,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Update a menu item with all enhanced fields"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Update all fields
    for field, value in item_data.items():
        if field in ["price", "price_without_vat", "promotion_price", "total_fat", 
                     "saturated_fat", "trans_fat", "total_carbs", "dietary_fiber", 
                     "sugars", "protein", "reorder_rate"]:
            if value is not None:
                value = Decimal(str(value))
        elif field in ["promotion_start_date", "promotion_end_date"]:
            if value:
                value = datetime.fromisoformat(value).date()
        
        if hasattr(item, field) and field not in ["id", "tenant_id", "created_at"]:
            setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    
    # Update allergens if provided
    if "allergen_ids" in item_data:
        # Remove existing allergens
        db.query(ItemAllergen).filter(
            ItemAllergen.item_id == item_id
        ).delete()
        
        # Add new allergens
        for allergen_id in item_data["allergen_ids"]:
            allergen_icon = db.query(AllergenIcon).filter(
                AllergenIcon.id == allergen_id,
                AllergenIcon.tenant_id == tenant.id
            ).first()
            
            if allergen_icon:
                allergen = ItemAllergen(
                    item_id=item_id,
                    allergen_name=allergen_icon.name,
                    severity="moderate"
                )
                db.add(allergen)
    
    db.commit()
    
    return {"message": "Menu item updated successfully"}

# Additional endpoints for images, reviews, etc.
@router.post("/menu-items/{item_id}/images")
async def add_menu_item_image(
    item_id: int,
    image_data: dict,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Add an image to a menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # If this is marked as primary, unmark other primary images
    if image_data.get("is_primary"):
        db.query(MenuItemImage).filter(
            MenuItemImage.menu_item_id == item_id
        ).update({"is_primary": False})
    
    image = MenuItemImage(
        menu_item_id=item_id,
        image_url=image_data["image_url"],
        caption=image_data.get("caption"),
        caption_ar=image_data.get("caption_ar"),
        is_primary=image_data.get("is_primary", False),
        sort_order=image_data.get("sort_order", 0)
    )
    
    db.add(image)
    db.commit()
    
    return {"message": "Image added successfully"}

@router.post("/menu-items/{item_id}/certifications")
async def add_dietary_certification(
    item_id: int,
    cert_data: dict,
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Add a dietary certification to a menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    certification = DietaryCertification(
        menu_item_id=item_id,
        certification_type=cert_data["certification_type"],
        certifying_body=cert_data.get("certifying_body"),
        certificate_number=cert_data.get("certificate_number"),
        expiry_date=datetime.fromisoformat(cert_data["expiry_date"]).date() if cert_data.get("expiry_date") else None,
        certificate_url=cert_data.get("certificate_url")
    )
    
    db.add(certification)
    db.commit()
    
    return {"message": "Certification added successfully"}

@router.post("/menu-items/{item_id}/preparation-steps")
async def add_preparation_steps(
    item_id: int,
    steps_data: List[dict],
    current_user: dict = Depends(get_current_user_dict),
    db: Session = Depends(get_db)
):
    """Add preparation steps to a menu item"""
    tenant = get_tenant_from_user(current_user, db)
    
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.tenant_id == tenant.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Remove existing steps
    db.query(PreparationStep).filter(
        PreparationStep.menu_item_id == item_id
    ).delete()
    
    # Add new steps
    for i, step_data in enumerate(steps_data):
        step = PreparationStep(
            menu_item_id=item_id,
            step_number=i + 1,
            description=step_data["description"],
            description_ar=step_data.get("description_ar"),
            image_url=step_data.get("image_url"),
            time_minutes=step_data.get("time_minutes")
        )
        db.add(step)
    
    db.commit()
    
    return {"message": "Preparation steps updated successfully"}

# Image Upload
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    type: str = "item",
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