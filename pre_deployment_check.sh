#!/bin/bash

# Pre-deployment Checklist Script
# Run this before deploying to production to ensure everything is ready

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_check() {
    echo -e "${GREEN}✓${NC} $1"
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

echo "=========================================="
echo "MenuIQ Pre-Deployment Checklist"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Backend .env file exists
echo "Checking environment files..."
if [ -f "backend/.env" ]; then
    print_check "Backend .env file exists"
    
    # Check for required variables
    REQUIRED_VARS=("DATABASE_URL" "SECRET_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" backend/.env; then
            print_check "  ${var} is set"
        else
            print_fail "  ${var} is missing!"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    print_fail "Backend .env file missing!"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: No debug print/console.log statements
echo ""
echo "Checking for debug statements..."
DEBUG_COUNT=$(grep -r "console\.log\|print(" backend/ --include="*.py" --include="*.js" 2>/dev/null | grep -v "^Binary" | wc -l || echo "0")
if [ "$DEBUG_COUNT" -eq "0" ]; then
    print_check "No debug statements found"
else
    print_warning "Found $DEBUG_COUNT debug statements (already cleaned in latest version)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Requirements.txt exists
echo ""
echo "Checking dependencies..."
if [ -f "backend/requirements.txt" ]; then
    print_check "requirements.txt exists"
else
    print_fail "requirements.txt missing!"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Alembic migrations
echo ""
echo "Checking database migrations..."
if [ -d "backend/alembic/versions" ]; then
    MIGRATION_COUNT=$(ls backend/alembic/versions/*.py 2>/dev/null | grep -v __pycache__ | wc -l)
    if [ "$MIGRATION_COUNT" -gt "0" ]; then
        print_check "Found $MIGRATION_COUNT migration files"
    else
        print_fail "No migration files found!"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_fail "Alembic migrations directory missing!"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: No test files
echo ""
echo "Checking for test files..."
TEST_COUNT=$(find backend/ -name "test_*.py" -o -name "*.test.js" 2>/dev/null | wc -l)
if [ "$TEST_COUNT" -eq "0" ]; then
    print_check "No test files found (good for production)"
else
    print_fail "Found $TEST_COUNT test files that should be removed"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Git status
echo ""
echo "Checking Git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq "0" ]; then
        print_check "All changes committed"
    else
        print_warning "You have $UNCOMMITTED uncommitted changes"
        WARNINGS=$((WARNINGS + 1))
        echo "  Consider committing all changes before deployment"
    fi
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_check "Current branch: $CURRENT_BRANCH"
else
    print_warning "Not a git repository"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 7: Python version
echo ""
echo "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_check "Python version: $PYTHON_VERSION"
else
    print_fail "Python3 not found!"
    ERRORS=$((ERRORS + 1))
fi

# Check 8: File permissions
echo ""
echo "Checking file permissions..."
if [ -x "deploy_to_production.sh" ]; then
    print_check "Deployment script is executable"
else
    print_warning "Deployment script is not executable"
    echo "  Run: chmod +x deploy_to_production.sh"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 9: Server connectivity
echo ""
echo "Checking server connectivity..."
SERVER_IP="37.27.183.157"
if ping -c 1 -W 2 $SERVER_IP > /dev/null 2>&1; then
    print_check "Server is reachable"
else
    print_warning "Cannot ping server (might be blocked)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 10: Local database for testing
echo ""
echo "Checking local testing capabilities..."
if command -v psql &> /dev/null; then
    print_check "PostgreSQL client installed"
else
    print_warning "PostgreSQL client not installed (optional for local testing)"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}All checks passed!${NC} Ready for deployment."
    else
        echo -e "${GREEN}No critical errors found.${NC}"
        echo -e "${YELLOW}$WARNINGS warnings${NC} - review before deployment."
    fi
    echo ""
    echo "Next steps:"
    echo "1. Make sure the deployment script is executable:"
    echo "   chmod +x deploy_to_production.sh"
    echo ""
    echo "2. Run the deployment:"
    echo "   ./deploy_to_production.sh"
    echo ""
    echo "3. After deployment, check:"
    echo "   - http://$SERVER_IP:8000/health"
    echo "   - Application logs on server"
else
    echo -e "${RED}$ERRORS critical errors found!${NC} Fix these before deployment."
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}$WARNINGS warnings${NC} also found."
    fi
    exit 1
fi