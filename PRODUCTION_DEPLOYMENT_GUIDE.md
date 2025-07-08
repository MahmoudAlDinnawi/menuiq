# Production Deployment Guide

## Overview
This guide covers the safe deployment of backend changes including database migrations, with minimal downtime and proper rollback procedures.

## Pre-Deployment Checklist

### 1. Code Changes Summary
- **Multi-Item Feature**: Added support for multi-item menus with sub-items
- **FlowIQ Integration**: Interactive flow system for user engagement
- **Backend Fixes**: Integer field handling, cascade delete for flows
- **Frontend Updates**: Enhanced UI/UX for menu editor and dashboard

### 2. Database Changes Required
The following migrations need to be applied:
1. **752ea66190a1_add_multi_item_support.py** - Adds multi-item functionality
   - New columns: `is_multi_item`, `parent_item_id`, `price_min`, `price_max`, `display_as_grid`, `sub_item_order`
   - Foreign key relationships and constraints
   - Indexes for performance

2. **Model relationship fix** - Flow interactions cascade delete (code change only)

## Step-by-Step Deployment Process

### Phase 1: Preparation (1-2 days before)

#### 1.1 Backup Production Database
```bash
# Create timestamped backup
pg_dump -h YOUR_PROD_HOST -U YOUR_PROD_USER -d menuiq > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_*.sql | head -20
```

#### 1.2 Create Staging Environment
```bash
# Create staging database from production backup
createdb menuiq_staging
psql menuiq_staging < backup_*.sql

# Set up staging backend with production data
cp .env .env.staging
# Edit .env.staging to point to staging database
```

#### 1.3 Test Migrations on Staging
```bash
# Activate virtual environment
source venv/bin/activate

# Point to staging database
export DATABASE_URL="postgresql://user:pass@localhost/menuiq_staging"

# Check current migration status
alembic current

# Apply new migrations
alembic upgrade head

# Verify migrations
alembic history
```

#### 1.4 Test Application on Staging
- Run full test suite
- Test multi-item creation/editing
- Test flow deletion
- Verify existing data integrity
- Check performance with production data volume

### Phase 2: Pre-Deployment (Day of deployment)

#### 2.1 Final Backup
```bash
# Create final backup before deployment
pg_dump -h YOUR_PROD_HOST -U YOUR_PROD_USER -d menuiq > backup_final_$(date +%Y%m%d_%H%M%S).sql

# Store in multiple locations
# - Local backup
# - Cloud storage (S3, Google Cloud Storage)
# - Off-site backup
```

#### 2.2 Prepare Rollback Scripts
```bash
# Create rollback SQL
alembic downgrade 494eb415fa85 --sql > rollback_multi_item.sql

# Review rollback SQL
cat rollback_multi_item.sql
```

#### 2.3 Notify Team
- Send deployment notice
- Coordinate with frontend deployment (Vercel)
- Have DBA/DevOps on standby

### Phase 3: Backend Deployment

#### 3.1 Deploy Code (Without Migrations)
```bash
# Deploy new backend code first
git pull origin main
pip install -r requirements.txt

# Don't restart services yet
```

#### 3.2 Run Database Migrations
```bash
# Set production database URL
export DATABASE_URL="postgresql://YOUR_PROD_USER:YOUR_PROD_PASS@YOUR_PROD_HOST/menuiq"

# Check current version
alembic current

# Run migrations with output logging
alembic upgrade head 2>&1 | tee migration_log_$(date +%Y%m%d_%H%M%S).log

# Verify migration success
alembic current
```

#### 3.3 Verify Database Changes
```sql
-- Connect to production database
psql -h YOUR_PROD_HOST -U YOUR_PROD_USER -d menuiq

-- Check new columns exist
\d menu_items

-- Verify constraints
\d+ menu_items

-- Check for any orphaned data
SELECT COUNT(*) FROM menu_items WHERE parent_item_id IS NOT NULL;
SELECT COUNT(*) FROM menu_items WHERE is_multi_item = true;
```

#### 3.4 Update Backend Services
```bash
# Restart backend services
sudo systemctl restart menuiq-backend
# or
pm2 restart menuiq-backend
# or
supervisorctl restart menuiq-backend

# Check logs
tail -f /var/log/menuiq/backend.log
```

### Phase 4: Frontend Deployment

#### 4.1 Deploy to Vercel
```bash
# Ensure latest code is pushed
git push origin main

# Vercel auto-deployment or manual trigger
vercel --prod

# Monitor deployment
vercel logs
```

#### 4.2 Verify Frontend
- Test multi-item creation
- Test flow functionality
- Check existing features still work

### Phase 5: Post-Deployment

#### 5.1 Monitor Application
```bash
# Check backend logs
tail -f /var/log/menuiq/backend.log

# Monitor database
psql -c "SELECT COUNT(*) FROM menu_items WHERE created_at > NOW() - INTERVAL '1 hour';"

# Check error rates
grep ERROR /var/log/menuiq/backend.log | tail -20
```

#### 5.2 Smoke Tests
- [ ] Create a single item
- [ ] Create a multi-item with sub-items
- [ ] Edit existing items
- [ ] Delete items
- [ ] Create and delete flows
- [ ] Check public menu display

#### 5.3 Performance Checks
```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM menu_items 
WHERE tenant_id = 1 AND parent_item_id IS NULL;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'menu_items';
```

## Rollback Procedure

If issues are encountered:

### 1. Immediate Rollback (Within 1 hour)
```bash
# Stop backend services
sudo systemctl stop menuiq-backend

# Rollback database
export DATABASE_URL="postgresql://YOUR_PROD_USER:YOUR_PROD_PASS@YOUR_PROD_HOST/menuiq"
alembic downgrade 494eb415fa85

# Deploy previous backend version
git checkout <previous-version-tag>
pip install -r requirements.txt

# Restart services
sudo systemctl start menuiq-backend

# Revert frontend on Vercel
# Use Vercel dashboard to promote previous deployment
```

### 2. Restore from Backup (If corruption occurred)
```bash
# Stop all services
sudo systemctl stop menuiq-backend

# Restore database
psql -h YOUR_PROD_HOST -U YOUR_PROD_USER -c "DROP DATABASE menuiq;"
psql -h YOUR_PROD_HOST -U YOUR_PROD_USER -c "CREATE DATABASE menuiq;"
psql -h YOUR_PROD_HOST -U YOUR_PROD_USER menuiq < backup_final_*.sql

# Deploy previous code version
git checkout <previous-version-tag>

# Restart services
sudo systemctl start menuiq-backend
```

## Environment Variables

Ensure these are set in production:

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host/menuiq
SECRET_KEY=your-production-secret
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-domain.com

# Frontend (Vercel Environment Variables)
REACT_APP_API_BASE_URL=https://your-backend-api.com
REACT_APP_ENVIRONMENT=production
```

## Monitoring Checklist

### First 24 Hours
- [ ] Check error logs every hour
- [ ] Monitor database connections
- [ ] Watch response times
- [ ] Check memory usage
- [ ] Verify backup jobs still running

### First Week
- [ ] Daily log review
- [ ] Check for slow queries
- [ ] Monitor disk space
- [ ] Review user feedback
- [ ] Check data integrity

## Common Issues and Solutions

### Issue 1: Migration Fails
```bash
# Check constraints
psql -c "\d+ menu_items" | grep CONSTRAINT

# If constraint violation, fix data first
psql -c "UPDATE menu_items SET parent_item_id = NULL WHERE parent_item_id = 0;"
```

### Issue 2: Performance Degradation
```bash
# Rebuild indexes
REINDEX TABLE menu_items;

# Update statistics
ANALYZE menu_items;
```

### Issue 3: Frontend Can't Connect
- Check CORS settings
- Verify API URL in frontend config
- Check firewall rules

## Support Contacts

- Database Admin: [contact]
- DevOps Team: [contact]
- On-call Engineer: [contact]

## Final Notes

1. **Test Everything on Staging First** - Never run untested migrations on production
2. **Have Rollback Ready** - Keep rollback scripts and backups easily accessible
3. **Monitor Actively** - First 24 hours are critical
4. **Document Issues** - Keep notes of any issues for future deployments

---

Remember: It's better to delay deployment than to rush and break production!