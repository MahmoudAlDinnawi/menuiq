# Tenant Login Fix

## Issue
Tenant login appears successful but redirects/reloads without actually logging in the user.

## Root Causes
1. The login might be successful but the redirect is causing a full page reload
2. CORS issues might be preventing the API call from completing
3. The tenant subdomain might not be properly configured in nginx

## Debugging Steps

1. **Check Browser Console** (on entrecote.menuiq.io/login):
   - Open Developer Tools (F12)
   - Check Console for errors
   - Check Network tab to see if the login API call is successful

2. **Check API Response**:
   ```bash
   curl -X POST https://api.menuiq.io/api/auth/tenant/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "your-password",
       "tenant_subdomain": "entrecote"
     }'
   ```

3. **Check Nginx Configuration** for the subdomain:
   ```bash
   sudo nano /etc/nginx/sites-available/menuiq
   ```
   Ensure it includes:
   ```nginx
   server_name menuiq.io *.menuiq.io app.menuiq.io;
   ```

## Quick Fix

Update the tenant login function to avoid hard page reload:

**In frontend/src/contexts/AuthContext.js**, change:
```javascript
// FROM:
window.location.href = `https://${subdomain}.menuiq.io/dashboard`;

// TO:
window.location.replace(`https://${subdomain}.menuiq.io/dashboard`);
```

But better yet, if already on the subdomain, just navigate:
```javascript
const tenantLogin = async (email, password, subdomain) => {
  try {
    const response = await api.post('/api/auth/tenant/login', { 
      email, 
      password,
      tenant_subdomain: subdomain
    });
    
    const { access_token, user } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify({ ...user, type: 'tenant_user' }));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser({ ...user, type: 'tenant_user' });
    setIsSystemAdmin(false);
    
    // Check if we're already on the correct subdomain
    const currentHost = window.location.hostname;
    const currentSubdomain = currentHost.split('.')[0];
    
    if (currentSubdomain === subdomain) {
      // Already on correct subdomain, just navigate
      navigate('/dashboard');
    } else if (currentHost === 'menuiq.io' || currentHost === 'www.menuiq.io') {
      // On main domain, redirect to subdomain
      window.location.href = `https://${subdomain}.menuiq.io/dashboard`;
    } else {
      // Default navigation
      navigate('/dashboard');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Login failed' 
    };
  }
};
```

## Alternative Solutions

### 1. Check CORS Configuration
Ensure your backend allows the subdomain:
```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://menuiq.io", "https://app.menuiq.io", "https://entrecote.menuiq.io"],
    allow_origin_regex="https://.*\.menuiq\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Add Debug Logging
Add console logs to debug:
```javascript
const tenantLogin = async (email, password, subdomain) => {
  console.log('Attempting login for:', email, 'on subdomain:', subdomain);
  try {
    const response = await api.post('/api/auth/tenant/login', { 
      email, 
      password,
      tenant_subdomain: subdomain
    });
    console.log('Login response:', response.data);
    // ... rest of the code
```

### 3. Check SSL Certificate
Ensure the wildcard SSL certificate covers *.menuiq.io:
```bash
sudo certbot certificates
```

## Server-Side Verification

1. **Check if tenant exists**:
   ```sql
   sudo -u postgres psql -d menuiq_production
   SELECT * FROM tenants WHERE subdomain = 'entrecote';
   SELECT * FROM users WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'entrecote');
   ```

2. **Check API logs**:
   ```bash
   sudo journalctl -u menuiq -f
   # Try to login and watch the logs
   ```

3. **Test the API directly**:
   ```bash
   # Get the token
   TOKEN=$(curl -s -X POST https://api.menuiq.io/api/auth/tenant/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email","password":"your-password","tenant_subdomain":"entrecote"}' \
     | jq -r '.access_token')
   
   # Test authenticated endpoint
   curl -H "Authorization: Bearer $TOKEN" https://api.menuiq.io/api/auth/me
   ```