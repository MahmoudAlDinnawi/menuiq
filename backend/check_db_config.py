#!/usr/bin/env python3
"""
Check database configuration
"""
import os
from dotenv import load_dotenv

# Check both env files
for env_file in ['.env', '.env.production']:
    if os.path.exists(env_file):
        print(f"\n📋 Checking {env_file}:")
        load_dotenv(env_file, override=True)
        
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            print(f"   DATABASE_URL: {db_url}")
            # Parse the URL to show components (hide password)
            if '@' in db_url:
                parts = db_url.split('@')
                creds = parts[0].split('://')[-1]
                user = creds.split(':')[0] if ':' in creds else creds
                host_db = parts[1]
                print(f"   User: {user}")
                print(f"   Host/DB: {host_db}")
        else:
            print("   ❌ DATABASE_URL not found!")
            
        # Check individual components
        db_name = os.getenv('DB_NAME')
        db_user = os.getenv('DB_USER')
        db_host = os.getenv('DB_HOST')
        
        if db_name or db_user or db_host:
            print(f"   Alternative config:")
            print(f"   DB_NAME: {db_name}")
            print(f"   DB_USER: {db_user}")
            print(f"   DB_HOST: {db_host}")

print("\n💡 To check your actual PostgreSQL databases, run:")
print("   sudo -u postgres psql -l")