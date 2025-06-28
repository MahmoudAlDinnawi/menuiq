# Files to Remove After Deployment

## Backend Files to Remove

### Old Model Files
- `/backend/models_multitenant.py` - Replaced by models_enhanced.py
- `/backend/models_exact.py` - Replaced by models_enhanced.py
- `/backend/models_simple.py` - Replaced by models_enhanced.py
- `/backend/models_final.py` - Replaced by models_enhanced.py

### Old Route Files
- `/backend/tenant_routes.py` - Replaced by enhanced_tenant_routes.py
- `/backend/tenant_routes_v2.py` - Replaced by enhanced_tenant_routes.py
- `/backend/test_route.py` - Test file, no longer needed

### Utility Scripts
- `/backend/check_actual_schema.py` - One-time use script
- `/backend/inspect_schema.py` - One-time use script
- `/backend/show_tables.py` - Utility script
- `/backend/verify_db_state.py` - Utility script

### Migration Scripts (after successful migration)
- `/backend/update_menu_schema.sql` - Keep for reference but not in production
- `/backend/fix_menu_items.sql` - Already applied

## Frontend Files to Remove

### Old Dashboard Components
- `/frontend/src/components/Dashboard.js` - Replaced by ModernDashboard
- `/frontend/src/components/DashboardV2.js` - Replaced by ModernDashboard
- `/frontend/src/components/CategoryManagerV2.js` - Replaced by EnhancedCategoryManager
- `/frontend/src/components/MenuItemManagerV2.js` - Replaced by MenuCardEditor
- `/frontend/src/components/SettingsManagerV2.js` - Replaced by SettingsPanel

### Old Page Components
- `/frontend/src/pages/Dashboard.js` - Using ModernDashboard directly
- `/frontend/src/pages/DashboardV2.js` - Using ModernDashboard directly

### Old Service Files
- `/frontend/src/services/tenantApi.js` - If using tenantApiV2

## Root Level Files to Clean

### Documentation (Move to docs folder)
- `FINAL_CHANGES_SUMMARY.md` - Move to /docs
- `MIGRATION_GUIDE.md` - Move to /docs
- `CLEANUP_LIST.md` - This file, remove after cleanup

## Cleanup Commands

```bash
# Backend cleanup
cd backend
rm models_multitenant.py models_exact.py models_simple.py models_final.py
rm tenant_routes.py tenant_routes_v2.py test_route.py
rm check_actual_schema.py inspect_schema.py show_tables.py verify_db_state.py

# Move migration scripts to migrations folder
mkdir -p migrations
mv *.sql migrations/

# Frontend cleanup
cd ../frontend/src
rm components/Dashboard.js components/DashboardV2.js
rm components/CategoryManagerV2.js components/MenuItemManagerV2.js
rm components/SettingsManagerV2.js
rm pages/Dashboard.js pages/DashboardV2.js

# Move docs
cd ../..
mkdir -p docs
mv FINAL_CHANGES_SUMMARY.md MIGRATION_GUIDE.md DEPLOYMENT_GUIDE.md docs/
```

## Files to Keep

### Backend
- `models_enhanced.py` (rename to models.py after deployment)
- `enhanced_tenant_routes.py` (rename to tenant_routes.py after deployment)
- `main_enhanced.py` (rename to main.py after deployment)
- `database.py`
- `auth.py`
- `system_admin_routes.py`
- `tenant_auth_routes.py`
- `public_menu_routes.py`
- `pydantic_models.py`
- `create_tenant_user.py` (utility)

### Frontend
- All components in ModernDashboard ecosystem:
  - `ModernDashboard.js`
  - `MenuCardEditor.js`
  - `MenuCardPreview.js`
  - `EnhancedCategoryManager.js`
  - `SettingsPanel.js`
  - `Analytics.js`
- All existing menu display components
- All auth and context components

## Important Notes

1. **Before removing files**:
   - Ensure the enhanced system is working properly
   - Take a full backup of the codebase
   - Test all functionality

2. **After cleanup**:
   - Update imports in any files that reference removed modules
   - Run tests to ensure nothing is broken
   - Commit changes with clear message

3. **Rename strategy**:
   ```bash
   # After confirming enhanced files work
   cd backend
   mv models_enhanced.py models.py
   mv enhanced_tenant_routes.py tenant_routes.py
   mv main_enhanced.py main.py
   ```

This cleanup will significantly reduce code duplication and confusion in the codebase.