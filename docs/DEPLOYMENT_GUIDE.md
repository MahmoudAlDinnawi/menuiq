# MenuIQ Enhanced System Deployment Guide

## Overview
This guide explains how to deploy the enhanced MenuIQ system with rich menu cards, modern dashboard, and all new features.

## What's New in This Version

### 1. Enhanced Menu Items
- **Rich Content Fields**: 70+ fields per menu item including nutrition, sustainability, pairings, etc.
- **Multi-Image Support**: Gallery of images per menu item
- **Video & AR Support**: Video URLs and AR model URLs for immersive experiences
- **Dietary Certifications**: Track halal, kosher, organic certifications
- **Preparation Steps**: Step-by-step preparation with images
- **Customer Reviews**: Built-in review and rating system

### 2. Modern Dashboard
- **Card-Based UI**: Beautiful card preview of menu items
- **Rich Editor**: Comprehensive menu item editor with 6 tabs of options
- **Enhanced Categories**: Icons, colors, and featured categories
- **Analytics Dashboard**: Track popular items and performance
- **Advanced Settings**: Control every aspect of menu display

### 3. Enhanced Public Menu
- **Instagram-Worthy Design**: Beautiful cards with badges and highlights
- **Exercise Equivalents**: Show walking/running time to burn calories
- **Sustainability Info**: Carbon footprint and eco-friendly indicators
- **Pairing Suggestions**: Wine, beer, cocktail recommendations
- **Quick Nutrition View**: Calories and key info at a glance

## Pre-Deployment Steps

### 1. Backup Current Data
```bash
# SSH into server
ssh root@menuiq.io

# Backup current database
sudo -u postgres pg_dump menuiq_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migration Locally
```bash
# Test the migration script on a copy of your database
psql -d menuiq_test -f enhanced_menu_migration.sql
```

## Deployment Steps

### Step 1: Deploy Backend Changes

```bash
# SSH into server
ssh root@menuiq.io

# Navigate to backend directory
cd /home/menuiq/backend

# Pull latest changes
git pull origin main

# Install any new dependencies
pip install -r requirements.txt

# Run database migration
sudo -u postgres psql -d menuiq_production -f enhanced_menu_migration.sql

# Copy the new enhanced files
cp models_enhanced.py models.py
cp enhanced_tenant_routes.py tenant_routes.py
cp main_enhanced.py main.py

# Restart backend service
sudo systemctl restart menuiq
```

### Step 2: Deploy Frontend Changes

```bash
# Navigate to frontend directory
cd /home/menuiq/frontend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build production version
npm run build

# The build will be served automatically by your web server
```

### Step 3: Update Nginx Configuration

If needed, ensure Nginx is configured to serve uploaded images:

```nginx
location /uploads {
    alias /home/menuiq/backend/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Step 4: Create Required Directories

```bash
# Create uploads directory structure
mkdir -p /home/menuiq/backend/uploads
chmod 755 /home/menuiq/backend/uploads

# Set proper ownership
chown -R menuiq:menuiq /home/menuiq/backend/uploads
```

## Post-Deployment Tasks

### 1. Verify Services

```bash
# Check backend health
curl https://api.menuiq.io/health

# Check tenant endpoints
curl https://api.menuiq.io/api/tenant/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test image upload
# Use the dashboard to upload a test image
```

### 2. Update Existing Data

The migration script automatically:
- Adds all new columns with sensible defaults
- Renames columns to match frontend expectations
- Sets default values for dietary flags
- Adds icons and colors to categories

You may want to:
1. Update category icons and colors through the dashboard
2. Add Arabic translations for existing items
3. Upload high-quality images for menu items
4. Add nutritional information for popular items

### 3. Configure New Features

1. **Login as tenant admin**: https://[tenant].menuiq.io/login
2. **Navigate to Settings**: Configure which features to enable
3. **Update Categories**: Add icons and colors
4. **Enhance Menu Items**: Add rich content to existing items

## New API Endpoints

### Enhanced Tenant API
- `GET /api/tenant/dashboard/stats` - Enhanced stats with promotions, ratings
- `GET /api/tenant/menu-items` - Supports advanced filtering
- `POST /api/tenant/menu-items` - Create items with 70+ fields
- `PUT /api/tenant/menu-items/{id}` - Update all enhanced fields
- `POST /api/tenant/menu-items/{id}/images` - Add images to items
- `POST /api/tenant/menu-items/{id}/certifications` - Add certifications
- `POST /api/tenant/menu-items/{id}/preparation-steps` - Add prep steps

### Public Menu API
- `GET /api/public/{subdomain}/menu-items` - Returns enhanced item data
- `GET /api/public/{subdomain}/categories` - Returns styled categories
- `GET /api/public/{subdomain}/settings` - Returns display settings

## Troubleshooting

### Issue: 500 Error on Menu Items
**Solution**: Ensure the migration script has run successfully:
```sql
\d menu_items
-- Should show all new columns
```

### Issue: Images Not Uploading
**Solution**: Check directory permissions:
```bash
ls -la /home/menuiq/backend/uploads
# Should be writable by the app user
```

### Issue: Old Dashboard Still Showing
**Solution**: Clear browser cache and ensure App.js is using ModernDashboard component

### Issue: Categories Missing Icons
**Solution**: Run the update query from migration script:
```sql
UPDATE categories SET icon = '🍴' WHERE icon IS NULL;
```

## Rollback Plan

If issues arise:

1. **Restore database backup**:
```bash
sudo -u postgres psql -d menuiq_production < backup_YYYYMMDD_HHMMSS.sql
```

2. **Revert to previous code**:
```bash
git checkout HEAD~1
npm run build
sudo systemctl restart menuiq
```

## Performance Considerations

1. **Database Indexes**: The migration adds indexes for:
   - Badge text
   - Signature dishes
   - Best seller rank
   - Customer rating
   - Promotion dates

2. **Image Optimization**: Consider using a CDN for images or implementing image optimization

3. **Caching**: Enable caching for public menu endpoints

## Security Notes

1. All new endpoints require authentication
2. File uploads are restricted to image types
3. Tenant isolation is maintained for all new features
4. Input validation for all numeric fields

## Next Steps

1. **Train Staff**: Show restaurant admins the new features
2. **Create Content**: Help restaurants add rich content
3. **Monitor Usage**: Track which features are most popular
4. **Gather Feedback**: Get user input on the new interface

## Support

For issues or questions:
- Check logs: `sudo journalctl -u menuiq -f`
- Review error details in browser console
- Contact support with specific error messages

## Feature Flags

You can enable/disable features per tenant in Settings:
- Reviews & Ratings
- Nutritional Information
- Allergen Information
- Sustainability Info
- AR/Video Preview
- Loyalty Points
- WhatsApp Ordering

This allows gradual rollout and tenant customization.