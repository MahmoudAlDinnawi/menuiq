#!/bin/bash
# Local setup script for MenuIQ backend

echo "🚀 Starting local MenuIQ setup..."

# 1. Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 2. Install Python dependencies
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv \
    python-jose[cryptography] passlib[bcrypt] python-multipart boto3 pillow \
    stripe httpx

# 3. Create .env file for local development
echo "⚙️  Creating .env file..."
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/menuiq
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRICE_ID=your-stripe-price-id
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=menuiq-uploads
EOF

echo "✅ Local setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running locally"
echo "2. Create the database: createdb menuiq"
echo "3. Run: python init_database.py"
echo "4. Start the server: python main.py"