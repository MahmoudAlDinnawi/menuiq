from database import get_db
from models import MenuItem
from sqlalchemy.orm import Session

# Get database session
db = next(get_db())

# Find all multi-items
multi_items = db.query(MenuItem).filter(
    MenuItem.is_multi_item == True
).all()

print(f"\n=== Found {len(multi_items)} multi-items ===\n")

for item in multi_items:
    print(f"ID: {item.id}")
    print(f"Name: {item.name}")
    print(f"Tenant ID: {item.tenant_id}")
    print(f"Image: {item.image}")
    print(f"Has sub-items: {len(list(item.sub_items))}")
    print("-" * 40)

# Check if any multi-items have images
with_images = [i for i in multi_items if i.image]
print(f"\nMulti-items with images: {len(with_images)}/{len(multi_items)}")

# Check recent items
print("\n=== Recent items (last 5) ===")
recent_items = db.query(MenuItem).order_by(MenuItem.created_at.desc()).limit(5).all()
for item in recent_items:
    print(f"ID: {item.id}, Name: {item.name}, Multi: {item.is_multi_item}, Image: {item.image}")

db.close()
