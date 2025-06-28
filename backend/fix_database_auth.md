# Fix PostgreSQL Authentication and Reset Database

## Option 1: Use sudo to run as postgres user (Recommended)

```bash
# 1. Connect to PostgreSQL as postgres user
sudo -u postgres psql

# 2. Inside psql, run these commands:
\c menuiq_dev;  -- or your database name

-- Add the new columns
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';

-- Exit psql
\q
```

## Option 2: Fix PostgreSQL Authentication

1. Edit PostgreSQL configuration:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf  # Version might be different
```

2. Find the line that looks like:
```
local   all             postgres                                peer
```

3. Change `peer` to `md5` or `trust`:
```
local   all             postgres                                md5
```

4. Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

5. Now you can connect with password:
```bash
psql -U postgres -d menuiq_dev -h localhost
# Enter your password when prompted
```

## Option 3: Complete Database Reset

If you want to completely reset the database:

```bash
# 1. Drop the database (as postgres user)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS menuiq_dev;"

# 2. Create new database
sudo -u postgres psql -c "CREATE DATABASE menuiq_dev;"

# 3. Run the initialization script
cd /path/to/menuiq/backend
source venv/bin/activate
python init_database.py

# 4. Apply the new columns
sudo -u postgres psql -d menuiq_dev << EOF
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine',
ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة',
ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom',
ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';
EOF
```

## Check Current Database Connection

To see your current database configuration:
```bash
cd /path/to/menuiq/backend
cat .env | grep DATABASE_URL
```

The DATABASE_URL should look like:
```
DATABASE_URL=postgresql://username:password@localhost/menuiq_dev
```

## Quick Fix for the Migration Only

If you just want to apply the migration without resetting:

```bash
# Run as postgres user directly
sudo -u postgres psql -d menuiq_dev -c "ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT DEFAULT 'Discover our exquisite selection of authentic French cuisine', ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT DEFAULT 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة', ADD COLUMN IF NOT EXISTS footer_tagline_en TEXT DEFAULT 'Authentic French dining experience in the heart of the Kingdom', ADD COLUMN IF NOT EXISTS footer_tagline_ar TEXT DEFAULT 'تجربة طعام فرنسية أصيلة في قلب المملكة';"
```