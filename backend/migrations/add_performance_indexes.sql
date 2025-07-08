-- Performance optimization indexes for MenuIQ
-- These indexes will significantly improve query performance

-- Menu Items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_category ON menu_items(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_available ON menu_items(tenant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_featured ON menu_items(tenant_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_upsell ON menu_items(tenant_id, is_upsell) WHERE is_upsell = TRUE;

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_tenant_active ON categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_tenant_started ON analytics_sessions(tenant_id, started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_tenant_timestamp ON analytics_page_views(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_item_clicks_tenant_timestamp ON analytics_item_clicks(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_tenant_date ON analytics_daily(tenant_id, date);

-- Settings index
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id);