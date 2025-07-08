#!/usr/bin/env python3
"""
Debug script to test image upload functionality
"""
import os
from pathlib import Path

# Check current directory
print(f"Current working directory: {os.getcwd()}")

# Check if uploads directory exists
upload_dir = Path("uploads")
print(f"\nUploads directory exists: {upload_dir.exists()}")
print(f"Uploads directory is writable: {os.access(upload_dir, os.W_OK) if upload_dir.exists() else False}")

# List all subdirectories
if upload_dir.exists():
    print(f"\nSubdirectories in uploads:")
    for item in upload_dir.iterdir():
        if item.is_dir():
            print(f"  - {item.name} (writable: {os.access(item, os.W_OK)})")

# Check environment
print(f"\nEnvironment variables:")
print(f"  USER: {os.environ.get('USER', 'Not set')}")
print(f"  HOME: {os.environ.get('HOME', 'Not set')}")

# Test creating a file
test_file = upload_dir / "test_write.txt"
try:
    test_file.write_text("Test write successful")
    print(f"\n✅ Successfully wrote test file: {test_file}")
    test_file.unlink()  # Clean up
except Exception as e:
    print(f"\n❌ Failed to write test file: {e}")

# Check tenant directories
print(f"\n=== Checking tenant directories ===")
for i in range(1, 5):  # Check first 4 tenant IDs
    tenant_dir = upload_dir / f"tenant_{i}"
    if not tenant_dir.exists():
        print(f"Creating tenant_{i} directory...")
        try:
            tenant_dir.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created {tenant_dir}")
        except Exception as e:
            print(f"❌ Failed to create {tenant_dir}: {e}")
    else:
        print(f"✓ tenant_{i} exists (writable: {os.access(tenant_dir, os.W_OK)})")