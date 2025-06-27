"""
Migration script to convert single-tenant to multi-tenant architecture
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import bcrypt

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost/menuiq")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def run_migration():
    """Run the migration to add multi-tenant support"""
    session = Session()
    
    try:
        print("Starting multi-tenant migration...")
        
        # 1. Create tenants table
        print("Creating tenants table...")
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subdomain VARCHAR(100) UNIQUE NOT NULL,
                domain VARCHAR(255),
                logo_url VARCHAR(500),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                address TEXT,
                plan VARCHAR(50) DEFAULT 'free',
                status VARCHAR(50) DEFAULT 'active',
                trial_ends_at DATETIME,
                subscription_ends_at DATETIME,
                max_menu_items INT DEFAULT 50,
                max_categories INT DEFAULT 10,
                custom_domain_enabled BOOLEAN DEFAULT FALSE,
                analytics_enabled BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subdomain (subdomain)
            )
        """))
        
        # 2. Create system_admins table
        print("Creating system_admins table...")
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS system_admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_super_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                INDEX idx_email (email)
            )
        """))
        
        # 3. Create users table
        print("Creating users table...")
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                INDEX idx_email (email),
                INDEX idx_tenant (tenant_id)
            )
        """))
        
        # 4. Add tenant_id to existing tables
        tables_to_update = ['categories', 'menu_items', 'settings', 'allergen_icons']
        
        for table in tables_to_update:
            print(f"Adding tenant_id to {table} table...")
            try:
                session.execute(text(f"ALTER TABLE {table} ADD COLUMN tenant_id INT"))
                session.execute(text(f"ALTER TABLE {table} ADD INDEX idx_tenant (tenant_id)"))
            except Exception as e:
                print(f"Column might already exist in {table}: {e}")
        
        # 5. Create default tenant (Entrecote)
        print("Creating default tenant for Entrecote...")
        session.execute(text("""
            INSERT INTO tenants (name, subdomain, contact_email, plan, status, max_menu_items, max_categories)
            VALUES ('Entrecôte Café de Paris', 'entrecote', 'info@entrecote.sa', 'premium', 'active', 1000, 50)
        """))
        
        # Get the tenant ID
        result = session.execute(text("SELECT LAST_INSERT_ID()"))
        tenant_id = result.scalar()
        
        # 6. Update existing data with tenant_id
        print("Updating existing data with tenant_id...")
        for table in tables_to_update:
            session.execute(text(f"UPDATE {table} SET tenant_id = :tenant_id WHERE tenant_id IS NULL"), {"tenant_id": tenant_id})
        
        # 7. Make tenant_id NOT NULL after updating
        for table in tables_to_update:
            print(f"Making tenant_id NOT NULL in {table}...")
            try:
                session.execute(text(f"ALTER TABLE {table} MODIFY tenant_id INT NOT NULL"))
                session.execute(text(f"ALTER TABLE {table} ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE"))
            except Exception as e:
                print(f"Error updating {table}: {e}")
        
        # 8. Create default system admin
        print("Creating default system admin...")
        admin_password = hash_password("admin123")  # Change this!
        session.execute(text("""
            INSERT INTO system_admins (email, username, password_hash, is_super_admin)
            VALUES ('admin@menuiq.io', 'admin', :password, TRUE)
        """), {"password": admin_password})
        
        # 9. Create default user for Entrecote
        print("Creating default user for Entrecote...")
        user_password = hash_password("entrecote123")  # Change this!
        session.execute(text("""
            INSERT INTO users (tenant_id, email, username, password_hash, role)
            VALUES (:tenant_id, 'admin@entrecote.sa', 'entrecote_admin', :password, 'admin')
        """), {"tenant_id": tenant_id, "password": user_password})
        
        # 10. Create activity_logs table
        print("Creating activity_logs table...")
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT,
                user_id INT,
                admin_id INT,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50),
                entity_id INT,
                details JSON,
                ip_address VARCHAR(45),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (admin_id) REFERENCES system_admins(id) ON DELETE SET NULL,
                INDEX idx_created (created_at),
                INDEX idx_tenant (tenant_id)
            )
        """))
        
        session.commit()
        print("Migration completed successfully!")
        
        print("\n=== IMPORTANT ===")
        print("Default System Admin Credentials:")
        print("Email: admin@menuiq.io")
        print("Password: admin123")
        print("\nDefault Entrecote Admin Credentials:")
        print("Email: admin@entrecote.sa")
        print("Password: entrecote123")
        print("\nPLEASE CHANGE THESE PASSWORDS IMMEDIATELY!")
        
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    run_migration()