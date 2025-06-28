-- Update database schema to match frontend requirements
-- Run this with: sudo -u postgres psql -d menuiq_production -f update_menu_schema.sql

-- Add missing columns to menu_items table
DO $$ 
BEGIN
    -- Arabic fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='name_ar') THEN
        ALTER TABLE menu_items ADD COLUMN name_ar VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='description_ar') THEN
        ALTER TABLE menu_items ADD COLUMN description_ar TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='price_without_vat') THEN
        ALTER TABLE menu_items ADD COLUMN price_without_vat DECIMAL(10,2);
    END IF;
    
    -- Dietary flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='is_halal') THEN
        ALTER TABLE menu_items ADD COLUMN is_halal BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='is_dairy_free') THEN
        ALTER TABLE menu_items ADD COLUMN is_dairy_free BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='is_nut_free') THEN
        ALTER TABLE menu_items ADD COLUMN is_nut_free BOOLEAN DEFAULT false;
    END IF;
    
    -- Exercise fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='walk_minutes') THEN
        ALTER TABLE menu_items ADD COLUMN walk_minutes INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='run_minutes') THEN
        ALTER TABLE menu_items ADD COLUMN run_minutes INTEGER;
    END IF;
    
    -- Warning flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='high_sodium') THEN
        ALTER TABLE menu_items ADD COLUMN high_sodium BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='contains_caffeine') THEN
        ALTER TABLE menu_items ADD COLUMN contains_caffeine BOOLEAN DEFAULT false;
    END IF;
    
    -- Nutrition fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='total_fat') THEN
        ALTER TABLE menu_items ADD COLUMN total_fat DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='saturated_fat') THEN
        ALTER TABLE menu_items ADD COLUMN saturated_fat DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='trans_fat') THEN
        ALTER TABLE menu_items ADD COLUMN trans_fat DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='cholesterol') THEN
        ALTER TABLE menu_items ADD COLUMN cholesterol INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='sodium') THEN
        ALTER TABLE menu_items ADD COLUMN sodium INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='total_carbs') THEN
        ALTER TABLE menu_items ADD COLUMN total_carbs DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='dietary_fiber') THEN
        ALTER TABLE menu_items ADD COLUMN dietary_fiber DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='sugars') THEN
        ALTER TABLE menu_items ADD COLUMN sugars DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='protein') THEN
        ALTER TABLE menu_items ADD COLUMN protein DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='vitamin_a') THEN
        ALTER TABLE menu_items ADD COLUMN vitamin_a INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='vitamin_c') THEN
        ALTER TABLE menu_items ADD COLUMN vitamin_c INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='calcium') THEN
        ALTER TABLE menu_items ADD COLUMN calcium INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='menu_items' AND column_name='iron') THEN
        ALTER TABLE menu_items ADD COLUMN iron INTEGER;
    END IF;
END $$;

-- Update categories table structure
DO $$ 
BEGIN
    -- Add value/label columns for frontend compatibility
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='categories' AND column_name='value') THEN
        ALTER TABLE categories ADD COLUMN value VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='categories' AND column_name='label') THEN
        ALTER TABLE categories ADD COLUMN label VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='categories' AND column_name='label_ar') THEN
        ALTER TABLE categories ADD COLUMN label_ar VARCHAR(255);
    END IF;
END $$;

-- Update existing categories to have value/label format
UPDATE categories 
SET value = LOWER(REPLACE(name, ' ', '_')),
    label = name,
    label_ar = name
WHERE value IS NULL;

-- Rename existing dietary columns to match frontend
DO $$ 
BEGIN
    -- Rename is_vegetarian to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_vegetarian') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='vegetarian') THEN
        ALTER TABLE menu_items RENAME COLUMN is_vegetarian TO vegetarian;
    END IF;
    
    -- Rename is_vegan to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_vegan') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='vegan') THEN
        ALTER TABLE menu_items RENAME COLUMN is_vegan TO vegan;
    END IF;
    
    -- Rename is_gluten_free to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_gluten_free') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='gluten_free') THEN
        ALTER TABLE menu_items RENAME COLUMN is_gluten_free TO gluten_free;
    END IF;
    
    -- Rename is_halal to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_halal') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='halal') THEN
        ALTER TABLE menu_items RENAME COLUMN is_halal TO halal;
    END IF;
    
    -- Rename is_dairy_free to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_dairy_free') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='dairy_free') THEN
        ALTER TABLE menu_items RENAME COLUMN is_dairy_free TO dairy_free;
    END IF;
    
    -- Rename is_nut_free to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='is_nut_free') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='nut_free') THEN
        ALTER TABLE menu_items RENAME COLUMN is_nut_free TO nut_free;
    END IF;
    
    -- Rename spice_level to match frontend
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='spice_level') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='spicy_level') THEN
        ALTER TABLE menu_items RENAME COLUMN spice_level TO spicy_level;
    END IF;
    
    -- Rename image_url to image
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='menu_items' AND column_name='image_url') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='menu_items' AND column_name='image') THEN
        ALTER TABLE menu_items RENAME COLUMN image_url TO image;
    END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_value ON categories(value);

-- Show updated schemas
\d menu_items
\d categories