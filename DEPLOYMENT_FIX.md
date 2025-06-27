# Deployment Fix Summary

## Issues Fixed

### 1. **403 Forbidden Error on POST /api/admin/tenants**
- **Problem**: The authentication token was not being sent with requests
- **Root Cause**: Mismatch between token storage names
  - AuthContext was storing token as 'token'
  - systemApi was looking for 'systemToken'
- **Fix**: Updated AuthContext to store token under both names for compatibility

### 2. **Backend Response Format**
- **Problem**: Frontend expected 'admin' in response but backend was sending 'user'
- **Fix**: Updated system_admin_routes.py to return 'admin' instead of 'user' in login response

### 3. **Router Conflicts**
- **Problem**: Duplicate route definitions in main.py and system_admin_routes.py
- **Fix**: 
  - Removed duplicate routes from main.py
  - Added router imports and included them in the app
  - Fixed router prefix from '/api/system' to '/api/admin'

### 4. **Tenant Login**
- **Problem**: Frontend was calling wrong endpoint for tenant login
- **Fix**: Updated AuthContext to use '/api/auth/tenant/login' endpoint

## Files Changed

### Backend:
1. `main.py` - Added router imports and removed duplicate routes
2. `auth.py` - Fixed authentication dependencies
3. `system_admin_routes.py` - Fixed prefix and response format

### Frontend:
1. `contexts/AuthContext.js` - Fixed token storage and tenant login endpoint

## Deployment Steps

1. Pull all changes to your server
2. Restart the backend service:
   ```bash
   sudo systemctl restart menuiq
   ```

3. Clear browser cache and localStorage if you still have issues

## Testing Steps

1. **System Admin Login**:
   - Go to https://app.menuiq.io
   - Login with: admin@menuiq.io / admin123

2. **Create Tenant**:
   - After login, create a new tenant
   - Note the subdomain and admin credentials

3. **Tenant Login**:
   - Go to https://[subdomain].menuiq.io/login
   - Login with tenant admin credentials

## Important Notes

- Make sure your database has the system admin user (created by init_database.py)
- Ensure CORS is properly configured for your domains
- Check that nginx is properly routing requests to the backend