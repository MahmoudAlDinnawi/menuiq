#!/bin/bash
# Fresh setup script for MenuIQ backend

echo "🚀 Starting fresh MenuIQ setup..."

# 1. Update system and install dependencies
echo "📦 Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx

# 2. Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /root/menuiq/backend
python3 -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv \
    python-jose[cryptography] passlib[bcrypt] python-multipart boto3 pillow \
    stripe httpx

# 4. Set up PostgreSQL
echo "🐘 Setting up PostgreSQL..."
sudo -u postgres psql << EOF
-- Drop existing database if it exists
DROP DATABASE IF EXISTS menuiq;
-- Create fresh database
CREATE DATABASE menuiq;
-- Set password for postgres user
ALTER USER postgres PASSWORD 'Mahmoud.10';
EOF

# 5. Create .env file
echo "⚙️  Creating .env file..."
cat > .env << EOF
DATABASE_URL=postgresql://postgres:Mahmoud.10@localhost:5432/menuiq
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
FRONTEND_URL=https://menuiq.io
ALLOWED_ORIGINS=https://menuiq.io,https://*.menuiq.io
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRICE_ID=your-stripe-price-id
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=menuiq-uploads
EOF

echo "✅ Setup script ready! Run with: bash setup_fresh.sh"