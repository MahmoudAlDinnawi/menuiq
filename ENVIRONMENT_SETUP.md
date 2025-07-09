# Environment Setup Guide

This guide helps you set up your development and production environments properly to avoid conflicts.

## Local Development Setup

### Backend (.env)
1. Copy `backend/.env.example` to `backend/.env`
2. Update the following for your local environment:
   ```
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/menuiq_dev
   SECRET_KEY=your-local-secret-key
   ENVIRONMENT=development
   CORS_ORIGINS=http://localhost:3000
   ```

### Frontend (.env.local)
1. Copy `frontend/.env.example` to `frontend/.env.local`
2. Update for local development:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

## Production Setup

### Backend (.env.production)
1. Create `backend/.env.production` on your server (never commit this!)
2. Set production values:
   ```
   DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/menuiq_prod
   SECRET_KEY=your-strong-production-secret-key
   ENVIRONMENT=production
   CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

### Frontend (.env.production.local)
1. Create `frontend/.env.production.local` on your build server
2. Set production API URL:
   ```
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

## Important Notes

1. **Never commit .env files** - They are already in .gitignore
2. **Use different database names** for dev and production to avoid conflicts
3. **Use different SECRET_KEYs** for security
4. **Keep .env.example files updated** when adding new environment variables

## Avoiding Conflicts

1. **Before pushing to git:**
   ```bash
   git status  # Check no .env files are staged
   git diff    # Review changes
   ```

2. **After pulling from git:**
   - Check if .env.example files were updated
   - Update your local .env files accordingly

3. **Database migrations:**
   - Always backup production database before migrations
   - Test migrations locally first
   - Use separate database instances for dev/prod

## Quick Commands

### Local Development
```bash
# Backend
cd backend
source venv/bin/activate
python main.py

# Frontend
cd frontend
npm start
```

### Production Deployment
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
# Serve the build folder with your web server
```