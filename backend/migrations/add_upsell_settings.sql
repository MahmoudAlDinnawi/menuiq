-- Add upsell default settings to settings table
-- These fields allow restaurants to configure default upsell styles

-- Add upsell configuration fields
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_style VARCHAR(50) DEFAULT 'premium';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_border_color VARCHAR(7) DEFAULT '#FFD700';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_background_color VARCHAR(7) DEFAULT '#FFF8DC';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_badge_color VARCHAR(7) DEFAULT '#FF6B6B';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_animation VARCHAR(50) DEFAULT 'pulse';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upsell_default_icon VARCHAR(50) DEFAULT 'star';