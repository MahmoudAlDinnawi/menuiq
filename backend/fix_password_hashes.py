#!/usr/bin/env python3
"""Fix password hashes for existing users"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from auth import get_password_hash

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Import models
from models_multitenant import User, SystemAdmin

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create session
Session = sessionmaker(bind=engine)
session = Session()

def fix_user_password(email, new_password, tenant_id=None):
    """Fix password for a specific user"""
    if tenant_id:
        user = session.query(User).filter(
            User.email == email,
            User.tenant_id == tenant_id
        ).first()
    else:
        user = session.query(User).filter(User.email == email).first()
    
    if not user:
        print(f"❌ User {email} not found")
        return False
    
    # Update password hash
    user.password_hash = get_password_hash(new_password)
    session.commit()
    print(f"✅ Updated password for {email}")
    return True

def fix_admin_password(email, new_password):
    """Fix password for system admin"""
    admin = session.query(SystemAdmin).filter(SystemAdmin.email == email).first()
    
    if not admin:
        print(f"❌ Admin {email} not found")
        return False
    
    # Update password hash
    admin.password_hash = get_password_hash(new_password)
    session.commit()
    print(f"✅ Updated password for admin {email}")
    return True

if __name__ == "__main__":
    print("Password Hash Fixer")
    print("=" * 40)
    
    # Fix common accounts if no arguments provided
    if len(sys.argv) == 1:
        print("\nFixing default accounts...")
        fix_admin_password("admin@menuiq.io", "admin123")
        fix_user_password("demo@restaurant.com", "demo123")
        print("\nTo fix a specific user: python fix_password_hashes.py <email> <new_password> [tenant_id]")
    
    # Fix specific user
    elif len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
        tenant_id = int(sys.argv[3]) if len(sys.argv) > 3 else None
        
        if "@menuiq.io" in email and not tenant_id:
            fix_admin_password(email, password)
        else:
            fix_user_password(email, password, tenant_id)
    
    else:
        print("Usage:")
        print("  python fix_password_hashes.py                              # Fix default accounts")
        print("  python fix_password_hashes.py <email> <new_password>       # Fix specific user")
        print("  python fix_password_hashes.py <email> <new_password> <tenant_id>  # Fix tenant user")
    
    session.close()