-- Add missing performance indexes for MenuIQ backend
-- These indexes will significantly improve query performance

-- Index for parent_item_id to speed up sub-item queries
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_item 
ON menu_items(parent_item_id) 
WHERE parent_item_id IS NOT NULL;

-- Composite index for promotion date filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_promotion_dates 
ON menu_items(tenant_id, promotion_start_date, promotion_end_date)
WHERE promotion_start_date IS NOT NULL OR promotion_end_date IS NOT NULL;

-- Index for multi-item filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_multi_item 
ON menu_items(tenant_id, is_multi_item) 
WHERE is_multi_item = TRUE;

-- Index for featured items
CREATE INDEX IF NOT EXISTS idx_menu_items_featured 
ON menu_items(tenant_id, is_featured) 
WHERE is_featured = TRUE;

-- Index for signature dishes
CREATE INDEX IF NOT EXISTS idx_menu_items_signature 
ON menu_items(tenant_id, signature_dish) 
WHERE signature_dish = TRUE;

-- Index for upsell items
CREATE INDEX IF NOT EXISTS idx_menu_items_upsell 
ON menu_items(tenant_id, is_upsell) 
WHERE is_upsell = TRUE;

-- Composite index for analytics queries by date range
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_date_range 
ON analytics_sessions(tenant_id, created_at, session_started_at);

-- Index for analytics daily aggregations
CREATE INDEX IF NOT EXISTS idx_analytics_daily_lookup 
ON analytics_daily(tenant_id, date, metric_type);

-- Index for device type analytics
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_device 
ON analytics_sessions(tenant_id, device_type)
WHERE device_type IS NOT NULL;

-- Index for allergen lookups
CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_lookup 
ON menu_item_allergens(allergen_id, menu_item_id);

-- Performance note: These indexes will increase write time slightly but dramatically improve read performance
-- Estimated storage overhead: ~50-100MB depending on data volume