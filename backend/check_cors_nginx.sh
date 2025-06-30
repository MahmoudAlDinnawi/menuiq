#!/bin/bash

echo "📋 Checking CORS Configuration for MenuIQ"
echo "========================================"

echo -e "\n1️⃣ Testing API endpoint directly (bypassing Nginx):"
curl -I http://localhost:8000/api/tenant/info \
  -H "Origin: https://entrecote.menuiq.io" \
  -H "Authorization: Bearer dummy-token" 2>/dev/null | grep -i "access-control"

echo -e "\n2️⃣ Testing API endpoint through Nginx:"
curl -I https://api.menuiq.io/api/tenant/info \
  -H "Origin: https://entrecote.menuiq.io" \
  -H "Authorization: Bearer dummy-token" 2>/dev/null | grep -i "access-control"

echo -e "\n3️⃣ Current Nginx configuration for api.menuiq.io:"
echo "Check if proxy_pass is preserving headers..."
grep -A 20 "server_name api.menuiq.io" /etc/nginx/sites-available/menuiq 2>/dev/null || echo "Config file not found"

echo -e "\n4️⃣ Recommended Nginx configuration fix:"
cat << 'EOF'

Add these lines to your api.menuiq.io server block in Nginx:

    location / {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

EOF

echo -e "\n5️⃣ After updating Nginx config, run:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"