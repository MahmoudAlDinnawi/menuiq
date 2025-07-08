#!/bin/bash

# Server Setup Script for MenuIQ Backend
# Run this on the server after first deployment to set up the service

set -e

# This script should be run on the server as root

echo "=========================================="
echo "MenuIQ Server Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install system dependencies if not present
echo "Installing system dependencies..."
apt-get update
apt-get install -y python3-pip python3-venv postgresql-client nginx certbot python3-certbot-nginx

# Create systemd service
echo "Setting up systemd service..."
cp /root/menuiq/menuiq-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable menuiq-backend
echo "Systemd service installed"

# Set up Nginx reverse proxy
echo "Setting up Nginx..."
cat > /etc/nginx/sites-available/menuiq-backend << 'NGINX_CONFIG'
server {
    listen 80;
    server_name api.menuiq.io;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /uploads {
        alias /root/menuiq/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

# Enable the site
ln -sf /etc/nginx/sites-available/menuiq-backend /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "Nginx configured"

# Set up log rotation
echo "Setting up log rotation..."
cat > /etc/logrotate.d/menuiq << 'LOGROTATE_CONFIG'
/root/menuiq/backend/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload menuiq-backend > /dev/null 2>&1 || true
    endscript
}
LOGROTATE_CONFIG

echo "Log rotation configured"

# Create backup script
echo "Creating backup script..."
cat > /root/menuiq/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
# Daily backup script for MenuIQ

BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/root/menuiq"

# Create backup directory
mkdir -p ${BACKUP_DIR}/daily

# Load environment variables
source ${APP_DIR}/backend/.env

# Backup database
if [ ! -z "${DATABASE_URL}" ]; then
    echo "Backing up database..."
    pg_dump ${DATABASE_URL} | gzip > ${BACKUP_DIR}/daily/menuiq_db_${TIMESTAMP}.sql.gz
fi

# Backup uploads
if [ -d "${APP_DIR}/backend/uploads" ]; then
    echo "Backing up uploads..."
    tar -czf ${BACKUP_DIR}/daily/uploads_${TIMESTAMP}.tar.gz -C ${APP_DIR}/backend uploads
fi

# Keep only last 7 daily backups
find ${BACKUP_DIR}/daily -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${TIMESTAMP}"
BACKUP_SCRIPT

chmod +x /root/menuiq/backup.sh

# Add to crontab
echo "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /root/menuiq/backup.sh >> /root/menuiq/backup.log 2>&1") | crontab -

# Set up monitoring
echo "Setting up basic monitoring..."
cat > /root/menuiq/health_check.sh << 'HEALTH_SCRIPT'
#!/bin/bash
# Health check script

HEALTH_URL="http://localhost:8000/health"
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s $HEALTH_URL > /dev/null; then
        exit 0
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 5
done

# Health check failed, restart service
echo "Health check failed at $(date), restarting service..." >> /root/menuiq/health_check.log
systemctl restart menuiq-backend
HEALTH_SCRIPT

chmod +x /root/menuiq/health_check.sh

# Add health check to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/menuiq/health_check.sh") | crontab -

# Create directories
mkdir -p /root/menuiq/backend/uploads/logos
mkdir -p /root/menuiq/backend/uploads/items
mkdir -p /root/backups/daily

# Set permissions
chown -R root:root /root/menuiq
chmod -R 755 /root/menuiq/backend/uploads

# Final instructions
echo ""
echo "=========================================="
echo "Setup completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the service:"
echo "   systemctl start menuiq-backend"
echo ""
echo "2. Check service status:"
echo "   systemctl status menuiq-backend"
echo ""
echo "3. View logs:"
echo "   journalctl -u menuiq-backend -f"
echo ""
echo "4. Set up SSL certificate:"
echo "   certbot --nginx -d api.menuiq.io"
echo ""
echo "5. Configure firewall:"
echo "   ufw allow 80/tcp"
echo "   ufw allow 443/tcp"
echo "   ufw allow 22/tcp"
echo "   ufw enable"
echo ""
echo "Automated features enabled:"
echo "- Daily backups at 2 AM"
echo "- Health checks every 5 minutes"
echo "- Log rotation every day"
echo "- Nginx reverse proxy on port 80"
echo "=========================================="