"""Update allergen icons to use SVG paths"""
from sqlalchemy.orm import Session
from database import engine, get_db
from models import AllergenIcon

def update_allergen_svg_icons():
    db = next(get_db())
    
    # Mapping of allergen names to SVG file paths
    svg_icons = {
        "Gluten": "/src/assets/allergy_icons/gulten.svg",
        "Dairy": "/src/assets/allergy_icons/milk.svg", 
        "Eggs": "/src/assets/allergy_icons/egg.svg",
        "Fish": "/src/assets/allergy_icons/fish.svg",
        "Shellfish": "/src/assets/allergy_icons/Shellfish.svg",
        "Tree Nuts": "/src/assets/allergy_icons/tree_nuts.svg",  # We'll use a placeholder
        "Peanuts": "/src/assets/allergy_icons/peanuts.svg",      # We'll use a placeholder
        "Soy": "/src/assets/allergy_icons/soy.svg",
        "Sesame": "/src/assets/allergy_icons/sesame.svg"
    }
    
    # Update each allergen
    for name, svg_path in svg_icons.items():
        allergen = db.query(AllergenIcon).filter(
            AllergenIcon.name == name
        ).first()
        
        if allergen:
            # Check if the file exists in our list, otherwise keep emoji
            if name in ["Gluten", "Dairy", "Eggs", "Fish", "Shellfish", "Soy", "Sesame"]:
                allergen.icon_url = svg_path
                print(f"Updated {name} icon to {svg_path}")
            else:
                print(f"Keeping emoji for {name} (no SVG available)")
        else:
            print(f"Allergen {name} not found")
    
    # Also handle salt if it exists
    salt = db.query(AllergenIcon).filter(
        AllergenIcon.name == "Salt"
    ).first()
    if salt:
        salt.icon_url = "/src/assets/allergy_icons/salt.svg"
        print("Updated Salt icon")
    
    db.commit()
    print("Allergen SVG icons updated successfully")

if __name__ == "__main__":
    update_allergen_svg_icons()