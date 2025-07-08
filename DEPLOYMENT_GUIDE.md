# MenuIQ Zero-Downtime Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the MenuIQ backend to your production server (37.27.183.157) with zero downtime.

## Files Created

1. **`deploy_to_production.sh`** - Main deployment script
2. **`pre_deployment_check.sh`** - Pre-deployment checklist
3. **`server_setup.sh`** - One-time server setup script
4. **`menuiq-backend.service`** - Systemd service file

## First-Time Setup (Run Once)

### 1. On Your Local Machine

```bash
# Make scripts executable
chmod +x deploy_to_production.sh
chmod +x pre_deployment_check.sh

# Run pre-deployment check
./pre_deployment_check.sh
```

### 2. On the Server

```bash
# SSH to server
ssh root@37.27.183.157

# Copy the service file and setup script to the server
# (You'll need to upload these first)

# Run server setup
cd /root/menuiq
chmod +x server_setup.sh
./server_setup.sh
```

## Deployment Process

### Step 1: Pre-Deployment Checks

Run on your local machine:

```bash
./pre_deployment_check.sh
```

This will verify:
- Environment files exist
- No debug statements
- All dependencies are listed
- Database migrations are ready
- Git status is clean

### Step 2: Deploy to Production

```bash
./deploy_to_production.sh
```

The script will:
1. Create a backup of the current version
2. Upload new code to the server
3. Install dependencies in a new virtual environment
4. Run database migrations
5. Switch to the new version atomically
6. Restart the service
7. Perform health checks
8. Rollback automatically if anything fails

### Step 3: Post-Deployment Verification

After deployment, verify:

1. **Check Health Endpoint**
   ```bash
   curl http://37.27.183.157:8000/health
   ```

2. **Monitor Logs**
   ```bash
   ssh root@37.27.183.157 'tail -f /root/menuiq/backend/error.log'
   ```

3. **Check Service Status**
   ```bash
   ssh root@37.27.183.157 'systemctl status menuiq-backend'
   ```

## Zero-Downtime Strategy

The deployment achieves zero downtime through:

1. **Blue-Green Deployment**: New version is prepared alongside the old one
2. **Database Migration Safety**: Migrations run before switching versions
3. **Atomic Switch**: Old version is replaced instantly
4. **Health Checks**: Automatic rollback if new version fails
5. **Graceful Restart**: Service manager ensures smooth transition

## Environment Variables

Ensure your production `.env` file contains:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/menuiq

# Security
SECRET_KEY=your-very-secure-random-key-here

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Environment
ENVIRONMENT=production
```

## Rollback Procedure

If you need to manually rollback:

```bash
ssh root@37.27.183.157

# Navigate to app directory
cd /root/menuiq

# Find the backup
ls -la backend_backup_*

# Rollback to previous version
rm -rf backend
mv backend_backup_TIMESTAMP backend

# Restart service
systemctl restart menuiq-backend

# Verify
curl http://localhost:8000/health
```

## Database Migrations

The deployment script automatically runs migrations. To run manually:

```bash
ssh root@37.27.183.157
cd /root/menuiq/backend
source venv/bin/activate
source .env

# Check current version
alembic current

# Run migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## Monitoring

### Logs

- **Application Logs**: `/root/menuiq/backend/error.log`
- **Access Logs**: `/root/menuiq/backend/access.log`
- **System Logs**: `journalctl -u menuiq-backend`

### Health Checks

- Automated health checks run every 5 minutes
- Failed checks trigger automatic restart
- Check health manually: `curl http://localhost:8000/health`

### Backups

- Database backups: Daily at 2 AM
- Upload backups: Daily at 2 AM
- Location: `/root/backups/daily/`
- Retention: 7 days

## Troubleshooting

### Service Won't Start

```bash
# Check logs
journalctl -u menuiq-backend -n 50

# Check Python errors
cd /root/menuiq/backend
source venv/bin/activate
python main.py
```

### Database Connection Issues

```bash
# Test connection
cd /root/menuiq/backend
source venv/bin/activate
python -c "from database import engine; print('Connected!')"
```

### Permission Issues

```bash
# Fix permissions
chown -R root:root /root/menuiq
chmod -R 755 /root/menuiq/backend/uploads
```

## Security Checklist

- [ ] Strong SECRET_KEY in production
- [ ] Database password is secure
- [ ] SSL certificate installed (use certbot)
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Regular security updates
- [ ] Monitoring alerts configured

## Performance Optimization

1. **Gunicorn Workers**: Set to 4 (adjust based on CPU cores)
2. **Database Connection Pool**: Configured in database.py
3. **Nginx Caching**: Static files cached for 30 days
4. **Log Rotation**: Prevents disk space issues

## Maintenance Windows

For major updates requiring downtime:

1. **Notify users** in advance
2. **Enable maintenance mode** (configure in Nginx)
3. **Backup everything** before proceeding
4. **Have rollback plan** ready
5. **Test on staging** first

## Support

If deployment fails:

1. Check the deployment script output for specific errors
2. Review server logs: `journalctl -u menuiq-backend`
3. Verify environment variables are set correctly
4. Ensure database is accessible
5. Check disk space: `df -h`
6. Verify Python dependencies installed correctly

Remember: The deployment script includes automatic rollback, so your service should remain available even if deployment fails.