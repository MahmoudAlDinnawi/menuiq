#!/usr/bin/env python3
"""Create a user for an existing tenant"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from auth import get_password_hash

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Import models
from models_final import Tenant, User

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create session
Session = sessionmaker(bind=engine)
session = Session()

def create_tenant_user(subdomain, email, password, username=None, role="admin"):
    """Create a user for a specific tenant"""
    
    # Find tenant
    tenant = session.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        print(f"❌ Tenant with subdomain '{subdomain}' not found!")
        return False
    
    print(f"✅ Found tenant: {tenant.name} (ID: {tenant.id})")
    
    # Check if user already exists
    existing_user = session.query(User).filter(
        User.email == email,
        User.tenant_id == tenant.id
    ).first()
    
    if existing_user:
        print(f"❌ User {email} already exists for this tenant!")
        return False
    
    # Create password hash
    password_hash = get_password_hash(password)
    
    # Try to create user
    try:
        # First try with ORM
        user = User(
            tenant_id=tenant.id,
            email=email,
            username=username or email.split('@')[0],
            password_hash=password_hash,
            role=role,
            is_active=True
        )
        session.add(user)
        session.commit()
        print(f"✅ User created successfully via ORM!")
        return True
    except Exception as e:
        session.rollback()
        print(f"⚠️  ORM creation failed: {str(e)}")
        
        # Try direct SQL
        try:
            session.execute(
                text("""
                    INSERT INTO users (tenant_id, email, username, password_hash, role, is_active)
                    VALUES (:tenant_id, :email, :username, :password_hash, :role, :is_active)
                """),
                {
                    "tenant_id": tenant.id,
                    "email": email,
                    "username": username or email.split('@')[0],
                    "password_hash": password_hash,
                    "role": role,
                    "is_active": True
                }
            )
            session.commit()
            print(f"✅ User created successfully via direct SQL!")
            return True
        except Exception as e2:
            session.rollback()
            print(f"❌ SQL creation also failed: {str(e2)}")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python create_tenant_user.py <subdomain> <email> <password> [username] [role]")
        print("\nExample:")
        print("  python create_tenant_user.py entrecote admin@entrecote.com admin123")
        print("  python create_tenant_user.py entrecote admin@entrecote.com admin123 'Admin User' admin")
        sys.exit(1)
    
    subdomain = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    username = sys.argv[4] if len(sys.argv) > 4 else None
    role = sys.argv[5] if len(sys.argv) > 5 else "admin"
    
    success = create_tenant_user(subdomain, email, password, username, role)
    
    if success:
        print(f"\n✅ You can now login at: https://{subdomain}.menuiq.io/login")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
    
    session.close()