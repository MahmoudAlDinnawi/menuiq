# Production .env File Update

## Add these lines to your production .env file:

```env
# Add this line for CORS to work with all subdomains
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://menuiq.io,https://app.menuiq.io,https://*.menuiq.io

# Make sure these are also set
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
FRONTEND_URL=https://app.menuiq.io
```

## Complete production .env should look like:

```env
# Database
DATABASE_URL=postgresql://postgres:Mahmoud.10@localhost/menuiq

# JWT Settings
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "https://your-app.vercel.app"]
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://menuiq.io,https://app.menuiq.io,https://*.menuiq.io

# Frontend URL
FRONTEND_URL=https://app.menuiq.io

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Environment
ENVIRONMENT=production
```

## Steps to apply on production server:

1. **SSH to your production server**

2. **Navigate to backend directory:**
   ```bash
   cd /path/to/menuiq/backend
   ```

3. **Edit the .env file:**
   ```bash
   nano .env
   ```

4. **Add the ALLOWED_ORIGINS line:**
   ```
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://menuiq.io,https://app.menuiq.io,https://*.menuiq.io
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Pull the latest code:**
   ```bash
   git pull
   ```

7. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

8. **Restart the service:**
   ```bash
   sudo systemctl restart menuiq
   ```

9. **Check the service status:**
   ```bash
   sudo systemctl status menuiq
   ```

## What this fixes:

- ✅ Allows CORS requests from `https://entrecote.menuiq.io`
- ✅ Allows CORS requests from any `*.menuiq.io` subdomain
- ✅ Maintains support for localhost development
- ✅ Fixes the analytics tracking CORS error

## Note:
The main.py file has been updated to use regex pattern matching for CORS, which will automatically allow all menuiq.io subdomains without having to list each one individually.