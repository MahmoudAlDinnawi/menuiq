# Analytics Update - Production Deployment Checklist

## Pre-Deployment
- [x] Frontend updated and deployed on Vercel
- [x] Backend code tested locally
- [x] All test files removed

## Backend Deployment Steps

### 1. Connect to Production Server
```bash
ssh your-server
cd /path/to/menuiq/backend
```

### 2. Pull Latest Code
```bash
git pull origin main
```

### 3. Run Deployment Script
```bash
./deploy_analytics_update.sh
```

This script will:
- Update database schema (add device columns)
- Run analytics aggregation
- Restart the MenuIQ service

### 4. Manual Verification
```bash
# Check if service is running
sudo systemctl status menuiq

# Check recent logs
sudo journalctl -u menuiq -n 50

# Test analytics endpoint
curl -X POST http://localhost:8000/api/analytics/track/session \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "demo", "language": "en"}'
```

## Post-Deployment Verification

### Backend API Tests
1. Create a test session with iPhone user agent
2. Check device details are saved correctly
3. Verify analytics dashboard returns device breakdown

### Frontend Verification
1. Login to tenant dashboard
2. Navigate to Analytics page
3. Verify:
   - Device Types chart shows data
   - Device Details table lists specific models
   - All metrics display correctly

## Rollback Plan
If issues occur:
```bash
# Revert code
git checkout <previous-commit>

# Restart service
sudo systemctl restart menuiq
```

## Important Notes
- The `.env` file in production should have correct database URL
- Ensure `aggregate_analytics.py` is set up in cron for daily runs
- Monitor server logs for any errors after deployment