#!/usr/bin/env python3
"""
Script to test updating menu item ID 9 and capture any errors.
This will help diagnose the 500 error issue.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime
from decimal import Decimal
import traceback

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import MenuItem, Tenant, AllergenIcon

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/menuiq_dev")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_menu_item_update(item_id=9):
    """Test updating menu item and capture any errors."""
    db = SessionLocal()
    
    try:
        print(f"=== Testing Menu Item Update for ID: {item_id} ===\n")
        
        # First, check if the menu item exists
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        
        if not item:
            print(f"ERROR: Menu item with ID {item_id} not found!")
            return
        
        print(f"Found menu item: {item.name} (ID: {item.id}, Tenant ID: {item.tenant_id})")
        print(f"Current values:")
        print(f"  - Price: {item.price}")
        print(f"  - Description: {item.description[:50]}..." if item.description else "  - Description: None")
        print(f"  - Is Available: {item.is_available}")
        print(f"  - Is Upsell: {item.is_upsell}")
        print()
        
        # Simulate the update data that might be causing the error
        update_data = {
            "name": item.name,  # Keep existing name
            "description": item.description,  # Keep existing description
            "price": "99.99",  # Test with string that needs conversion
            "is_available": True,
            "is_upsell": True,
            "upsell_style": "premium",
            "upsell_border_color": "#FFD700",
            "upsell_background_color": "#FFF8DC",
            "upsell_badge_text": "Special Offer",
            "upsell_badge_color": "#FF0000",
            "upsell_animation": "pulse",
            "upsell_icon": "star",
            "allergen_ids": []  # Test with empty allergen list
        }
        
        print("Attempting to update with test data...")
        print(f"Update data: {update_data}")
        print()
        
        # Try to update each field and catch specific errors
        for field, value in update_data.items():
            # Skip allergen_ids as it's handled separately
            if field in ["allergen_ids", "allergens"]:
                continue
            
            # Convert price fields
            if field in ["price", "price_without_vat", "promotion_price"]:
                if value is not None:
                    try:
                        value = Decimal(str(value))
                        print(f"  ✓ Converted {field} to Decimal: {value}")
                    except Exception as e:
                        print(f"  ✗ ERROR converting {field} to Decimal: {e}")
                        continue
            
            # Check if field exists on model
            if hasattr(item, field):
                try:
                    old_value = getattr(item, field)
                    setattr(item, field, value)
                    print(f"  ✓ Set {field}: {old_value} → {value}")
                except Exception as e:
                    print(f"  ✗ ERROR setting {field}: {e}")
                    traceback.print_exc()
            else:
                print(f"  ! WARNING: Field '{field}' does not exist on MenuItem model")
        
        # Update timestamp
        item.updated_at = datetime.utcnow()
        
        # Test allergen update
        if "allergen_ids" in update_data:
            print("\nTesting allergen update...")
            try:
                # Clear existing allergens
                item.allergens = []
                print("  ✓ Cleared existing allergens")
                
                # Add new allergens (if any)
                for allergen_id in update_data["allergen_ids"]:
                    allergen = db.query(AllergenIcon).filter(
                        AllergenIcon.id == allergen_id,
                        AllergenIcon.tenant_id == item.tenant_id
                    ).first()
                    
                    if allergen:
                        item.allergens.append(allergen)
                        print(f"  ✓ Added allergen: {allergen.display_name}")
                    else:
                        print(f"  ! WARNING: Allergen ID {allergen_id} not found for tenant")
            except Exception as e:
                print(f"  ✗ ERROR updating allergens: {e}")
                traceback.print_exc()
        
        # Try to commit the changes
        print("\nAttempting to commit changes...")
        try:
            db.commit()
            print("✓ Successfully committed changes!")
            
            # Verify the update
            db.refresh(item)
            print(f"\nVerification - Updated values:")
            print(f"  - Price: {item.price}")
            print(f"  - Is Upsell: {item.is_upsell}")
            print(f"  - Upsell Style: {item.upsell_style}")
            print(f"  - Updated At: {item.updated_at}")
            
        except Exception as e:
            print(f"✗ ERROR during commit: {e}")
            traceback.print_exc()
            db.rollback()
            
    except Exception as e:
        print(f"✗ UNEXPECTED ERROR: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    # Default to item_id=9, but allow override from command line
    item_id = 9
    if len(sys.argv) > 1:
        try:
            item_id = int(sys.argv[1])
        except ValueError:
            print("Usage: python test_menu_item_update.py [item_id]")
            sys.exit(1)
    
    test_menu_item_update(item_id)