# MenuIQ Troubleshooting Guide

## Current Issues

### 1. Service Starting but Using Wrong Database Type

**Symptom**: Logs show MySQL queries (`DESCRIBE`) instead of PostgreSQL queries
```
Jun 27 14:09:09 ubuntu-4gb-hel1-1 gunicorn[9221]: 2025-06-27 14:09:09,809 INFO sqlalchemy.engine.Engine DESCRIBE `menui>
```

**Possible Causes**:
1. DATABASE_URL is pointing to a MySQL database instead of PostgreSQL
2. Wrong database driver in the connection string

**Solution**:
Check your `/home/menuiq/backend/.env.production` file. It should have:
```
DATABASE_URL=postgresql://menuiq:Mahmoud.10@localhost:5432/menuiq_production
```

NOT:
```
DATABASE_URL=mysql://... (wrong!)
```

### 2. Authentication Token Not Being Sent

**Fixed**: The frontend was storing token as 'token' but systemApi was looking for 'systemToken'

## Verification Steps

1. **Check Database Connection**:
   ```bash
   cd /home/menuiq/backend
   python3 -c "from database import engine; print(engine.url)"
   ```

2. **Test Database Access**:
   ```bash
   sudo -u postgres psql -d menuiq_production -c "SELECT * FROM system_admins;"
   ```

3. **Check Service Status**:
   ```bash
   sudo systemctl status menuiq
   sudo journalctl -u menuiq -n 50
   ```

4. **Test API Endpoints**:
   ```bash
   # Health check
   curl https://api.menuiq.io/api/health
   
   # System admin login
   curl -X POST https://api.menuiq.io/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@menuiq.io","password":"admin123"}'
   ```

## Common Fixes

### Fix 1: Correct Database URL
```bash
cd /home/menuiq/backend
nano .env.production
# Ensure DATABASE_URL starts with postgresql://
sudo systemctl restart menuiq
```

### Fix 2: Initialize Database
```bash
cd /home/menuiq/backend
source venv/bin/activate
python init_database.py
```

### Fix 3: Check CORS Origins
Ensure your `.env.production` has:
```
ALLOWED_ORIGINS=https://menuiq.io,https://*.menuiq.io,https://app.menuiq.io
```

### Fix 4: Clear Frontend Cache
In browser console:
```javascript
localStorage.clear();
location.reload();
```

## Server Configuration Check

1. **Nginx Configuration** (`/etc/nginx/sites-available/menuiq`):
   - Ensure proxy_pass points to http://127.0.0.1:8000
   - Check SSL certificates are valid
   - Verify server_name includes all domains

2. **PostgreSQL Access**:
   ```bash
   sudo -u postgres psql
   \l  # List databases
   \c menuiq_production
   \dt # List tables
   ```

3. **Python Dependencies**:
   ```bash
   cd /home/menuiq/backend
   source venv/bin/activate
   pip install psycopg2-binary  # PostgreSQL driver
   ```

## Emergency Rollback

If nothing works:
1. Stop the service: `sudo systemctl stop menuiq`
2. Restore previous working version from git
3. Restart: `sudo systemctl start menuiq`