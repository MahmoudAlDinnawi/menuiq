#!/usr/bin/env python3
"""
Test the upload endpoint to debug 422 error
"""
import requests
import os

# Test endpoints
BASE_URL = "http://localhost:8000"

print("🧪 Testing Upload Endpoint")
print("=" * 50)

# First, we need a valid auth token
# You'll need to login first to get this
print("\n1. First login to get a token:")
print("   Use your browser dev tools to get the auth token from localStorage")
print("   or run: curl -X POST http://localhost:8000/api/auth/login ...")

token = input("\nEnter your auth token (or press Enter to skip): ").strip()

if token:
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Test tenant info endpoint
    print("\n2. Testing /api/tenant/info endpoint:")
    response = requests.get(f"{BASE_URL}/api/tenant/info", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
    else:
        print(f"   Error: {response.text}")
    
    # Test upload endpoint with a small test file
    print("\n3. Testing /api/tenant/upload-logo endpoint:")
    
    # Create a small test image file
    test_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\xdac\xf8\x0f\x00\x00\x01\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {
        'file': ('test.png', test_image, 'image/png')
    }
    
    response = requests.post(f"{BASE_URL}/api/tenant/upload-logo", headers=headers, files=files)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    if response.status_code == 422:
        print("\n   422 Error Details:")
        error_detail = response.json()
        print(f"   {error_detail}")
else:
    print("\n⚠️  No token provided. Please get a valid auth token first.")
    print("\nTo get a token, you can:")
    print("1. Login via the web interface and check localStorage")
    print("2. Or use curl:")
    print('   curl -X POST https://api.menuiq.io/api/auth/login \\')
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"username": "your-username", "password": "your-password"}\'')

print("\n4. Common 422 error causes:")
print("   - Missing required fields in multipart form")
print("   - File validation failing (type, size)")
print("   - Authentication issues")
print("   - CORS preflight failing")