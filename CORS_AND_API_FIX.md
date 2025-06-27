# CORS and API Fix for Tenant Dashboard

## Issues Fixed

### 1. CORS Configuration
- **Problem**: Requests from tenant subdomains (e.g., tawabel.menuiq.io) were being blocked
- **Fix**: Updated CORS middleware to use proper regex pattern for wildcard subdomains
- **New pattern**: `r"https://[a-zA-Z0-9-]+\.menuiq\.io"` allows any subdomain

### 2. Error Handling
- **Problem**: 500 errors without details made debugging difficult
- **Fix**: Added comprehensive error handling to all endpoints
- **Now**: Errors are logged and returned with helpful messages

### 3. Tenant Status Check
- **Problem**: Code was checking for non-existent `is_active` field
- **Fix**: Changed to check `status` field which actually exists

## Deployment Steps

1. **Pull the latest changes**:
   ```bash
   cd /home/menuiq
   git pull
   ```

2. **Restart the backend service**:
   ```bash
   sudo systemctl restart menuiq
   ```

3. **Check the logs for any errors**:
   ```bash
   sudo journalctl -u menuiq -f
   ```

## Testing the Fix

1. **Clear browser cache** (Important!)
   - Open browser developer tools
   - Right-click refresh button → "Empty Cache and Hard Reload"

2. **Test API directly**:
   ```bash
   # Test categories endpoint
   curl -H "Origin: https://tawabel.menuiq.io" \
        https://api.menuiq.io/api/tawabel/categories

   # Test menu items endpoint  
   curl -H "Origin: https://tawabel.menuiq.io" \
        https://api.menuiq.io/api/tawabel/menu-items
   ```

3. **Check browser console** for any remaining errors

## What Should Work Now

- ✅ Loading categories
- ✅ Loading menu items
- ✅ Creating new categories
- ✅ Creating new menu items
- ✅ All CRUD operations in the dashboard

## If Still Having Issues

1. **Check nginx configuration**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Ensure the tenant exists**:
   ```bash
   sudo -u postgres psql -d menuiq_production
   SELECT * FROM tenants WHERE subdomain = 'tawabel';
   ```

3. **Check for any startup errors**:
   ```bash
   sudo journalctl -u menuiq -n 100
   ```

## Additional Notes

- The CORS configuration now allows ALL subdomains of menuiq.io
- Error messages will now show in the server logs for easier debugging
- The API will return more descriptive error messages