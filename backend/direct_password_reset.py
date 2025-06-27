#!/usr/bin/env python3
"""Direct password reset using PostgreSQL"""

import psycopg2
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="menuiq_production",
    user="menuiq",
    password="Mahmoud.10"
)
cur = conn.cursor()

# Find the tenant
cur.execute("SELECT id, name FROM tenants WHERE subdomain = %s", ('entrecote',))
tenant = cur.fetchone()

if not tenant:
    print("❌ Tenant 'entrecote' not found!")
    conn.close()
    exit(1)

tenant_id, tenant_name = tenant
print(f"✅ Found tenant: {tenant_name} (ID: {tenant_id})")

# Find or create the user
cur.execute(
    "SELECT id, email, username FROM users WHERE email = %s AND tenant_id = %s",
    ('mahmoud.d@tawabel.com', tenant_id)
)
user = cur.fetchone()

new_password = "admin123"
password_hash = pwd_context.hash(new_password)

if user:
    user_id, email, username = user
    print(f"✅ Found user: {email} ({username})")
    
    # Update password
    cur.execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (password_hash, user_id)
    )
    print("✅ Password updated!")
else:
    print("❌ User not found, creating new user...")
    
    # Create user
    cur.execute(
        """INSERT INTO users (email, username, password_hash, tenant_id, role, is_active, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())""",
        ('mahmoud.d@tawabel.com', 'Mahmoud', password_hash, tenant_id, 'admin', True)
    )
    print("✅ User created!")

# Commit changes
conn.commit()
cur.close()
conn.close()

print("\n✅ Success! You can now login with:")
print(f"  Email: mahmoud.d@tawabel.com")
print(f"  Password: {new_password}")
print(f"  URL: https://entrecote.menuiq.io/login")