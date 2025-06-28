#!/bin/bash

echo "=== MenuIQ Fresh Database Setup ==="
echo "WARNING: This will DELETE ALL existing MenuIQ databases!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Database configuration
DB_NAME="menuiq"
DB_USER="postgres"
DB_PASSWORD="your_secure_password_here"  # Change this!

echo "1. Removing old databases..."
sudo -u postgres psql << EOF
-- Drop existing databases
DROP DATABASE IF EXISTS menuiq_production;
DROP DATABASE IF EXISTS menuiq;
DROP DATABASE IF EXISTS restaurant_menu;
EOF

echo "2. Creating new database..."
sudo -u postgres psql << EOF
-- Create new database
CREATE DATABASE $DB_NAME;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "3. Updating .env file..."
# Backup old .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Create new .env with PostgreSQL settings
cat > .env << EOF
# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}

# JWT Settings
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins (update with your frontend URL)
CORS_ORIGINS=["http://localhost:3000", "https://your-app.vercel.app"]

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Environment
ENVIRONMENT=production
EOF

echo "4. Installing PostgreSQL dependencies..."
pip install psycopg2-binary sqlalchemy

echo "5. Initializing database schema..."
python << EOF
from database import engine, Base
from models import *

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
EOF

echo "6. Applying custom migrations..."
sudo -u postgres psql -d $DB_NAME << EOF
-- Add hero subtitle and footer tagline fields
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';

-- Verify the columns were added
\d settings
EOF

echo "7. Creating initial superadmin..."
python << EOF
from database import SessionLocal
from models import SystemAdmin
from auth import get_password_hash

db = SessionLocal()

# Create superadmin
admin = SystemAdmin(
    username="admin",
    email="admin@menuiq.com",
    hashed_password=get_password_hash("admin123"),  # Change this password!
    is_active=True
)

db.add(admin)
db.commit()
db.close()

print("Superadmin created!")
print("Username: admin")
print("Password: admin123 (PLEASE CHANGE THIS!)")
EOF

echo ""
echo "=== Database Setup Complete! ==="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Update the password in .env file"
echo "2. Change the superadmin password"
echo "3. Update CORS_ORIGINS in .env with your frontend URL"
echo "4. Restart your backend service:"
echo "   sudo systemctl restart menuiq-backend"
echo ""
echo "Database: $DB_NAME"
echo "Your old .env was backed up to: .env.backup.*"
echo ""
echo "To verify the setup:"
echo "  sudo -u postgres psql -d $DB_NAME -c '\dt'"