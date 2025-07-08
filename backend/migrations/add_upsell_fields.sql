-- Add upsell design fields to menu_items table
-- These fields allow restaurants to highlight specific items for upselling

-- Add upsell flag
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_upsell BOOLEAN DEFAULT FALSE;

-- Add upsell style (standard, premium, deluxe, special)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_style VARCHAR(50) DEFAULT 'standard';

-- Add upsell design customization fields
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_border_color VARCHAR(7);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_background_color VARCHAR(7);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_badge_text VARCHAR(50);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_badge_color VARCHAR(7);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_animation VARCHAR(50);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_icon VARCHAR(50);

-- Add index for faster queries on upsell items
CREATE INDEX IF NOT EXISTS idx_menu_items_upsell ON menu_items(tenant_id, is_upsell) WHERE is_upsell = TRUE;

-- Update some sample items to demonstrate upsell feature (optional)
-- UPDATE menu_items 
-- SET is_upsell = TRUE,
--     upsell_style = 'premium',
--     upsell_border_color = '#FFD700',
--     upsell_background_color = '#FFF8DC',
--     upsell_badge_text = 'Chef''s Special',
--     upsell_badge_color = '#FF6B6B',
--     upsell_animation = 'pulse',
--     upsell_icon = 'star'
-- WHERE name IN ('Ribeye Steak', 'Grilled Salmon')
-- AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'demo' LIMIT 1);