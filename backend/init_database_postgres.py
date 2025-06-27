#!/usr/bin/env python3
"""
PostgreSQL Database Initialization Script
Creates all tables and initial data for MenuIQ
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import bcrypt

# Load environment variables
env_file = '.env.postgres' if os.getenv('ENVIRONMENT') != 'production' else '.env.production.postgres'
load_dotenv(env_file)

# Import models
from database_postgres import engine, Base
from models_multitenant import (
    Tenant, User, SystemAdmin, Category, MenuItem, 
    ItemAllergen, Settings, AllergenIcon, ActivityLog
)

def init_database():
    """Initialize PostgreSQL database with tables and default data"""
    
    print("🚀 Starting PostgreSQL database initialization...")
    
    # Drop all tables first (for clean start)
    print("🗑️  Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    print("📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create default system admin
        print("👤 Creating default system admin...")
        admin_password = "admin123"  # Change in production!
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin = SystemAdmin(
            email="admin@menuiq.io",
            username="admin",
            password_hash=hashed_password,
            is_active=True
        )
        session.add(admin)
        session.commit()  # Commit admin first
        
        # Create demo tenant
        print("🏢 Creating demo tenant...")
        demo_tenant = Tenant(
            name="Demo Restaurant",
            subdomain="demo",
            contact_email="demo@menuiq.io",
            contact_phone="+1234567890",
            address="123 Demo Street",
            status="active",
            max_menu_items=100,
            max_categories=10
        )
        session.add(demo_tenant)
        session.commit()  # Commit tenant to get ID
        
        # Create demo user for the tenant
        print("👤 Creating demo user...")
        user_password = "demo123"
        user_hashed_password = bcrypt.hashpw(user_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        demo_user = User(
            email="demo@restaurant.com",
            username="demo",
            password_hash=user_hashed_password,
            tenant_id=demo_tenant.id,
            role="admin",
            is_active=True
        )
        session.add(demo_user)
        session.commit()  # Commit user
        
        # Create default settings for demo tenant
        print("⚙️  Creating default settings...")
        settings = Settings(
            tenant_id=demo_tenant.id,
            restaurant_name=demo_tenant.name,
            primary_color="#2563eb",
            secondary_color="#1e40af",
            show_prices=True,
            show_descriptions=True,
            show_images=True,
            show_allergens=True,
            currency_symbol="$",
            language="en"
        )
        session.add(settings)
        session.commit()  # Commit settings
        
        # Create sample categories
        print("📁 Creating sample categories...")
        categories = [
            {"name": "Appetizers", "description": "Start your meal right", "sort_order": 1},
            {"name": "Main Courses", "description": "Hearty and delicious mains", "sort_order": 2},
            {"name": "Desserts", "description": "Sweet endings", "sort_order": 3},
            {"name": "Beverages", "description": "Refreshing drinks", "sort_order": 4}
        ]
        
        category_objects = []
        for cat_data in categories:
            category = Category(tenant_id=demo_tenant.id, **cat_data)
            session.add(category)
            category_objects.append(category)
        
        session.commit()  # Commit categories
        
        # Create sample menu items
        print("🍽️  Creating sample menu items...")
        menu_items = [
            # Appetizers
            {
                "category_id": category_objects[0].id,
                "name": "Bruschetta",
                "description": "Grilled bread with tomatoes, garlic, and basil",
                "price": 8.99,
                "is_available": True,
                "calories": 120,
                "sort_order": 1
            },
            {
                "category_id": category_objects[0].id,
                "name": "Caesar Salad",
                "description": "Crisp romaine, parmesan, croutons, Caesar dressing",
                "price": 10.99,
                "is_available": True,
                "calories": 380,
                "sort_order": 2
            },
            # Main Courses
            {
                "category_id": category_objects[1].id,
                "name": "Grilled Salmon",
                "description": "Atlantic salmon with lemon butter sauce",
                "price": 24.99,
                "is_available": True,
                "calories": 420,
                "sort_order": 1
            },
            {
                "category_id": category_objects[1].id,
                "name": "Ribeye Steak",
                "description": "12oz prime ribeye, perfectly seasoned",
                "price": 32.99,
                "is_available": True,
                "calories": 680,
                "sort_order": 2
            },
            # Desserts
            {
                "category_id": category_objects[2].id,
                "name": "Chocolate Lava Cake",
                "description": "Warm chocolate cake with molten center",
                "price": 7.99,
                "is_available": True,
                "calories": 480,
                "sort_order": 1
            },
            # Beverages
            {
                "category_id": category_objects[3].id,
                "name": "Fresh Orange Juice",
                "description": "Freshly squeezed orange juice",
                "price": 4.99,
                "is_available": True,
                "calories": 110,
                "sort_order": 1
            }
        ]
        
        for item_data in menu_items:
            item = MenuItem(tenant_id=demo_tenant.id, **item_data)
            session.add(item)
        
        session.commit()  # Commit menu items
        
        # Create default allergen icons
        print("🥜 Creating default allergen icons...")
        allergens = [
            {"name": "Gluten", "icon": "🌾"},
            {"name": "Dairy", "icon": "🥛"},
            {"name": "Eggs", "icon": "🥚"},
            {"name": "Fish", "icon": "🐟"},
            {"name": "Shellfish", "icon": "🦐"},
            {"name": "Tree Nuts", "icon": "🌰"},
            {"name": "Peanuts", "icon": "🥜"},
            {"name": "Soy", "icon": "🌱"},
            {"name": "Sesame", "icon": "🌻"}
        ]
        
        # Reset sequence for allergen_icons to start from 1
        session.execute(text("ALTER SEQUENCE allergen_icons_id_seq RESTART WITH 1"))
        
        for i, allergen_data in enumerate(allergens, 1):
            allergen = AllergenIcon(
                id=i,
                name=allergen_data["name"],
                icon=allergen_data["icon"],
                tenant_id=demo_tenant.id
            )
            session.add(allergen)
        
        session.commit()  # Commit allergens
        
        print("\n✅ Database initialization complete!")
        print("\n📋 Default Credentials:")
        print(f"   System Admin: admin@menuiq.io / {admin_password}")
        print(f"   Demo Tenant: demo@restaurant.com / {user_password}")
        print(f"   Demo URL: https://demo.menuiq.io")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_database()