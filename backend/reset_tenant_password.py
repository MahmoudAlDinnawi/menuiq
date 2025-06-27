#!/usr/bin/env python3
"""Reset password for a tenant user"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from auth import get_password_hash

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Import models
from models_multitenant import User, Tenant

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create session
Session = sessionmaker(bind=engine)
session = Session()

# Find the entrecote tenant
tenant = session.query(Tenant).filter(Tenant.subdomain == "entrecote").first()
if not tenant:
    print("Tenant 'entrecote' not found!")
    exit(1)

print(f"Found tenant: {tenant.name} (ID: {tenant.id})")

# Find the user
user = session.query(User).filter(
    User.email == "mahmoud.d@tawabel.com",
    User.tenant_id == tenant.id
).first()

if not user:
    print("User not found! Creating new user...")
    user = User(
        email="mahmoud.d@tawabel.com",
        username="Mahmoud",
        tenant_id=tenant.id,
        role="admin",
        is_active=True,
        password_hash=get_password_hash("admin123")
    )
    session.add(user)
    session.commit()
    print("✅ User created successfully!")
else:
    print(f"Found user: {user.email}")
    # Reset password
    user.password_hash = get_password_hash("admin123")
    session.commit()
    print("✅ Password reset to: admin123")

session.close()
print("\nYou can now login with:")
print(f"  Email: mahmoud.d@tawabel.com")
print(f"  Password: admin123")
print(f"  URL: https://entrecote.menuiq.io/login")