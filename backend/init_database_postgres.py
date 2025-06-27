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
    
    # Create all tables
    print("📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if already initialized by checking if tables exist
        try:
            existing_admin = session.query(SystemAdmin).first()
            if existing_admin:
                print("⚠️  Database already initialized. Skipping...")
                return
        except Exception:
            # Tables don't exist yet, which is expected on first run
            pass
        
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
        session.commit()
        
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
        
        # Create sample categories
        print("📁 Creating sample categories...")
        categories = [
            {"name": "Appetizers", "description": "Start your meal right", "sort_order": 1},
            {"name": "Main Courses", "description": "Hearty and delicious mains", "sort_order": 2},
            {"name": "Desserts", "description": "Sweet endings", "sort_order": 3},
            {"name": "Beverages", "description": "Refreshing drinks", "sort_order": 4}
        ]
        
        for cat_data in categories:
            category = Category(tenant_id=demo_tenant.id, **cat_data)
            session.add(category)
        
        session.commit()
        
        # Get category IDs
        appetizers = session.query(Category).filter_by(name="Appetizers", tenant_id=demo_tenant.id).first()
        mains = session.query(Category).filter_by(name="Main Courses", tenant_id=demo_tenant.id).first()
        desserts = session.query(Category).filter_by(name="Desserts", tenant_id=demo_tenant.id).first()
        beverages = session.query(Category).filter_by(name="Beverages", tenant_id=demo_tenant.id).first()
        
        # Create sample menu items
        print("🍽️  Creating sample menu items...")
        menu_items = [
            # Appetizers
            {
                "category_id": appetizers.id,
                "name": "Bruschetta",
                "description": "Grilled bread with tomatoes, garlic, and basil",
                "price": 8.99,
                "is_available": True,
                "calories": 120,
                "sort_order": 1
            },
            {
                "category_id": appetizers.id,
                "name": "Caesar Salad",
                "description": "Crisp romaine, parmesan, croutons, Caesar dressing",
                "price": 10.99,
                "is_available": True,
                "calories": 380,
                "sort_order": 2
            },
            # Main Courses
            {
                "category_id": mains.id,
                "name": "Grilled Salmon",
                "description": "Atlantic salmon with lemon butter sauce",
                "price": 24.99,
                "is_available": True,
                "calories": 420,
                "sort_order": 1
            },
            {
                "category_id": mains.id,
                "name": "Ribeye Steak",
                "description": "12oz prime ribeye, perfectly seasoned",
                "price": 32.99,
                "is_available": True,
                "calories": 680,
                "sort_order": 2
            },
            # Desserts
            {
                "category_id": desserts.id,
                "name": "Chocolate Lava Cake",
                "description": "Warm chocolate cake with molten center",
                "price": 7.99,
                "is_available": True,
                "calories": 480,
                "sort_order": 1
            },
            # Beverages
            {
                "category_id": beverages.id,
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
        
        # Create default allergen icons
        print("🥜 Creating default allergen icons...")
        allergens = [
            {"id": 1, "name": "Gluten", "icon": "🌾"},
            {"id": 2, "name": "Dairy", "icon": "🥛"},
            {"id": 3, "name": "Eggs", "icon": "🥚"},
            {"id": 4, "name": "Fish", "icon": "🐟"},
            {"id": 5, "name": "Shellfish", "icon": "🦐"},
            {"id": 6, "name": "Tree Nuts", "icon": "🌰"},
            {"id": 7, "name": "Peanuts", "icon": "🥜"},
            {"id": 8, "name": "Soy", "icon": "🌱"},
            {"id": 9, "name": "Sesame", "icon": "🌻"}
        ]
        
        for allergen_data in allergens:
            # Use raw SQL for PostgreSQL to handle the id column properly
            session.execute(
                text("""
                    INSERT INTO allergen_icons (id, name, icon, tenant_id) 
                    VALUES (:id, :name, :icon, :tenant_id)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": allergen_data["id"],
                    "name": allergen_data["name"],
                    "icon": allergen_data["icon"],
                    "tenant_id": demo_tenant.id
                }
            )
        
        session.commit()
        
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