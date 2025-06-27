#!/usr/bin/env python3
"""Check database state"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
env_file = '.env' if os.getenv('ENVIRONMENT') != 'production' else '.env.production'
load_dotenv(env_file)

# Import models
from models_multitenant import SystemAdmin, Tenant, User

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create session
Session = sessionmaker(bind=engine)
session = Session()

print("\n=== System Admins ===")
admins = session.query(SystemAdmin).all()
for admin in admins:
    print(f"ID: {admin.id}, Email: {admin.email}, Username: {admin.username}, Active: {admin.is_active}")

print("\n=== Tenants ===")
tenants = session.query(Tenant).all()
for tenant in tenants:
    print(f"ID: {tenant.id}, Name: {tenant.name}, Subdomain: {tenant.subdomain}, Status: {tenant.status}")

print("\n=== Users ===")
users = session.query(User).all()
for user in users:
    print(f"ID: {user.id}, Email: {user.email}, Tenant ID: {user.tenant_id}, Role: {user.role}, Active: {user.is_active}")

session.close()