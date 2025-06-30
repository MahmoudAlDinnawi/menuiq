"""Add sample allergen icons to the database"""
from sqlalchemy.orm import Session
from database import engine, get_db
from models import AllergenIcon, Tenant

def add_sample_allergens():
    db = next(get_db())
    
    # Get the demo tenant
    tenant = db.query(Tenant).filter(Tenant.subdomain == "demo").first()
    if not tenant:
        print("Demo tenant not found")
        return
    
    # Common allergens with emoji icons
    allergens = [
        {
            "name": "milk",
            "display_name": "Milk",
            "display_name_ar": "حليب",
            "icon_url": "🥛",
            "sort_order": 1
        },
        {
            "name": "eggs",
            "display_name": "Eggs",
            "display_name_ar": "بيض",
            "icon_url": "🥚",
            "sort_order": 2
        },
        {
            "name": "fish",
            "display_name": "Fish",
            "display_name_ar": "سمك",
            "icon_url": "🐟",
            "sort_order": 3
        },
        {
            "name": "shellfish",
            "display_name": "Shellfish",
            "display_name_ar": "محار",
            "icon_url": "🦐",
            "sort_order": 4
        },
        {
            "name": "tree_nuts",
            "display_name": "Tree Nuts",
            "display_name_ar": "مكسرات",
            "icon_url": "🌰",
            "sort_order": 5
        },
        {
            "name": "peanuts",
            "display_name": "Peanuts",
            "display_name_ar": "فول سوداني",
            "icon_url": "🥜",
            "sort_order": 6
        },
        {
            "name": "wheat",
            "display_name": "Wheat/Gluten",
            "display_name_ar": "قمح/جلوتين",
            "icon_url": "🌾",
            "sort_order": 7
        },
        {
            "name": "soybeans",
            "display_name": "Soybeans",
            "display_name_ar": "فول الصويا",
            "icon_url": "🫘",
            "sort_order": 8
        },
        {
            "name": "sesame",
            "display_name": "Sesame",
            "display_name_ar": "سمسم",
            "icon_url": "🌻",
            "sort_order": 9
        }
    ]
    
    # Add allergens for the tenant
    for allergen_data in allergens:
        # Check if already exists
        existing = db.query(AllergenIcon).filter(
            AllergenIcon.tenant_id == tenant.id,
            AllergenIcon.name == allergen_data["name"]
        ).first()
        
        if not existing:
            allergen = AllergenIcon(
                tenant_id=tenant.id,
                **allergen_data
            )
            db.add(allergen)
            print(f"Added allergen: {allergen_data['display_name']}")
        else:
            print(f"Allergen already exists: {allergen_data['display_name']}")
    
    db.commit()
    print("Sample allergens added successfully")

if __name__ == "__main__":
    add_sample_allergens()