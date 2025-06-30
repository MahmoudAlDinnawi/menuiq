#!/usr/bin/env python3
"""
Check tenant info endpoint for errors
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment
load_dotenv('.env')

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found")
    exit(1)

print("🔍 Checking tenant info endpoint issues...")

# Create engine
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if tenants have required fields
    print("\n1. Checking tenant table structure:")
    result = conn.execute(text("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        AND column_name IN ('subscription_status', 'subscription_plan')
        ORDER BY column_name
    """))
    
    columns = result.fetchall()
    if not columns:
        print("   ⚠️  Missing columns: subscription_status and/or subscription_plan")
        print("   These fields are referenced in tenant_routes.py line 1004-1005")
    else:
        for col in columns:
            print(f"   ✅ {col[0]}: {col[1]} (nullable: {col[2]})")
    
    # Check a sample tenant
    print("\n2. Checking sample tenant data:")
    result = conn.execute(text("""
        SELECT id, name, subdomain, status,
               CASE WHEN logo_url IS NOT NULL THEN 'has logo' ELSE 'no logo' END as logo_status
        FROM tenants 
        LIMIT 1
    """))
    
    tenant = result.fetchone()
    if tenant:
        print(f"   Tenant: {tenant[1]} ({tenant[2]}.menuiq.io)")
        print(f"   Status: {tenant[3]}")
        print(f"   Logo: {tenant[4]}")
    
    # Check uploads directory
    print("\n3. Checking uploads directory:")
    uploads_path = "uploads/logos"
    if os.path.exists(uploads_path):
        print(f"   ✅ {uploads_path} exists")
        print(f"   Permissions: {oct(os.stat(uploads_path).st_mode)[-3:]}")
    else:
        print(f"   ❌ {uploads_path} does not exist")

print("\n💡 If subscription_status/subscription_plan columns are missing, run this SQL:")
print("   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);")
print("   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);")