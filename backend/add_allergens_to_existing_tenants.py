#!/usr/bin/env python3
"""
Migration script to add default allergen icons to existing tenants
"""
import os
import sys
from sqlalchemy.orm import Session

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from models import Tenant, AllergenIcon

def add_allergens_to_tenants():
    """Add default allergen icons to all tenants that don't have any"""
    db = SessionLocal()
    
    try:
        # Get all tenants
        tenants = db.query(Tenant).all()
        
        # Default allergen icons
        default_allergens = [
            {"name": "milk", "display_name": "Milk", "display_name_ar": "حليب", 
             "icon_url": "/src/assets/allergy_icons/milk.svg", "sort_order": 1},
            {"name": "eggs", "display_name": "Eggs", "display_name_ar": "بيض", 
             "icon_url": "/src/assets/allergy_icons/egg.svg", "sort_order": 2},
            {"name": "fish", "display_name": "Fish", "display_name_ar": "سمك", 
             "icon_url": "/src/assets/allergy_icons/fish.svg", "sort_order": 3},
            {"name": "shellfish", "display_name": "Shellfish", "display_name_ar": "محار", 
             "icon_url": "/src/assets/allergy_icons/Shellfish.svg", "sort_order": 4},
            {"name": "tree_nuts", "display_name": "Tree Nuts", "display_name_ar": "مكسرات", 
             "icon_url": "/src/assets/allergy_icons/nuts.svg", "sort_order": 5},
            {"name": "wheat", "display_name": "Wheat/Gluten", "display_name_ar": "قمح/جلوتين", 
             "icon_url": "/src/assets/allergy_icons/gulten.svg", "sort_order": 6},
            {"name": "soybeans", "display_name": "Soybeans", "display_name_ar": "فول الصويا", 
             "icon_url": "/src/assets/allergy_icons/soy.svg", "sort_order": 7},
            {"name": "sesame", "display_name": "Sesame", "display_name_ar": "سمسم", 
             "icon_url": "/src/assets/allergy_icons/sesame.svg", "sort_order": 8},
            {"name": "mustard", "display_name": "Mustard", "display_name_ar": "خردل", 
             "icon_url": "/src/assets/allergy_icons/mustard.svg", "sort_order": 9},
            {"name": "salt", "display_name": "Salt", "display_name_ar": "ملح", 
             "icon_url": "/src/assets/allergy_icons/salt.svg", "sort_order": 10}
        ]
        
        for tenant in tenants:
            # Check if tenant already has allergen icons
            existing_allergens = db.query(AllergenIcon).filter(
                AllergenIcon.tenant_id == tenant.id
            ).count()
            
            if existing_allergens == 0:
                print(f"Adding allergen icons for tenant: {tenant.name} (ID: {tenant.id})")
                
                # Add default allergen icons
                for allergen_data in default_allergens:
                    allergen = AllergenIcon(
                        tenant_id=tenant.id,
                        is_active=True,
                        **allergen_data
                    )
                    db.add(allergen)
                
                db.commit()
                print(f"✓ Added {len(default_allergens)} allergen icons for {tenant.name}")
            else:
                print(f"✓ Tenant {tenant.name} already has {existing_allergens} allergen icons")
        
        print("\nMigration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting allergen icons migration...")
    add_allergens_to_tenants()