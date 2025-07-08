# Database Migration Guide

## Overview

This project now uses Alembic for database migrations, providing version control for your database schema. This ensures that database changes can be tracked, applied consistently across environments, and rolled back if needed.

## Migration System Setup

The migration system has been configured with:
- **Alembic 1.13.0** for migration management
- Automatic schema detection from SQLAlchemy models
- Environment-based database configuration
- Support for both online and offline migrations

## Directory Structure

```
backend/
├── alembic/                    # Alembic configuration directory
│   ├── versions/              # Migration files
│   ├── env.py                 # Environment configuration
│   ├── script.py.mako         # Migration template
│   └── README                 # Alembic README
├── alembic.ini                # Alembic configuration file
└── migrations/                # Legacy migration files (kept for reference)
```

## Common Migration Commands

### 1. Create a New Migration

#### Automatic Migration (Recommended)
Detects changes in your models and generates migration automatically:
```bash
source venv/bin/activate
alembic revision --autogenerate -m "Description of changes"
```

#### Manual Migration
For custom SQL or complex changes:
```bash
source venv/bin/activate
alembic revision -m "Description of changes"
```

### 2. Apply Migrations

#### Upgrade to Latest
```bash
source venv/bin/activate
alembic upgrade head
```

#### Upgrade to Specific Version
```bash
source venv/bin/activate
alembic upgrade <revision_id>
```

### 3. Rollback Migrations

#### Downgrade One Version
```bash
source venv/bin/activate
alembic downgrade -1
```

#### Downgrade to Specific Version
```bash
source venv/bin/activate
alembic downgrade <revision_id>
```

### 4. View Migration Status

#### Current Version
```bash
source venv/bin/activate
alembic current
```

#### Migration History
```bash
source venv/bin/activate
alembic history
```

## Workflow Example

### Adding a New Feature to the Database

1. **Modify your models** in `models.py`:
```python
# Example: Add a new field to MenuItem
class MenuItem(Base):
    # ... existing fields ...
    featured = Column(Boolean, default=False)  # New field
```

2. **Generate migration**:
```bash
source venv/bin/activate
alembic revision --autogenerate -m "Add featured field to menu items"
```

3. **Review the generated migration** in `alembic/versions/`:
- Check the upgrade() and downgrade() functions
- Ensure the changes match your intentions
- Add any custom SQL if needed

4. **Apply the migration**:
```bash
alembic upgrade head
```

### Handling Data Migrations

For migrations that need to modify existing data:

1. Create a manual migration:
```bash
alembic revision -m "Populate featured field for existing items"
```

2. Edit the migration file:
```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add column
    op.add_column('menu_items', 
        sa.Column('featured', sa.Boolean(), nullable=True))
    
    # Update existing data
    op.execute("UPDATE menu_items SET featured = false WHERE featured IS NULL")
    
    # Make column non-nullable
    op.alter_column('menu_items', 'featured', nullable=False)

def downgrade():
    op.drop_column('menu_items', 'featured')
```

## Best Practices

### 1. Always Review Generated Migrations
- Check the generated SQL before applying
- Ensure indexes and constraints are correct
- Verify foreign key relationships

### 2. Test Migrations
```bash
# Test upgrade
alembic upgrade head

# Test downgrade
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### 3. Backup Before Major Migrations
```bash
pg_dump -U postgres menuiq > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Handle Migration Conflicts
When working in a team:
- Always pull latest changes before creating migrations
- If conflicts occur, resolve by:
  - Downgrading to common ancestor
  - Pulling changes
  - Re-generating your migration

## Environment-Specific Configurations

### Development
```bash
# Uses DATABASE_URL from .env
source venv/bin/activate
alembic upgrade head
```

### Production
```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@prod-server/menuiq"
alembic upgrade head
```

### Offline Migrations (Generate SQL)
```bash
# Generate SQL without connecting to database
alembic upgrade head --sql > migration.sql
```

## Troubleshooting

### Migration Already Applied Error
```bash
# Check current version
alembic current

# Force stamp if needed (use carefully!)
alembic stamp <revision_id>
```

### Connection Issues
- Verify DATABASE_URL in .env
- Check PostgreSQL is running
- Ensure database exists

### Model Import Errors
- Ensure all models are imported in `models.py`
- Check for circular imports
- Verify PYTHONPATH includes backend directory

## Migration Naming Conventions

Use descriptive names for migrations:
- ✅ `add_featured_field_to_menu_items`
- ✅ `create_customer_reviews_table`
- ✅ `add_index_on_tenant_subdomain`
- ❌ `update_db`
- ❌ `fix_stuff`

## Safety Checklist

Before applying migrations in production:

- [ ] Backup the database
- [ ] Test migration on staging environment
- [ ] Review migration SQL
- [ ] Verify rollback procedure
- [ ] Plan for downtime (if needed)
- [ ] Notify team members

## Useful Alembic Commands Reference

```bash
# Initialize Alembic (already done)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "message"

# Apply all migrations
alembic upgrade head

# Rollback all migrations
alembic downgrade base

# Show current version
alembic current

# Show history
alembic history --verbose

# Generate SQL
alembic upgrade head --sql

# Mark database as up-to-date
alembic stamp head

# Compare database with models
alembic check
```

## Legacy Migration Reference

The old migration files in `migrations/` directory are preserved for reference. These have been incorporated into the initial Alembic migration. Do not run these manually anymore - use Alembic instead.

---

Remember: **Always backup your database before running migrations in production!**