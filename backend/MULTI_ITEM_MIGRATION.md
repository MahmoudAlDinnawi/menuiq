# Multi-Item Feature Migration Documentation

## Overview
This migration adds support for multi-item menu items, where a single menu item can have multiple sub-items with different prices and variations.

## Database Changes

### New Columns Added to `menu_items` Table:

1. **`is_multi_item`** (Boolean, default: false)
   - Indicates if this item is a multi-item container

2. **`parent_item_id`** (Integer, nullable, Foreign Key)
   - References the parent multi-item if this is a sub-item
   - Has CASCADE delete to remove sub-items when parent is deleted

3. **`price_min`** (Decimal(10,2), nullable)
   - Minimum price for multi-items (calculated from sub-items)

4. **`price_max`** (Decimal(10,2), nullable)
   - Maximum price for multi-items (calculated from sub-items)

5. **`display_as_grid`** (Boolean, default: true)
   - Display preference for sub-items (grid vs list)

6. **`sub_item_order`** (Integer, default: 0)
   - Sort order for sub-items within a multi-item

### Database Constraints:

1. **Foreign Key**: `fk_menu_items_parent_item_id`
   - Links sub-items to their parent multi-item

2. **Index**: `ix_menu_items_parent_item_id`
   - Improves query performance for sub-item lookups

3. **Check Constraint**: `ck_multi_item_no_parent`
   - Ensures multi-items cannot have a parent_item_id

4. **Check Constraint**: `ck_sub_item_not_multi`
   - Ensures sub-items cannot be multi-items themselves

## Migration Commands

```bash
# Run migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Usage Examples

### Creating a Multi-Item:
```python
multi_item = MenuItem(
    name="Pizza Sizes",
    description="Choose your pizza size",
    is_multi_item=True,
    category_id=1,
    tenant_id=1
)
```

### Creating Sub-Items:
```python
small_pizza = MenuItem(
    name="Small Pizza",
    price=10.99,
    parent_item_id=multi_item.id,
    sub_item_order=1,
    category_id=1,
    tenant_id=1
)

large_pizza = MenuItem(
    name="Large Pizza",
    price=18.99,
    parent_item_id=multi_item.id,
    sub_item_order=2,
    category_id=1,
    tenant_id=1
)
```

## Important Notes:

1. **No Data Loss**: This migration only adds new columns and doesn't modify existing data
2. **Backward Compatible**: Existing menu items continue to work as before
3. **Price Range**: Multi-items automatically calculate their price range from sub-items
4. **Cascade Delete**: Deleting a multi-item will automatically delete all its sub-items