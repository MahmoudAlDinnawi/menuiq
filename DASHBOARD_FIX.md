# Dashboard Fix Summary

## Issues Found

1. **Category Model Mismatch**:
   - Database has: `value`, `label`, `label_ar`, `icon`
   - API expected: `name`, `description`
   - **Fixed**: Updated pydantic models to match database

2. **MenuItem Model Mismatch**:
   - Database has: `price` as String, `image` (not `image_url`)
   - Database has many nutrition fields not in API response
   - Missing fields: `is_featured`, `is_spicy`, `spice_level`

3. **Authentication Issues**:
   - Some endpoints expect wrong user object type

## Quick Database Fix

If you want to quickly fix the dashboard without changing code, run these SQL commands:

```sql
-- Connect to database
sudo -u postgres psql -d menuiq_production

-- Add missing columns to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_spicy BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Copy image to image_url
UPDATE menu_items SET image_url = image WHERE image_url IS NULL;

-- Add missing timestamp columns
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure categories have proper fields
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE categories SET name = label WHERE name IS NULL;
```

## Frontend Fixes Needed

The frontend expects certain field formats. Update these components:

1. **NutritionEnhancedItemForm.js** - Update to use correct field names
2. **Dashboard.js** - Handle field mismatches

## API Response Fixes

Update the MenuItem response to match what's actually in the database:

```python
class MenuItemResponse(BaseModel):
    id: int
    tenant_id: int
    category_id: Optional[int]
    name: str
    name_ar: Optional[str]
    price: Optional[str]  # Changed from float
    price_without_vat: Optional[str]
    description: Optional[str]
    description_ar: Optional[str]
    image: Optional[str]  # Changed from image_url
    calories: Optional[int]
    is_available: bool = True
    # ... other actual fields
```

## Testing Checklist

After deploying fixes:

1. ✓ Can you see categories in the dashboard?
2. ✓ Can you create a new category?
3. ✓ Can you see menu items?
4. ✓ Can you create a new menu item?
5. ✓ Can you edit existing items?
6. ✓ Can you upload images?
7. ✓ Do settings load properly?