#!/bin/bash

# Database Reset Script for MenuIQ
# This script will drop and recreate the database

echo "=== MenuIQ Database Reset Script ==="
echo "WARNING: This will DELETE all data in the database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Database credentials
DB_NAME="menuiq_dev"
DB_USER="postgres"
DB_PASS="your_password_here"  # Update this with your actual password

echo "1. Dropping existing database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "2. Creating new database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

echo "3. Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "4. Activating virtual environment..."
cd /path/to/menuiq/backend  # Update this path
source venv/bin/activate

echo "5. Running database initialization..."
python init_database.py

echo "6. Applying new migrations..."
sudo -u postgres psql -d $DB_NAME << EOF
-- Add hero subtitle and footer tagline fields
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';
EOF

echo "=== Database reset complete! ==="
echo "You may need to:"
echo "1. Create a new superadmin user"
echo "2. Re-register your tenant"
echo "3. Re-upload any data"