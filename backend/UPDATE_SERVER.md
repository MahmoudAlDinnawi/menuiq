# Server Update Instructions

## Update Your Production Server

### 1. Upload Updated Files

```bash
# From your local machine
cd /Users/mahmouddinnawi/MenuSystem/backend

# Upload the cleaned files
scp main.py database.py init_database.py pydantic_models.py requirements.txt README.md root@YOUR_SERVER_IP:/root/menuiq/backend/
```

### 2. Update systemd Service

On your server:

```bash
sudo nano /etc/systemd/system/menuiq.service
```

Change from:
```ini
ExecStart=/root/menuiq/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main_postgres:app --bind 127.0.0.1:8000
EnvironmentFile=/root/menuiq/backend/.env.production.postgres
```

To:
```ini
ExecStart=/root/menuiq/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
EnvironmentFile=/root/menuiq/backend/.env.production
```

### 3. Create Production Environment File

```bash
cd /root/menuiq/backend
cp .env.production.postgres .env.production
```

### 4. Clean Up Old Files

```bash
# Create backup directory
mkdir -p old_mysql_files

# Move old files
mv main_mysql.py old_mysql_files/ 2>/dev/null
mv main_postgres.py old_mysql_files/ 2>/dev/null
mv database_postgres.py old_mysql_files/ 2>/dev/null
mv init_database_postgres.py old_mysql_files/ 2>/dev/null
mv migrate_to_multitenant.py old_mysql_files/ 2>/dev/null
mv add_*.py old_mysql_files/ 2>/dev/null
mv fix_*.py old_mysql_files/ 2>/dev/null
mv check_postgres.py old_mysql_files/ 2>/dev/null
mv create_tables_postgres.py old_mysql_files/ 2>/dev/null
mv init_postgres_simple.py old_mysql_files/ 2>/dev/null

# Remove PostgreSQL-specific env files
rm -f .env.postgres .env.production.postgres
```

### 5. Restart Service

```bash
sudo systemctl daemon-reload
sudo systemctl restart menuiq
sudo systemctl status menuiq
```

### 6. Verify Everything Works

```bash
# Check API health
curl https://api.menuiq.io/api/health

# Check logs
sudo journalctl -u menuiq -f
```

### 7. Update Backup Script

Update any backup scripts that reference the old file names.

## Your Clean Structure

```
/root/menuiq/backend/
├── main.py                 # Main FastAPI app (PostgreSQL)
├── database.py            # PostgreSQL configuration
├── models_multitenant.py  # Database models
├── pydantic_models.py     # API models
├── auth.py                # Authentication
├── public_routes.py       # Public API routes
├── system_admin_routes.py # Admin routes
├── tenant_auth_routes.py  # Tenant auth routes
├── tenant_middleware.py   # Middleware
├── init_database.py       # DB initialization
├── requirements.txt       # Dependencies
├── .env.production        # Production config
└── uploads/               # File uploads
```

## Important Notes

- All MySQL code has been removed
- PostgreSQL is now the only database
- The main application file is now `main.py` (not `main_postgres.py`)
- Environment files are `.env` and `.env.production` (no more `.postgres` suffix)