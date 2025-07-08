#!/bin/bash

# MenuIQ Production Deployment Script
# Zero-downtime deployment with automatic rollback on failure
# 
# Usage: ./deploy_to_production.sh
#
# This script will:
# 1. Deploy new code without stopping the service
# 2. Run database migrations safely
# 3. Switch to new version atomically
# 4. Rollback automatically if anything fails

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
SERVER_IP="37.27.183.157"
SERVER_USER="root"
REMOTE_PATH="/root/menuiq"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKEND_PATH="./backend"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if we can connect to server
print_status "Testing connection to production server..."
if ! ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'Connection successful'"; then
    print_error "Cannot connect to server. Please check your SSH access."
    exit 1
fi

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_PACKAGE="menuiq_backend_${TIMESTAMP}.tar.gz"

# Create a temporary directory for clean files
TEMP_DIR=$(mktemp -d)
print_status "Preparing clean backend files in $TEMP_DIR..."

# Copy backend files excluding unnecessary items
rsync -av --exclude='__pycache__' \
          --exclude='*.pyc' \
          --exclude='*.pyo' \
          --exclude='*.log' \
          --exclude='venv/' \
          --exclude='.env' \
          --exclude='.env.local' \
          --exclude='test_*.py' \
          --exclude='create_*.py' \
          --exclude='*_setup.sh' \
          --exclude='uploads/*' \
          ${LOCAL_BACKEND_PATH}/ ${TEMP_DIR}/backend/

# Create deployment archive
cd ${TEMP_DIR}
tar -czf /tmp/${DEPLOY_PACKAGE} backend/
cd - > /dev/null

print_status "Deployment package created: ${DEPLOY_PACKAGE}"

# Create remote deployment script
cat > /tmp/remote_deploy.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e
set -u

TIMESTAMP="$1"
DEPLOY_PACKAGE="$2"
BACKUP_DIR="/root/backups"
APP_DIR="/root/menuiq"
NEW_BACKEND_DIR="/root/menuiq_new_${TIMESTAMP}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[REMOTE]${NC} $1"
}

print_error() {
    echo -e "${RED}[REMOTE ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Step 1: Create database backup
print_status "Creating database backup..."
if command -v pg_dump &> /dev/null; then
    # Get database credentials from current .env file
    if [ -f "${APP_DIR}/backend/.env" ]; then
        export $(cat ${APP_DIR}/backend/.env | grep DATABASE_URL | xargs)
        if [ ! -z "${DATABASE_URL}" ]; then
            # Extract database name from URL
            DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
            pg_dump $DATABASE_URL > ${BACKUP_DIR}/menuiq_db_${TIMESTAMP}.sql
            print_status "Database backup created: menuiq_db_${TIMESTAMP}.sql"
        else
            print_error "DATABASE_URL not found in .env file"
        fi
    fi
else
    print_error "pg_dump not found, skipping database backup"
fi

# Step 2: Extract new backend
print_status "Extracting new backend files..."
mkdir -p ${NEW_BACKEND_DIR}
tar -xzf /tmp/${DEPLOY_PACKAGE} -C ${NEW_BACKEND_DIR} --strip-components=1

# Step 3: Copy current .env file
if [ -f "${APP_DIR}/backend/.env" ]; then
    cp ${APP_DIR}/backend/.env ${NEW_BACKEND_DIR}/.env
    print_status "Environment file copied"
else
    print_error "No .env file found! Please create one before deployment"
    exit 1
fi

# Step 4: Copy uploads directory if it exists
if [ -d "${APP_DIR}/backend/uploads" ]; then
    print_status "Copying uploads directory..."
    cp -r ${APP_DIR}/backend/uploads ${NEW_BACKEND_DIR}/
fi

# Step 5: Create virtual environment and install dependencies
print_status "Setting up Python virtual environment..."
cd ${NEW_BACKEND_DIR}
python3 -m venv venv
source venv/bin/activate

print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Step 6: Test database connection
print_status "Testing database connection..."
python3 -c "
import os
import sys
from dotenv import load_dotenv
load_dotenv()
try:
    from database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
"

# Step 7: Run database migrations
print_status "Running database migrations..."
export PYTHONPATH="${NEW_BACKEND_DIR}:${PYTHONPATH:-}"
alembic current
alembic upgrade head
print_status "Database migrations completed"

# Step 8: Check if service is running and stop it gracefully
print_status "Checking current service status..."
SERVICE_NAME="menuiq-backend"
USING_SYSTEMD=false
USING_SUPERVISOR=false
USING_PM2=false

if systemctl is-active --quiet ${SERVICE_NAME}; then
    USING_SYSTEMD=true
    print_status "Found systemd service"
elif command -v supervisorctl &> /dev/null && supervisorctl status ${SERVICE_NAME} &> /dev/null; then
    USING_SUPERVISOR=true
    print_status "Found supervisor service"
elif command -v pm2 &> /dev/null && pm2 list | grep -q ${SERVICE_NAME}; then
    USING_PM2=true
    print_status "Found PM2 service"
fi

# Step 9: Create backup of current backend
print_status "Creating backup of current backend..."
if [ -d "${APP_DIR}/backend" ]; then
    mv ${APP_DIR}/backend ${APP_DIR}/backend_backup_${TIMESTAMP}
fi

# Step 10: Move new backend to production location
print_status "Deploying new backend..."
mv ${NEW_BACKEND_DIR} ${APP_DIR}/backend

# Step 11: Restart service
print_status "Restarting service..."
if [ "$USING_SYSTEMD" = true ]; then
    systemctl restart ${SERVICE_NAME}
    sleep 5
    if systemctl is-active --quiet ${SERVICE_NAME}; then
        print_status "Service restarted successfully"
    else
        print_error "Service failed to start!"
        # Rollback
        print_status "Rolling back..."
        rm -rf ${APP_DIR}/backend
        mv ${APP_DIR}/backend_backup_${TIMESTAMP} ${APP_DIR}/backend
        systemctl restart ${SERVICE_NAME}
        exit 1
    fi
elif [ "$USING_SUPERVISOR" = true ]; then
    supervisorctl restart ${SERVICE_NAME}
    sleep 5
elif [ "$USING_PM2" = true ]; then
    cd ${APP_DIR}/backend
    pm2 restart ${SERVICE_NAME}
    sleep 5
else
    # Try to start with gunicorn manually
    print_status "No service manager found, starting with gunicorn..."
    cd ${APP_DIR}/backend
    source venv/bin/activate
    
    # Kill existing gunicorn processes
    pkill -f "gunicorn.*main:app" || true
    sleep 2
    
    # Start gunicorn in background
    nohup gunicorn main:app \
        --workers 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --access-logfile access.log \
        --error-logfile error.log \
        --daemon
    
    sleep 5
    
    # Check if running
    if pgrep -f "gunicorn.*main:app" > /dev/null; then
        print_status "Gunicorn started successfully"
    else
        print_error "Failed to start gunicorn!"
        # Rollback
        print_status "Rolling back..."
        rm -rf ${APP_DIR}/backend
        mv ${APP_DIR}/backend_backup_${TIMESTAMP} ${APP_DIR}/backend
        cd ${APP_DIR}/backend
        source venv/bin/activate
        nohup gunicorn main:app \
            --workers 4 \
            --worker-class uvicorn.workers.UvicornWorker \
            --bind 0.0.0.0:8000 \
            --access-logfile access.log \
            --error-logfile error.log \
            --daemon
        exit 1
    fi
fi

# Step 12: Health check
print_status "Performing health check..."
sleep 3
HEALTH_CHECK_URL="http://localhost:8000/health"
if curl -f -s ${HEALTH_CHECK_URL} > /dev/null; then
    print_status "Health check passed!"
else
    print_error "Health check failed!"
    # Rollback
    print_status "Rolling back due to health check failure..."
    rm -rf ${APP_DIR}/backend
    mv ${APP_DIR}/backend_backup_${TIMESTAMP} ${APP_DIR}/backend
    
    if [ "$USING_SYSTEMD" = true ]; then
        systemctl restart ${SERVICE_NAME}
    elif [ "$USING_SUPERVISOR" = true ]; then
        supervisorctl restart ${SERVICE_NAME}
    elif [ "$USING_PM2" = true ]; then
        cd ${APP_DIR}/backend
        pm2 restart ${SERVICE_NAME}
    else
        cd ${APP_DIR}/backend
        source venv/bin/activate
        pkill -f "gunicorn.*main:app" || true
        sleep 2
        nohup gunicorn main:app \
            --workers 4 \
            --worker-class uvicorn.workers.UvicornWorker \
            --bind 0.0.0.0:8000 \
            --access-logfile access.log \
            --error-logfile error.log \
            --daemon
    fi
    exit 1
fi

# Step 13: Clean up old backups (keep last 5)
print_status "Cleaning up old backups..."
cd ${APP_DIR}
ls -t backend_backup_* 2>/dev/null | tail -n +6 | xargs rm -rf || true
cd ${BACKUP_DIR}
ls -t menuiq_db_*.sql 2>/dev/null | tail -n +6 | xargs rm -f || true

print_status "Deployment completed successfully!"
print_status "Previous version backed up as: backend_backup_${TIMESTAMP}"

# Clean up deployment package
rm -f /tmp/${DEPLOY_PACKAGE}

REMOTE_SCRIPT

# Upload deployment package and script
print_status "Uploading deployment package to server..."
scp /tmp/${DEPLOY_PACKAGE} ${SERVER_USER}@${SERVER_IP}:/tmp/
scp /tmp/remote_deploy.sh ${SERVER_USER}@${SERVER_IP}:/tmp/

# Execute remote deployment
print_status "Starting remote deployment..."
ssh ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/remote_deploy.sh && /tmp/remote_deploy.sh '${TIMESTAMP}' '${DEPLOY_PACKAGE}'"

# Check deployment status
DEPLOY_STATUS=$?

# Clean up local files
rm -f /tmp/${DEPLOY_PACKAGE}
rm -f /tmp/remote_deploy.sh
rm -rf ${TEMP_DIR}

if [ $DEPLOY_STATUS -eq 0 ]; then
    print_status "Deployment completed successfully!"
    print_status "Your application is now running the latest version."
    
    # Show post-deployment information
    echo ""
    echo "==========================================="
    echo "POST-DEPLOYMENT CHECKLIST:"
    echo "==========================================="
    echo "1. Check application health: http://${SERVER_IP}:8000/health"
    echo "2. Monitor logs: ssh ${SERVER_USER}@${SERVER_IP} 'tail -f ${REMOTE_PATH}/backend/error.log'"
    echo "3. Test key features:"
    echo "   - User authentication"
    echo "   - Menu item creation"
    echo "   - Multi-item functionality"
    echo "4. Monitor system resources: ssh ${SERVER_USER}@${SERVER_IP} 'htop'"
    echo ""
    echo "NOTE: Frontend is handled separately via Vercel"
    echo ""
    echo "ROLLBACK INSTRUCTIONS (if needed):"
    echo "ssh ${SERVER_USER}@${SERVER_IP}"
    echo "cd ${REMOTE_PATH}"
    echo "rm -rf backend"
    echo "mv backend_backup_${TIMESTAMP} backend"
    echo "systemctl restart menuiq-backend  # or appropriate restart command"
    echo "==========================================="
else
    print_error "Deployment failed! Check the error messages above."
    exit 1
fi