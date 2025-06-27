#!/usr/bin/env python3
"""Direct password reset using PostgreSQL - Fixed version"""

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

# First, let's see what columns the users table has
cur.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
""")
print("Users table columns:")
for col in cur.fetchall():
    print(f"  - {col[0]}")

# Find the tenant
cur.execute("SELECT id, name FROM tenants WHERE subdomain = %s", ('entrecote',))
tenant = cur.fetchone()

if not tenant:
    print("❌ Tenant 'entrecote' not found!")
    conn.close()
    exit(1)

tenant_id, tenant_name = tenant
print(f"\n✅ Found tenant: {tenant_name} (ID: {tenant_id})")

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
    
    # Create user with only the columns that exist
    cur.execute(
        """INSERT INTO users (email, username, password_hash, tenant_id, role, is_active, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, NOW())
           RETURNING id""",
        ('mahmoud.d@tawabel.com', 'Mahmoud', password_hash, tenant_id, 'admin', True)
    )
    user_id = cur.fetchone()[0]
    print(f"✅ User created with ID: {user_id}")

# Commit changes
conn.commit()

# Verify the user was created/updated
cur.execute(
    "SELECT email, username, role, is_active FROM users WHERE id = %s",
    (user_id if not user else user[0],)
)
result = cur.fetchone()
print(f"\nUser details: {result}")

cur.close()
conn.close()

print("\n✅ Success! You can now login with:")
print(f"  Email: mahmoud.d@tawabel.com")
print(f"  Password: {new_password}")
print(f"  URL: https://entrecote.menuiq.io/login")