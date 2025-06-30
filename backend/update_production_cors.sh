#!/bin/bash

echo "🔧 Updating CORS Configuration for Production..."

# Add ALLOWED_ORIGINS to .env file if not present
if ! grep -q "ALLOWED_ORIGINS" .env; then
    echo "" >> .env
    echo "# CORS Configuration" >> .env
    echo "ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://menuiq.io,https://app.menuiq.io,https://*.menuiq.io" >> .env
    echo "✅ Added ALLOWED_ORIGINS to .env"
else
    echo "⚠️  ALLOWED_ORIGINS already exists in .env"
    echo "Current value:"
    grep "ALLOWED_ORIGINS" .env
fi

echo ""
echo "📝 CORS Configuration:"
echo "  - Allows all *.menuiq.io subdomains"
echo "  - Allows localhost for development"
echo "  - Uses regex pattern for flexible subdomain matching"
echo ""
echo "🚀 After pulling this code on production:"
echo "  1. Run: source venv/bin/activate"
echo "  2. Restart: sudo systemctl restart menuiq"
echo ""
echo "✅ CORS should now work for https://entrecote.menuiq.io"