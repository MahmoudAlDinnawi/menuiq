#!/bin/bash
# PostgreSQL Database Setup Script

echo "🚀 Setting up PostgreSQL database for MenuIQ..."

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE menuiq_production;

-- Create user with password
CREATE USER menuiq WITH PASSWORD 'menuiq_prod_2024';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE menuiq_production TO menuiq;

-- Grant schema permissions (important for PostgreSQL 15+)
\c menuiq_production
GRANT ALL ON SCHEMA public TO menuiq;

-- Show created databases and users
\l
\du
EOF

echo "✅ Database setup complete!"
echo "📝 Database: menuiq_production"
echo "📝 User: menuiq"
echo "📝 Password: menuiq_prod_2024 (change this in production!)"