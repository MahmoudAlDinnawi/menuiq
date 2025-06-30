"""Add mustard allergen and update icons"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, get_db
from models import AllergenIcon

def add_mustard_and_update_icons():
    db = next(get_db())
    
    # Check if mustard already exists
    mustard = db.query(AllergenIcon).filter(
        AllergenIcon.name == "Mustard"
    ).first()
    
    if not mustard:
        # Add mustard allergen
        # Get the max ID first to avoid conflicts
        max_id = db.query(func.max(AllergenIcon.id)).scalar() or 0
        
        mustard = AllergenIcon(
            id=max_id + 1,
            tenant_id=1,  # Demo tenant
            name="Mustard",
            display_name="Mustard",
            display_name_ar="خردل",
            icon_url="/src/assets/allergy_icons/mustard.svg",
            sort_order=10,
            is_active=True
        )
        db.add(mustard)
        db.flush()  # Flush to avoid ID conflicts
        print("Added Mustard allergen")
    else:
        # Update icon if exists
        mustard.icon_url = "/src/assets/allergy_icons/mustard.svg"
        print("Updated Mustard icon")
    
    # For Tree Nuts and Peanuts that don't have specific SVGs, 
    # let's use a generic nut icon or keep emojis
    tree_nuts = db.query(AllergenIcon).filter(
        AllergenIcon.name == "Tree Nuts"
    ).first()
    
    if tree_nuts and tree_nuts.icon_url == "🌰":
        # Keep emoji for now since we don't have specific SVG
        print("Keeping emoji for Tree Nuts")
    
    peanuts = db.query(AllergenIcon).filter(
        AllergenIcon.name == "Peanuts"  
    ).first()
    
    if peanuts and peanuts.icon_url == "🥜":
        # Keep emoji for now since we don't have specific SVG
        print("Keeping emoji for Peanuts")
    
    db.commit()
    print("Database updated successfully")

if __name__ == "__main__":
    add_mustard_and_update_icons()