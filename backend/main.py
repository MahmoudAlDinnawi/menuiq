"""
MenuIQ API - Multi-tenant Restaurant Menu Management System

This is the main FastAPI application file that:
- Configures the API server with middleware and routers
- Handles CORS for cross-origin requests
- Serves static files (images)
- Provides public endpoints for tenant information
- Manages file uploads for images
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
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

# Load environment variables from .env file
load_dotenv('.env')

# Import database connection and models
from database import get_db, engine
from models import (
    Base, Tenant, User, SystemAdmin, Category, MenuItem, 
    Settings, AllergenIcon, ActivityLog,
    MenuItemImage, MenuItemReview, DietaryCertification, PreparationStep
)

# Import authentication utilities
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_admin
)

# Import API route handlers
from system_admin_routes import router as system_admin_router  # System admin management
from tenant_auth_routes import router as tenant_auth_router    # Tenant authentication
from tenant_routes import router as tenant_router              # Tenant operations
from public_menu_routes import router as public_menu_router    # Public menu viewing
from analytics_routes import router as analytics_router        # Analytics tracking
from flowiq_routes import router as flowiq_router              # FlowIQ management
from public_flowiq_routes import router as public_flowiq_router # Public FlowIQ endpoints

# Create all database tables if they don't exist
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(title="MenuIQ Enhanced API")

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the frontend to communicate with the backend from different domains
origins = [
    "http://localhost:3000",      # Local development frontend
    "http://localhost:3001",      # Alternative local port
    "https://app.menuiq.io",      # Production frontend
    "https://menuiq.io",          # Main domain
    "https://*.menuiq.io"         # All subdomains
]

# Add regex pattern for dynamic subdomain support
# This allows tenant-specific subdomains like entrecote.menuiq.io
import re
subdomain_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.menuiq\.io")

# Configure CORS middleware
# Allow all origins for now to fix the issue
# Add GZip compression middleware for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# In production, you can restrict this later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows all origins including all subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static files directory for serving uploaded images
# All uploaded images are accessible at /uploads/*
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers for different functionalities
app.include_router(system_admin_router)  # /api/system-admin/* endpoints
app.include_router(tenant_auth_router)   # /api/auth/* endpoints
app.include_router(tenant_router)        # /api/tenant/* endpoints
app.include_router(public_menu_router)   # /api/public/* endpoints
app.include_router(analytics_router)     # /api/analytics/* endpoints
app.include_router(flowiq_router, prefix="/api/tenant/flowiq", tags=["flowiq"])  # /api/tenant/flowiq/* endpoints
app.include_router(public_flowiq_router, prefix="/api", tags=["public-flowiq"])  # /api/public/* FlowIQ endpoints

# Root endpoint - provides API information
@app.get("/")
async def root():
    return {
        "message": "MenuIQ Enhanced API",
        "version": "2.0",
        "features": [
            "Rich menu item fields",
            "Enhanced nutrition tracking",
            "Sustainability info",
            "Multi-image support",
            "Review system",
            "Dietary certifications",
            "Preparation steps",
            "Advanced filtering"
        ]
    }

# Health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

# Initialize database with sample data if empty
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    
    # Check if we have any system admins
    admin_count = db.query(func.count(SystemAdmin.id)).scalar()
    
    if admin_count == 0:
        # Create default system admin
        default_admin = SystemAdmin(
            email="admin@menuiq.io",
            username="admin",
            password_hash=get_password_hash("admin123"),
            is_super_admin=True
        )
        db.add(default_admin)
        db.commit()
        print("Created default system admin: admin@menuiq.io / admin123")
    
    # Check if we have any tenants
    tenant_count = db.query(func.count(Tenant.id)).scalar()
    
    if tenant_count == 0:
        # Create a demo tenant
        demo_tenant = Tenant(
            name="Demo Restaurant",
            subdomain="demo",
            contact_email="demo@menuiq.io",
            plan="premium",
            status="active",
            max_menu_items=1000,
            max_categories=50
        )
        db.add(demo_tenant)
        db.commit()
        db.refresh(demo_tenant)
        
        # Create demo tenant admin
        demo_admin = User(
            tenant_id=demo_tenant.id,
            email="admin@demo.menuiq.io",
            username="Demo Admin",
            password_hash=get_password_hash("demo123"),
            role="admin",
            is_active=True
        )
        db.add(demo_admin)
        
        # Create demo settings
        demo_settings = Settings(
            tenant_id=demo_tenant.id,
            currency="SAR",
            tax_rate=15.0,
            language="en",
            primary_color="#00594f",
            secondary_color="#d4af37",
            font_family="Playfair Display",
            enable_reviews=True,
            enable_ratings=True,
            enable_nutritional_info=True,
            enable_allergen_info=True,
            enable_pairing_suggestions=True,
            enable_loyalty_points=True,
            show_calories=True,
            show_preparation_time=True,
            show_allergens=True,
            show_price_without_vat=True,
            footer_enabled=True,
            footer_text_en="Experience the finest dining with our carefully crafted menu.",
            footer_text_ar="استمتع بأفضل تجربة طعام مع قائمتنا المعدة بعناية"
        )
        db.add(demo_settings)
        
        # Create demo categories with enhanced fields
        categories = [
            {
                "name": "Appetizers",
                "description": "Start your meal with our delicious appetizers",
                "description_ar": "ابدأ وجبتك مع مقبلاتنا اللذيذة",
                "icon": "🥗",
                "color_theme": "#10B981",
                "sort_order": 1,
                "is_featured": True
            },
            {
                "name": "Main Courses",
                "description": "Hearty and satisfying main dishes",
                "description_ar": "أطباق رئيسية شهية ومشبعة",
                "icon": "🍽️",
                "color_theme": "#3B82F6",
                "sort_order": 2
            },
            {
                "name": "Desserts",
                "description": "Sweet treats to end your meal",
                "description_ar": "حلويات لذيذة لإنهاء وجبتك",
                "icon": "🍰",
                "color_theme": "#EC4899",
                "sort_order": 3
            },
            {
                "name": "Beverages",
                "description": "Refreshing drinks and beverages",
                "description_ar": "مشروبات منعشة",
                "icon": "🥤",
                "color_theme": "#F59E0B",
                "sort_order": 4
            }
        ]
        
        created_categories = {}
        for cat_data in categories:
            category = Category(
                tenant_id=demo_tenant.id,
                name=cat_data["name"],
                description=cat_data["description"],
                description_ar=cat_data["description_ar"],
                value=cat_data["name"].lower().replace(" ", "_"),
                label=cat_data["name"],
                label_ar=cat_data.get("description_ar", "").split()[0] if cat_data.get("description_ar") else cat_data["name"],
                icon=cat_data["icon"],
                color_theme=cat_data["color_theme"],
                is_active=True,
                is_featured=cat_data.get("is_featured", False),
                sort_order=cat_data["sort_order"]
            )
            db.add(category)
            db.flush()
            created_categories[cat_data["name"]] = category
        
        # Create demo menu items with enhanced fields
        menu_items = [
            {
                "category": "Appetizers",
                "name": "Caesar Salad",
                "name_ar": "سلطة سيزر",
                "description": "Crisp romaine lettuce, parmesan cheese, croutons, and our signature Caesar dressing",
                "description_ar": "خس روماني مقرمش، جبنة بارميزان، خبز محمص، وصلصة السيزر المميزة",
                "price": 32.00,
                "price_without_vat": 27.83,
                "calories": 380,
                "preparation_time": 10,
                "walk_minutes": 45,
                "run_minutes": 15,
                "vegetarian": True,
                "badge_text": "Popular",
                "badge_color": "#10B981",
                "serving_size": "1 bowl (250g)",
                "ingredients": "Romaine lettuce, Parmesan cheese, Croutons, Caesar dressing, Lemon juice",
                "protein": 12.5,
                "total_fat": 28.0,
                "total_carbs": 18.0,
                "is_featured": True,
                "instagram_worthy": True
            },
            {
                "category": "Main Courses",
                "name": "Grilled Salmon",
                "name_ar": "سلمون مشوي",
                "description": "Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables",
                "description_ar": "سلمون أطلسي طازج مشوي بإتقان، يقدم مع خضروات موسمية",
                "price": 95.00,
                "price_without_vat": 82.61,
                "calories": 520,
                "preparation_time": 25,
                "walk_minutes": 60,
                "run_minutes": 20,
                "cooking_method": "Grilled",
                "origin_country": "Norway",
                "texture_notes": "Flaky and tender",
                "flavor_profile": "Rich and savory",
                "wine_pairing": "Chardonnay or Pinot Noir",
                "chef_notes": "Best served medium-rare for optimal flavor",
                "signature_dish": True,
                "michelin_recommended": True,
                "protein": 42.0,
                "total_fat": 28.0,
                "omega_3": True,
                "sustainability_info": "Sustainably sourced from certified farms"
            },
            {
                "category": "Desserts",
                "name": "Chocolate Lava Cake",
                "name_ar": "كيك الشوكولاتة البركاني",
                "description": "Warm chocolate cake with a molten center, served with vanilla ice cream",
                "description_ar": "كيك شوكولاتة دافئ مع مركز ذائب، يقدم مع آيس كريم الفانيليا",
                "price": 38.00,
                "price_without_vat": 33.04,
                "calories": 450,
                "preparation_time": 15,
                "walk_minutes": 55,
                "run_minutes": 18,
                "vegetarian": True,
                "contains_caffeine": True,
                "instagram_worthy": True,
                "limited_availability": True,
                "max_daily_orders": 20,
                "badge_text": "Chef's Special",
                "badge_color": "#EC4899",
                "texture_notes": "Soft cake with gooey center",
                "flavor_profile": "Rich chocolate, sweet",
                "award_winning": True
            }
        ]
        
        for item_data in menu_items:
            category_name = item_data.pop("category")
            category = created_categories.get(category_name)
            
            if category:
                # Set default values for missing fields
                item = MenuItem(
                    tenant_id=demo_tenant.id,
                    category_id=category.id,
                    halal=True,  # Default for demo
                    is_available=True,
                    sort_order=0,
                    **item_data
                )
                db.add(item)
        
        # Create default allergen icons
        default_allergens = [
            {"name": "gluten", "display_name": "Gluten", "display_name_ar": "جلوتين", "icon_url": "🌾"},
            {"name": "dairy", "display_name": "Dairy", "display_name_ar": "منتجات الألبان", "icon_url": "🥛"},
            {"name": "eggs", "display_name": "Eggs", "display_name_ar": "بيض", "icon_url": "🥚"},
            {"name": "fish", "display_name": "Fish", "display_name_ar": "سمك", "icon_url": "🐟"},
            {"name": "shellfish", "display_name": "Shellfish", "display_name_ar": "محار", "icon_url": "🦐"},
            {"name": "tree_nuts", "display_name": "Tree Nuts", "display_name_ar": "مكسرات", "icon_url": "🌰"},
            {"name": "peanuts", "display_name": "Peanuts", "display_name_ar": "فول سوداني", "icon_url": "🥜"},
            {"name": "soy", "display_name": "Soy", "display_name_ar": "صويا", "icon_url": "🌱"},
            {"name": "sesame", "display_name": "Sesame", "display_name_ar": "سمسم", "icon_url": "🌻"}
        ]
        
        for allergen_data in default_allergens:
            allergen = AllergenIcon(
                tenant_id=demo_tenant.id,
                **allergen_data
            )
            db.add(allergen)
        
        db.commit()
        print(f"Created demo tenant: demo.menuiq.io (admin@demo.menuiq.io / demo123)")
    
    db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)