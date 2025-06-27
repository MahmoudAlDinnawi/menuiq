#!/usr/bin/env python3
"""Debug tenant login issues"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Import models
from models_multitenant import Tenant, User
from auth import verify_password, get_password_hash

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create session
Session = sessionmaker(bind=engine)
session = Session()

def debug_tenant_login(email, password, subdomain):
    print(f"\n=== Debugging login for {email} on {subdomain} ===\n")
    
    # 1. Check if tenant exists
    tenant = session.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        print(f"❌ Tenant with subdomain '{subdomain}' NOT FOUND")
        print("\nAvailable tenants:")
        all_tenants = session.query(Tenant).all()
        for t in all_tenants:
            print(f"  - {t.subdomain} ({t.name})")
        return
    
    print(f"✅ Tenant found: {tenant.name} (ID: {tenant.id}, Status: {tenant.status})")
    
    # 2. Check if user exists
    user = session.query(User).filter(
        User.email == email,
        User.tenant_id == tenant.id
    ).first()
    
    if not user:
        print(f"\n❌ User with email '{email}' NOT FOUND for tenant '{subdomain}'")
        print("\nUsers for this tenant:")
        tenant_users = session.query(User).filter(User.tenant_id == tenant.id).all()
        for u in tenant_users:
            print(f"  - {u.email} (Role: {u.role}, Active: {u.is_active})")
        return
    
    print(f"\n✅ User found: {user.email}")
    print(f"   - ID: {user.id}")
    print(f"   - Username: {user.username}")
    print(f"   - Role: {user.role}")
    print(f"   - Active: {user.is_active}")
    print(f"   - Password hash: {user.password_hash[:20]}...")
    
    # 3. Verify password
    if verify_password(password, user.password_hash):
        print(f"\n✅ Password is CORRECT")
    else:
        print(f"\n❌ Password is INCORRECT")
        
        # Try to hash the password and compare
        new_hash = get_password_hash(password)
        print(f"\nDebug info:")
        print(f"  - Provided password: {password}")
        print(f"  - New hash would be: {new_hash[:20]}...")
        print(f"  - Stored hash:       {user.password_hash[:20]}...")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python debug_tenant_login.py <email> <password> <subdomain>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    subdomain = sys.argv[3]
    
    debug_tenant_login(email, password, subdomain)
    
    session.close()