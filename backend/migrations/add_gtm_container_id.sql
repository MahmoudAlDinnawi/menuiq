-- Add Google Tag Manager container ID to settings table
-- This allows each tenant to have their own GTM configuration

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS gtm_container_id VARCHAR(50);

-- Add GTM container ID for Entrecote tenant
UPDATE settings 
SET gtm_container_id = 'GTM-5K5NF88F'
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'entrecote');