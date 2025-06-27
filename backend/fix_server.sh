#!/bin/bash
# Fix server configuration after PostgreSQL migration

echo "🔧 Fixing server configuration..."

# Update main.py to ensure it uses correct env files
echo "📝 Checking main.py..."
if grep -q "\.env\.postgres" main.py; then
    echo "❌ Found .env.postgres reference in main.py"
    sed -i "s/\.env\.postgres/.env/g" main.py
    sed -i "s/\.env\.production\.postgres/.env.production/g" main.py
    echo "✅ Fixed main.py"
fi

# Update init_database.py
echo "📝 Checking init_database.py..."
if grep -q "\.env\.postgres" init_database.py; then
    echo "❌ Found .env.postgres reference in init_database.py"
    sed -i "s/\.env\.postgres/.env/g" init_database.py
    sed -i "s/\.env\.production\.postgres/.env.production/g" init_database.py
    echo "✅ Fixed init_database.py"
fi

# Update database.py
echo "📝 Checking database.py..."
if grep -q "database_postgres" database.py; then
    echo "❌ Found database_postgres reference"
    sed -i "s/database_postgres/database/g" *.py
    echo "✅ Fixed database imports"
fi

# Create .env.production if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📋 Creating .env.production..."
    if [ -f .env.production.postgres ]; then
        cp .env.production.postgres .env.production
        echo "✅ Created .env.production from .env.production.postgres"
    else
        echo "❌ No .env.production.postgres found. Please create .env.production manually"
    fi
fi

# Update systemd service
echo "🔧 Updating systemd service..."
if grep -q "main_postgres:app" /etc/systemd/system/menuiq.service; then
    sed -i "s/main_postgres:app/main:app/g" /etc/systemd/system/menuiq.service
    echo "✅ Updated main_postgres to main"
fi

if grep -q "\.env\.production\.postgres" /etc/systemd/system/menuiq.service; then
    sed -i "s/\.env\.production\.postgres/.env.production/g" /etc/systemd/system/menuiq.service
    echo "✅ Updated environment file path"
fi

# Reload and restart
echo "🔄 Restarting service..."
systemctl daemon-reload
systemctl restart menuiq

# Check status
echo "📊 Service status:"
systemctl status menuiq --no-pager | head -20

echo "
✅ Configuration fixed!

Please verify:
1. Check if .env.production exists and has correct DATABASE_URL
2. Run: curl https://api.menuiq.io/api/health
3. Try logging in again
"