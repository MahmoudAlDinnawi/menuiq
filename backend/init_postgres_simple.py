#!/usr/bin/env python3
"""
Simple PostgreSQL initialization without allergens
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import bcrypt

# Load environment variables
env_file = '.env.postgres' if os.getenv('ENVIRONMENT') != 'production' else '.env.production.postgres'
load_dotenv(env_file)

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Initializing database...")

# Create engine
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Create system admin
        print("👤 Creating system admin...")
        admin_password = "admin123"
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        result = conn.execute(text("""
            INSERT INTO system_admins (email, username, password_hash, is_active)
            VALUES (:email, :username, :password_hash, :is_active)
            RETURNING id
        """), {
            "email": "admin@menuiq.io",
            "username": "admin",
            "password_hash": hashed_password,
            "is_active": True
        })
        admin_id = result.scalar()
        
        # Create demo tenant
        print("🏢 Creating demo tenant...")
        result = conn.execute(text("""
            INSERT INTO tenants (name, subdomain, contact_email, contact_phone, address, status, max_menu_items, max_categories)
            VALUES (:name, :subdomain, :email, :phone, :address, :status, :max_items, :max_cats)
            RETURNING id
        """), {
            "name": "Demo Restaurant",
            "subdomain": "demo",
            "email": "demo@menuiq.io",
            "phone": "+1234567890",
            "address": "123 Demo Street",
            "status": "active",
            "max_items": 100,
            "max_cats": 10
        })
        tenant_id = result.scalar()
        
        # Create demo user
        print("👤 Creating demo user...")
        user_password = "demo123"
        user_hashed = bcrypt.hashpw(user_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn.execute(text("""
            INSERT INTO users (tenant_id, email, username, password_hash, role, is_active)
            VALUES (:tenant_id, :email, :username, :password_hash, :role, :is_active)
        """), {
            "tenant_id": tenant_id,
            "email": "demo@restaurant.com",
            "username": "demo",
            "password_hash": user_hashed,
            "role": "admin",
            "is_active": True
        })
        
        # Create settings
        print("⚙️  Creating settings...")
        conn.execute(text("""
            INSERT INTO settings (tenant_id, currency_symbol, language, primary_color, secondary_color, 
                                show_prices, show_descriptions, show_images, show_allergens)
            VALUES (:tenant_id, :currency, :lang, :primary, :secondary, :prices, :desc, :images, :allergens)
        """), {
            "tenant_id": tenant_id,
            "currency": "$",
            "lang": "en",
            "primary": "#2563eb",
            "secondary": "#1e40af",
            "prices": True,
            "desc": True,
            "images": True,
            "allergens": True
        })
        
        # Create categories
        print("📁 Creating categories...")
        categories = [
            ("Appetizers", "Start your meal right", 1),
            ("Main Courses", "Hearty and delicious mains", 2),
            ("Desserts", "Sweet endings", 3),
            ("Beverages", "Refreshing drinks", 4)
        ]
        
        category_ids = {}
        for name, desc, order in categories:
            result = conn.execute(text("""
                INSERT INTO categories (tenant_id, name, description, sort_order, is_active)
                VALUES (:tenant_id, :name, :desc, :order, :active)
                RETURNING id
            """), {
                "tenant_id": tenant_id,
                "name": name,
                "desc": desc,
                "order": order,
                "active": True
            })
            category_ids[name] = result.scalar()
        
        # Create menu items
        print("🍽️  Creating menu items...")
        menu_items = [
            ("Appetizers", "Bruschetta", "Grilled bread with tomatoes, garlic, and basil", 8.99, 120),
            ("Appetizers", "Caesar Salad", "Crisp romaine, parmesan, croutons, Caesar dressing", 10.99, 380),
            ("Main Courses", "Grilled Salmon", "Atlantic salmon with lemon butter sauce", 24.99, 420),
            ("Main Courses", "Ribeye Steak", "12oz prime ribeye, perfectly seasoned", 32.99, 680),
            ("Desserts", "Chocolate Lava Cake", "Warm chocolate cake with molten center", 7.99, 480),
            ("Beverages", "Fresh Orange Juice", "Freshly squeezed orange juice", 4.99, 110)
        ]
        
        for cat_name, name, desc, price, calories in menu_items:
            conn.execute(text("""
                INSERT INTO menu_items (tenant_id, category_id, name, description, price, calories, is_available)
                VALUES (:tenant_id, :cat_id, :name, :desc, :price, :calories, :available)
            """), {
                "tenant_id": tenant_id,
                "cat_id": category_ids[cat_name],
                "name": name,
                "desc": desc,
                "price": price,
                "calories": calories,
                "available": True
            })
        
        # Create allergen icons
        print("🥜 Creating allergen icons...")
        allergens = [
            ("gluten", "Gluten", "🌾"),
            ("dairy", "Dairy", "🥛"),
            ("eggs", "Eggs", "🥚"),
            ("fish", "Fish", "🐟"),
            ("shellfish", "Shellfish", "🦐"),
            ("nuts", "Tree Nuts", "🌰"),
            ("peanuts", "Peanuts", "🥜"),
            ("soy", "Soy", "🌱"),
            ("sesame", "Sesame", "🌻")
        ]
        
        for name, display, icon in allergens:
            conn.execute(text("""
                INSERT INTO allergen_icons (tenant_id, name, icon, description)
                VALUES (:tenant_id, :name, :icon, :desc)
            """), {
                "tenant_id": tenant_id,
                "name": name,
                "icon": icon,
                "desc": f"Contains {display}"
            })
        
        conn.commit()
        
        print("\n✅ Database initialization complete!")
        print("\n📋 Default Credentials:")
        print(f"   System Admin: admin@menuiq.io / {admin_password}")
        print(f"   Demo Tenant: demo@restaurant.com / {user_password}")
        print(f"   Demo URL: https://demo.menuiq.io")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()