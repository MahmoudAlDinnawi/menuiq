# MenuIQ Backend - PostgreSQL

A multi-tenant restaurant menu management system built with FastAPI and PostgreSQL.

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── database.py            # PostgreSQL database configuration
├── models_multitenant.py  # SQLAlchemy models
├── pydantic_models.py     # Request/Response models
├── auth.py                # Authentication logic
├── init_database.py       # Database initialization script
├── requirements.txt       # Python dependencies
├── .env                   # Development environment variables
├── .env.production        # Production environment variables
└── uploads/               # File uploads directory
```

## Setup

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Create Database

```bash
createdb menuiq_dev
```

### 3. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/menuiq_dev
SECRET_KEY=your-development-secret-key
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 5. Initialize Database

```bash
python init_database.py
```

This creates:
- System admin: admin@menuiq.io / admin123
- Demo tenant: demo@restaurant.com / demo123

### 6. Run Development Server

```bash
python main.py
# or
uvicorn main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Production Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment instructions.

## Database Schema

The system uses a multi-tenant architecture with the following main tables:

- **tenants**: Restaurant organizations
- **users**: Users belonging to tenants
- **system_admins**: Platform administrators
- **categories**: Menu categories per tenant
- **menu_items**: Food items per tenant
- **settings**: Tenant-specific settings
- **allergen_icons**: Allergen information

## Security

- JWT-based authentication
- Tenant isolation at database level
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention via SQLAlchemy ORM

## Maintenance

### Backup Database

```bash
pg_dump menuiq_production > backup.sql
```

### Restore Database

```bash
psql menuiq_production < backup.sql
```

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```