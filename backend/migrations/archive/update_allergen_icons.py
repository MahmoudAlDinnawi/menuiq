"""Update allergen icons to use emojis"""
from sqlalchemy.orm import Session
from database import engine, get_db
from models import AllergenIcon

def update_allergen_icons():
    db = next(get_db())
    
    # Mapping of allergen names to emoji icons
    emoji_icons = {
        "Gluten": "🌾",
        "Dairy": "🥛", 
        "Eggs": "🥚",
        "Fish": "🐟",
        "Shellfish": "🦐",
        "Tree Nuts": "🌰",
        "Peanuts": "🥜",
        "Soy": "🫘",
        "Sesame": "🌻"
    }
    
    # Update each allergen
    for name, emoji in emoji_icons.items():
        allergen = db.query(AllergenIcon).filter(
            AllergenIcon.name == name
        ).first()
        
        if allergen:
            allergen.icon_url = emoji
            print(f"Updated {name} icon to {emoji}")
        else:
            print(f"Allergen {name} not found")
    
    db.commit()
    print("Allergen icons updated successfully")

if __name__ == "__main__":
    update_allergen_icons()