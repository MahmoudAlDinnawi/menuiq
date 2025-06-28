-- Enhanced Menu System Migration
-- This migration adds all fields needed for a rich, modern menu card system

-- First, ensure all basic fields exist and are properly typed
ALTER TABLE menu_items 
    -- Ensure image column exists (some systems might have image_url)
    ADD COLUMN IF NOT EXISTS image VARCHAR(500),
    -- Drop image_url if it exists and we're using image
    DROP COLUMN IF EXISTS image_url,
    
    -- Ensure proper nutrition fields
    ADD COLUMN IF NOT EXISTS total_fat DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS saturated_fat DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS trans_fat DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS cholesterol INTEGER,
    ADD COLUMN IF NOT EXISTS sodium INTEGER,
    ADD COLUMN IF NOT EXISTS total_carbs DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS dietary_fiber DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS sugars DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS protein DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS vitamin_a INTEGER,
    ADD COLUMN IF NOT EXISTS vitamin_c INTEGER,
    ADD COLUMN IF NOT EXISTS calcium INTEGER,
    ADD COLUMN IF NOT EXISTS iron INTEGER,
    
    -- Add new rich content fields
    ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50), -- e.g., "New", "Popular", "Chef's Special"
    ADD COLUMN IF NOT EXISTS badge_color VARCHAR(7), -- hex color for badge
    ADD COLUMN IF NOT EXISTS highlight_message TEXT, -- Special promotional message
    ADD COLUMN IF NOT EXISTS cooking_method VARCHAR(100), -- e.g., "Grilled", "Fried", "Steamed"
    ADD COLUMN IF NOT EXISTS origin_country VARCHAR(100), -- e.g., "France", "Italy"
    ADD COLUMN IF NOT EXISTS pairing_suggestions TEXT, -- Wine or side dish suggestions
    ADD COLUMN IF NOT EXISTS chef_notes TEXT, -- Special notes from the chef
    ADD COLUMN IF NOT EXISTS seasonal_availability VARCHAR(100), -- e.g., "Year-round", "Summer only"
    ADD COLUMN IF NOT EXISTS portion_size VARCHAR(100), -- e.g., "For 2 people", "Individual"
    ADD COLUMN IF NOT EXISTS texture_notes VARCHAR(255), -- e.g., "Crispy outside, tender inside"
    ADD COLUMN IF NOT EXISTS flavor_profile VARCHAR(255), -- e.g., "Sweet and savory"
    ADD COLUMN IF NOT EXISTS recommended_time VARCHAR(100), -- e.g., "Best for lunch", "Perfect for dinner"
    ADD COLUMN IF NOT EXISTS instagram_worthy BOOLEAN DEFAULT FALSE, -- Photogenic dishes
    ADD COLUMN IF NOT EXISTS sustainability_info TEXT, -- Eco-friendly sourcing info
    ADD COLUMN IF NOT EXISTS customization_options TEXT, -- Available modifications
    ADD COLUMN IF NOT EXISTS wine_pairing VARCHAR(255), -- Specific wine recommendations
    ADD COLUMN IF NOT EXISTS beer_pairing VARCHAR(255), -- Beer recommendations
    ADD COLUMN IF NOT EXISTS cocktail_pairing VARCHAR(255), -- Cocktail recommendations
    ADD COLUMN IF NOT EXISTS mocktail_pairing VARCHAR(255), -- Non-alcoholic pairing
    ADD COLUMN IF NOT EXISTS plating_style VARCHAR(100), -- e.g., "Modern", "Traditional"
    ADD COLUMN IF NOT EXISTS signature_dish BOOLEAN DEFAULT FALSE, -- Restaurant's signature items
    ADD COLUMN IF NOT EXISTS limited_availability BOOLEAN DEFAULT FALSE, -- Limited time/quantity
    ADD COLUMN IF NOT EXISTS pre_order_required BOOLEAN DEFAULT FALSE, -- Needs advance ordering
    ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1, -- Minimum order amount
    ADD COLUMN IF NOT EXISTS max_daily_orders INTEGER, -- Daily limit if applicable
    ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0, -- Loyalty program points
    ADD COLUMN IF NOT EXISTS carbon_footprint VARCHAR(50), -- e.g., "Low", "Medium", "High"
    ADD COLUMN IF NOT EXISTS local_ingredients BOOLEAN DEFAULT FALSE, -- Uses local sourcing
    ADD COLUMN IF NOT EXISTS organic_certified BOOLEAN DEFAULT FALSE, -- Organic certification
    ADD COLUMN IF NOT EXISTS fair_trade BOOLEAN DEFAULT FALSE, -- Fair trade ingredients
    ADD COLUMN IF NOT EXISTS michelin_recommended BOOLEAN DEFAULT FALSE, -- Special recognition
    ADD COLUMN IF NOT EXISTS award_winning BOOLEAN DEFAULT FALSE, -- Has won awards
    ADD COLUMN IF NOT EXISTS customer_rating DECIMAL(2,1), -- Average rating (0-5)
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0, -- Number of reviews
    ADD COLUMN IF NOT EXISTS best_seller_rank INTEGER, -- Ranking among items
    ADD COLUMN IF NOT EXISTS reorder_rate DECIMAL(3,1), -- Percentage who reorder
    ADD COLUMN IF NOT EXISTS pairs_well_with JSONB, -- Array of item IDs that pair well
    ADD COLUMN IF NOT EXISTS similar_items JSONB, -- Array of similar item IDs
    ADD COLUMN IF NOT EXISTS tags JSONB, -- Array of searchable tags
    ADD COLUMN IF NOT EXISTS promotion_start_date DATE, -- Promotion period start
    ADD COLUMN IF NOT EXISTS promotion_end_date DATE, -- Promotion period end
    ADD COLUMN IF NOT EXISTS promotion_price DECIMAL(10,2), -- Special promotional price
    ADD COLUMN IF NOT EXISTS video_url VARCHAR(500), -- Video showcase URL
    ADD COLUMN IF NOT EXISTS ar_model_url VARCHAR(500); -- AR visualization URL

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_badge ON menu_items(badge_text) WHERE badge_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_signature ON menu_items(signature_dish) WHERE signature_dish = TRUE;
CREATE INDEX IF NOT EXISTS idx_menu_items_best_seller ON menu_items(best_seller_rank) WHERE best_seller_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_rating ON menu_items(customer_rating) WHERE customer_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_promotion ON menu_items(promotion_start_date, promotion_end_date) WHERE promotion_start_date IS NOT NULL;

-- Update categories table for better organization
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50), -- Icon name or emoji for category
    ADD COLUMN IF NOT EXISTS color_theme VARCHAR(7), -- Hex color for category theme
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE, -- Featured categories
    ADD COLUMN IF NOT EXISTS display_style VARCHAR(50) DEFAULT 'grid', -- 'grid', 'list', 'carousel'
    ADD COLUMN IF NOT EXISTS hero_image VARCHAR(500), -- Large banner image for category
    ADD COLUMN IF NOT EXISTS description_ar TEXT, -- Arabic description
    ADD COLUMN IF NOT EXISTS meta_keywords TEXT, -- SEO keywords
    ADD COLUMN IF NOT EXISTS meta_description TEXT; -- SEO description

-- Create a table for menu item images gallery
CREATE TABLE IF NOT EXISTS menu_item_images (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    caption_ar VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for menu item reviews
CREATE TABLE IF NOT EXISTS menu_item_reviews (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customer_name VARCHAR(100),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for dietary certifications
CREATE TABLE IF NOT EXISTS dietary_certifications (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    certification_type VARCHAR(50) NOT NULL, -- 'halal', 'kosher', 'organic', etc.
    certifying_body VARCHAR(100),
    certificate_number VARCHAR(100),
    expiry_date DATE,
    certificate_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for preparation steps (for transparency)
CREATE TABLE IF NOT EXISTS preparation_steps (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT,
    image_url VARCHAR(500),
    time_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update settings table for enhanced features
ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS enable_reviews BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_ratings BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_nutritional_info BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_allergen_info BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_sustainability_info BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS enable_pairing_suggestions BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS enable_ar_preview BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS enable_video_preview BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS enable_loyalty_points BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS menu_layout VARCHAR(50) DEFAULT 'cards', -- 'cards', 'list', 'compact'
    ADD COLUMN IF NOT EXISTS card_style VARCHAR(50) DEFAULT 'modern', -- 'modern', 'classic', 'minimal'
    ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(50) DEFAULT 'elegant', -- 'elegant', 'vibrant', 'dark'
    ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS quick_view_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wishlist_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS social_sharing_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS whatsapp_ordering_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(50);

-- Add some default data for better UX
UPDATE categories 
SET icon = CASE 
    WHEN LOWER(name) LIKE '%appetizer%' THEN '🥗'
    WHEN LOWER(name) LIKE '%main%' THEN '🍽️'
    WHEN LOWER(name) LIKE '%dessert%' THEN '🍰'
    WHEN LOWER(name) LIKE '%beverage%' OR LOWER(name) LIKE '%drink%' THEN '🥤'
    WHEN LOWER(name) LIKE '%soup%' THEN '🍲'
    WHEN LOWER(name) LIKE '%salad%' THEN '🥗'
    WHEN LOWER(name) LIKE '%pizza%' THEN '🍕'
    WHEN LOWER(name) LIKE '%burger%' THEN '🍔'
    WHEN LOWER(name) LIKE '%pasta%' THEN '🍝'
    WHEN LOWER(name) LIKE '%seafood%' OR LOWER(name) LIKE '%fish%' THEN '🦐'
    WHEN LOWER(name) LIKE '%meat%' OR LOWER(name) LIKE '%steak%' THEN '🥩'
    WHEN LOWER(name) LIKE '%chicken%' THEN '🍗'
    WHEN LOWER(name) LIKE '%breakfast%' THEN '🍳'
    WHEN LOWER(name) LIKE '%coffee%' THEN '☕'
    ELSE '🍴'
END
WHERE icon IS NULL;

-- Set default color themes for categories
UPDATE categories 
SET color_theme = CASE 
    WHEN LOWER(name) LIKE '%appetizer%' THEN '#10B981'
    WHEN LOWER(name) LIKE '%main%' THEN '#3B82F6'
    WHEN LOWER(name) LIKE '%dessert%' THEN '#EC4899'
    WHEN LOWER(name) LIKE '%beverage%' OR LOWER(name) LIKE '%drink%' THEN '#F59E0B'
    ELSE '#6B7280'
END
WHERE color_theme IS NULL;

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_menu_item_images_item ON menu_item_images(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_reviews_item ON menu_item_reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dietary_certifications_item ON dietary_certifications(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_preparation_steps_item ON preparation_steps(menu_item_id);