#!/bin/bash
# Cleanup script for MenuIQ backend - PostgreSQL migration

echo "🧹 Starting cleanup of MySQL-related files..."

# Create backup directory for old files
mkdir -p old_mysql_files

# Move MySQL-specific files
echo "📦 Moving MySQL-specific files to backup..."
mv main_mysql.py old_mysql_files/ 2>/dev/null
mv database.py old_mysql_files/database_mysql.py 2>/dev/null
mv migrate_to_multitenant.py old_mysql_files/ 2>/dev/null
mv add_missing_columns.py old_mysql_files/ 2>/dev/null
mv add_nutrition_columns.py old_mysql_files/ 2>/dev/null
mv fix_categories_constraint.py old_mysql_files/ 2>/dev/null
mv fix_categories_final.py old_mysql_files/ 2>/dev/null
mv fix_settings_table.py old_mysql_files/ 2>/dev/null
mv init_database.py old_mysql_files/init_database_mysql.py 2>/dev/null

# Move temporary PostgreSQL setup files
echo "📦 Moving temporary PostgreSQL setup files..."
mv check_postgres.py old_mysql_files/ 2>/dev/null
mv create_tables_postgres.py old_mysql_files/ 2>/dev/null
mv init_postgres_simple.py old_mysql_files/ 2>/dev/null
mv update_models_postgres.py old_mysql_files/ 2>/dev/null

# Rename PostgreSQL files to be the main files
echo "✨ Renaming PostgreSQL files to main files..."
mv database_postgres.py database.py
mv main_postgres.py main.py
mv init_database_postgres.py init_database.py

# Clean up environment files
echo "🔧 Cleaning up environment files..."
rm -f .env.postgres 2>/dev/null
rm -f .env.production.postgres 2>/dev/null

# Update requirements.txt to remove MySQL dependency
echo "📝 Updating requirements.txt..."
sed -i '' '/pymysql/d' requirements.txt 2>/dev/null || sed -i '/pymysql/d' requirements.txt

# Create a clean project structure report
echo "📊 Current clean structure:"
echo "
Main Application Files:
- main.py (FastAPI application)
- database.py (PostgreSQL configuration)
- models_multitenant.py (SQLAlchemy models)
- pydantic_models.py (Request/Response models)
- auth.py (Authentication)

Route Files:
- public_routes.py
- system_admin_routes.py
- tenant_auth_routes.py

Utility Files:
- tenant_middleware.py
- init_database.py

Configuration:
- requirements.txt
- .env (development)
- .env.production (production)
"

echo "✅ Cleanup complete! Old files backed up to old_mysql_files/"
echo "⚠️  Remember to update any deployment scripts that reference main_mysql.py"