# PostgreSQL Migration Guide for MenuIQ

## Complete Step-by-Step Migration Process

### Phase 1: Local Testing (Do this first!)

#### 1. Install PostgreSQL locally
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
```

#### 2. Create local database
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE menuiq_dev;
CREATE USER menuiq WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE menuiq_dev TO menuiq;
\q
```

#### 3. Install Python dependencies
```bash
cd backend
pip install psycopg2-binary==2.9.9
```

#### 4. Test locally
```bash
# Use PostgreSQL environment
cp .env.postgres .env

# Initialize database
python init_database_postgres.py

# Run the PostgreSQL version
python main_postgres.py
```

#### 5. Test all features locally
- Login as admin: admin@menuiq.io / admin123
- Create tenants
- Login as tenant: demo@restaurant.com / demo123
- Add menu items
- Upload images

### Phase 2: Production Server Preparation

#### 1. SSH to your Hetzner server
```bash
ssh root@YOUR_SERVER_IP
```

#### 2. Install PostgreSQL
```bash
# Update system
apt update && apt upgrade -y

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

#### 3. Create production database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE menuiq_production;
CREATE USER menuiq WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE menuiq_production TO menuiq;
\q
```

#### 4. Configure PostgreSQL for better performance
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add/modify these settings:
```conf
# Connection settings
max_connections = 200

# Memory settings (for 4GB RAM server)
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 4MB
maintenance_work_mem = 256MB

# Write performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Phase 3: Deploy New Code

#### 1. Backup current system (just in case)
```bash
cd /root/menuiq
cp -r backend backend_mysql_backup
```

#### 2. Upload new files
```bash
# On your local machine
scp backend/main_postgres.py root@YOUR_SERVER_IP:/root/menuiq/backend/
scp backend/database_postgres.py root@YOUR_SERVER_IP:/root/menuiq/backend/
scp backend/init_database_postgres.py root@YOUR_SERVER_IP:/root/menuiq/backend/
scp backend/.env.production.postgres root@YOUR_SERVER_IP:/root/menuiq/backend/
scp backend/requirements.txt root@YOUR_SERVER_IP:/root/menuiq/backend/
```

#### 3. Update production environment on server
```bash
cd /root/menuiq/backend

# Install new dependencies
source venv/bin/activate
pip install psycopg2-binary==2.9.9

# Update production environment file
nano .env.production.postgres
```

Update with your actual values:
```env
DATABASE_URL=postgresql://menuiq:YOUR_SECURE_PASSWORD@localhost:5432/menuiq_production
SECRET_KEY=YOUR_EXISTING_SECRET_KEY
ENVIRONMENT=production
ALLOWED_ORIGINS=https://menuiq.io,https://*.menuiq.io
```

#### 4. Initialize PostgreSQL database
```bash
# Make sure you're in the virtual environment
source venv/bin/activate

# Run initialization
python init_database_postgres.py
```

### Phase 4: Switch to PostgreSQL

#### 1. Stop current MySQL service
```bash
sudo systemctl stop menuiq
```

#### 2. Update systemd service
```bash
sudo nano /etc/systemd/system/menuiq.service
```

Change the ExecStart line to use `main_postgres:app`:
```ini
ExecStart=/root/menuiq/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main_postgres:app --bind 127.0.0.1:8000
```

Also update the EnvironmentFile:
```ini
EnvironmentFile=/root/menuiq/backend/.env.production.postgres
```

#### 3. Reload and start service
```bash
sudo systemctl daemon-reload
sudo systemctl start menuiq
sudo systemctl status menuiq
```

#### 4. Test the API
```bash
# Check health endpoint
curl https://api.menuiq.io/api/health

# Should return:
# {"status":"healthy","database":"connected","version":"1.0.0"}
```

### Phase 5: Verify Everything Works

1. **Test System Admin**
   - Go to https://app.menuiq.io/admin/login
   - Login with: admin@menuiq.io / admin123
   - Create a new tenant

2. **Test Tenant Access**
   - Go to https://demo.menuiq.io/menu
   - Should see public menu without login
   - Go to https://demo.menuiq.io/login
   - Login with: demo@restaurant.com / demo123
   - Test all features

3. **Monitor logs**
   ```bash
   sudo journalctl -u menuiq -f
   ```

### Phase 6: Post-Migration Tasks

#### 1. Change default passwords immediately!
```bash
cd /root/menuiq/backend
source venv/bin/activate
python
```

```python
import bcrypt
# Generate new password hash
new_password = "your_new_secure_password"
hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(hashed)
```

Update in database:
```bash
sudo -u postgres psql menuiq_production

-- Update system admin password
UPDATE system_admins SET hashed_password = 'YOUR_NEW_HASH' WHERE email = 'admin@menuiq.io';

-- Update demo user password  
UPDATE users SET hashed_password = 'YOUR_NEW_HASH' WHERE email = 'demo@restaurant.com';
```

#### 2. Setup automated PostgreSQL backups
```bash
sudo nano /home/menuiq/backup_postgres.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/menuiq/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U menuiq menuiq_production | gzip > $BACKUP_DIR/db_postgres_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_postgres_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /home/menuiq/backup_postgres.sh
crontab -e
# Add: 0 2 * * * /home/menuiq/backup_postgres.sh
```

#### 3. Update monitoring
- Update your monitoring tools to check PostgreSQL
- Set up alerts for database connection issues

### Rollback Plan (If needed)

If something goes wrong, you can rollback to MySQL:

```bash
# Stop PostgreSQL service
sudo systemctl stop menuiq

# Restore MySQL service
sudo nano /etc/systemd/system/menuiq.service
# Change back to main_mysql:app and .env.production

# Restart
sudo systemctl daemon-reload
sudo systemctl start menuiq
```

### Benefits You'll Notice

1. **Better Performance**: PostgreSQL handles complex queries better
2. **Better Concurrency**: No table locks like MySQL
3. **Better JSON Support**: Native JSON operations
4. **Better Full-Text Search**: Built-in powerful search
5. **Better Data Integrity**: Stronger constraints

### Important Notes

- PostgreSQL uses different syntax for some operations
- Default port is 5432 (not 3306 like MySQL)
- PostgreSQL is case-sensitive for string comparisons by default
- Use `ILIKE` instead of `LIKE` for case-insensitive searches

### Need Help?

If you encounter issues:
1. Check logs: `sudo journalctl -u menuiq -n 100`
2. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
3. Verify connection: `sudo -u postgres psql -c "SELECT 1"`