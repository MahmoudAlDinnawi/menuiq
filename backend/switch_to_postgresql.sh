#!/bin/bash

# Script to switch from MySQL to PostgreSQL

echo "=== Switching MenuIQ from MySQL to PostgreSQL ==="

# 1. First, let's backup your .env file
echo "1. Backing up current .env file..."
cp .env .env.mysql.backup

# 2. Update the DATABASE_URL in .env
echo "2. Updating DATABASE_URL in .env file..."
echo "Please choose which PostgreSQL database to use:"
echo "1) menuiq_production"
echo "2) menuiq"
read -p "Enter your choice (1 or 2): " db_choice

if [ "$db_choice" = "1" ]; then
    DB_NAME="menuiq_production"
else
    DB_NAME="menuiq"
fi

# Update .env file
sed -i.bak 's|DATABASE_URL=mysql+pymysql://.*|DATABASE_URL=postgresql://postgres:your_password@localhost/'$DB_NAME'|' .env

echo "3. DATABASE_URL updated to use PostgreSQL"
echo "   Please edit .env and update 'your_password' with your actual PostgreSQL password"

# 3. Install PostgreSQL Python driver
echo "4. Installing psycopg2 for PostgreSQL support..."
pip install psycopg2-binary

# 4. Initialize the PostgreSQL database
echo "5. Setting up PostgreSQL database..."
echo "Do you want to:"
echo "1) Use existing database (if you already have data)"
echo "2) Create fresh database (will delete existing data)"
read -p "Enter your choice (1 or 2): " init_choice

if [ "$init_choice" = "2" ]; then
    echo "Creating fresh database..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    
    # Run initialization
    python init_database.py
fi

# 5. Apply the new columns
echo "6. Applying new columns to settings table..."
sudo -u postgres psql -d $DB_NAME << EOF
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';
EOF

echo "=== Switch complete! ==="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Edit .env and update the PostgreSQL password"
echo "2. Restart your backend service"
echo "3. Test the application"
echo ""
echo "Your old MySQL configuration is saved in .env.mysql.backup"