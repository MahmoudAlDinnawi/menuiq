#\!/bin/bash

echo "Checking build assets..."
echo ""

# Check if build directory exists
if [ \! -d "build" ]; then
    echo "❌ Build directory not found. Run 'npm run build' first."
    exit 1
fi

echo "✅ Build directory exists"
echo ""

# Check for static/media directory
if [ -d "build/static/media" ]; then
    echo "✅ Static media directory exists"
    echo ""
    echo "Assets found in build/static/media:"
    ls -la build/static/media/
else
    echo "❌ Static media directory not found"
fi

echo ""

# Check for logo.png
if [ -f "build/logo.png" ]; then
    echo "✅ logo.png found in build root"
else
    echo "❌ logo.png not found in build root"
fi

echo ""
echo "Build size summary:"
du -sh build/
EOF < /dev/null