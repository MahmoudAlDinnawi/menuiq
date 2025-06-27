# Migration Guide - Menu System Update

## Overview
This guide explains how to migrate your database to match the frontend requirements and ensure everything works together seamlessly.

## 1. Database Migration

Run the following SQL script on your production database to add missing columns and update existing data:

```bash
# SSH into your server
ssh root@menuiq.io

# Run the migration script
cd /home/menuiq/backend
sudo -u postgres psql -d menuiq_production -f update_menu_schema.sql
```

This script will:
- Add Arabic fields (`name_ar`, `description_ar`, `label_ar`)
- Add price without VAT field
- Add missing dietary flags (`halal`, `dairy_free`, `nut_free`)
- Add exercise fields (`walk_minutes`, `run_minutes`)
- Add detailed nutrition fields
- Rename columns to match frontend (e.g., `is_vegetarian` → `vegetarian`)
- Add `value`/`label` fields to categories for frontend compatibility

## 2. Deploy Backend Changes

```bash
# Pull latest changes
cd /home/menuiq
git pull

# The new files to deploy:
# - models_final.py (updated models matching new schema)
# - public_menu_routes.py (public API returning frontend format)
# - update_menu_schema.sql (database migration script)

# Restart backend
sudo systemctl restart menuiq
```

## 3. Deploy Frontend Changes

```bash
# Pull latest changes
cd /home/menuiq/frontend
git pull

# New/updated files:
# - publicMenuApi.js (new API service for public menu)
# - Updated RestaurantMenu.js to use new API

# Build frontend
npm run build
```

## 4. Testing

### Test Public Menu Display:
1. Visit any tenant subdomain: `https://tawabel.menuiq.io/menu`
2. Menu should load with all items displaying correctly
3. Categories should work
4. All dietary flags and nutrition info should display

### Test Admin Dashboard:
1. Login to tenant dashboard: `https://tawabel.menuiq.io/login`
2. Categories should have name/description fields
3. Menu items should have all new fields available

## 5. Data Entry

After migration, you'll need to populate the new fields:

### For Categories:
- The migration automatically sets `value` = lowercase name with underscores
- The migration sets `label` = existing name
- You can update `label_ar` for Arabic names

### For Menu Items:
- Add Arabic names and descriptions
- Add nutrition information
- Add exercise minutes (walk/run)
- Set dietary flags correctly

## 6. Clean Up Old Files

Once everything is working, you can remove these old files:
- `models_multitenant.py`
- `models_exact.py`
- `models_simple.py`
- `test_route.py`

## 7. API Endpoints

### Public Menu API (for frontend display):
- `GET /api/public/{subdomain}/menu-items` - Returns items in frontend format
- `GET /api/public/{subdomain}/categories` - Returns categories in frontend format
- `GET /api/public/{subdomain}/settings` - Returns display settings

### Admin API (for dashboard):
- `GET /api/tenant/menu-items` - Manage menu items
- `GET /api/tenant/categories` - Manage categories
- `GET /api/tenant/settings` - Manage settings

## 8. Field Mapping

### Menu Items:
| Database Field | Frontend Field | Type |
|---------------|----------------|------|
| name | name | string |
| name_ar | nameAr | string |
| description | description | string |
| description_ar | descriptionAr | string |
| price | price | "XX.XX SAR" |
| price_without_vat | priceWithoutVat | "XX.XX SAR" |
| image | image | string |
| vegetarian | vegetarian | boolean |
| vegan | vegan | boolean |
| gluten_free | glutenFree | boolean |
| halal | halal | boolean |
| dairy_free | dairyFree | boolean |
| nut_free | nutFree | boolean |
| spicy_level | spicyLevel | integer |
| walk_minutes | walkMinutes | integer |
| run_minutes | runMinutes | integer |

### Categories:
| Database Field | Frontend Field | Type |
|---------------|----------------|------|
| value | value | string |
| label | label | string |
| label_ar | labelAr | string |

## Troubleshooting

If you encounter issues:

1. Check that all migrations ran successfully:
   ```sql
   \d menu_items
   \d categories
   ```

2. Verify new endpoints are working:
   ```bash
   curl https://api.menuiq.io/api/public/tawabel/menu-items
   ```

3. Check logs for errors:
   ```bash
   sudo journalctl -u menuiq -f
   ```

4. Clear browser cache and rebuild frontend if needed