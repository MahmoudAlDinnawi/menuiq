# Deployment Guide for MenuIQ

## Backend Deployment on Hetzner

### 1. SSH into your Hetzner server
```bash
ssh your-user@your-hetzner-ip
```

### 2. Pull the latest changes
```bash
cd /path/to/your/menuiq
git pull origin main
```

### 3. Apply database migration
```bash
cd backend
source venv/bin/activate

# Connect to PostgreSQL and run the migration
psql -U your_db_user -d your_db_name << EOF
-- Add hero subtitle fields
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';
EOF
```

### 4. Install/Update Python dependencies (if needed)
```bash
pip install -r requirements.txt
```

### 5. Restart the backend service
```bash
# If using systemd
sudo systemctl restart menuiq-backend

# Or if using supervisor
sudo supervisorctl restart menuiq-backend

# Or if running with PM2
pm2 restart menuiq-backend
```

### 6. Check the logs
```bash
# For systemd
sudo journalctl -u menuiq-backend -f

# For supervisor
sudo tail -f /var/log/supervisor/menuiq-backend.log

# For PM2
pm2 logs menuiq-backend
```

## Frontend Deployment on Vercel

### Option 1: Automatic Deployment (Recommended)
If you have Vercel connected to your GitHub repository, it will automatically deploy when you push to main.

### Option 2: Manual Deployment
1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

2. Navigate to frontend directory
```bash
cd frontend
```

3. Deploy to Vercel
```bash
vercel --prod
```

## Important Notes

### Environment Variables
Make sure your environment variables are updated on both platforms:

**Backend (.env on Hetzner):**
- DATABASE_URL
- JWT_SECRET_KEY
- JWT_ALGORITHM
- ACCESS_TOKEN_EXPIRE_MINUTES
- CORS origins (should include your Vercel frontend URL)

**Frontend (Vercel Environment Variables):**
- REACT_APP_API_URL (should point to your Hetzner backend)

### CORS Configuration
Ensure your backend CORS settings allow requests from your Vercel domain:
```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"  # for local development
    ],
    # ... other settings
)
```

### Testing the Deployment
1. Visit your frontend URL
2. Check that the settings page loads correctly
3. Try updating the hero subtitle and footer tagline
4. Verify the changes appear on the public menu page

### Rollback if Needed
```bash
# On Hetzner
git log --oneline -5  # Find the previous commit
git checkout <previous-commit-hash>
sudo systemctl restart menuiq-backend

# On Vercel
# Go to Vercel dashboard > Your project > Deployments
# Click on a previous deployment and promote to production
```

## Troubleshooting

### Backend Issues
1. Check Python version compatibility (requires Python 3.8+)
2. Ensure PostgreSQL is running
3. Verify database migrations were applied
4. Check file permissions for uploaded images directory

### Frontend Issues
1. Clear browser cache
2. Check browser console for errors
3. Verify API URL is correct in environment variables
4. Check Network tab for failed API requests

### Common Errors
- **"column settings.hero_subtitle_en does not exist"**: Database migration not applied
- **CORS errors**: Backend CORS settings need to include frontend URL
- **404 on API calls**: Check REACT_APP_API_URL environment variable