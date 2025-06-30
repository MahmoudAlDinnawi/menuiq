# MenuIQ - Multi-Tenant Restaurant Menu Management System

## Overview

MenuIQ is a comprehensive SaaS platform for restaurants to create, manage, and display digital menus. It features a multi-tenant architecture where each restaurant gets its own subdomain and customizable menu interface.

## Key Features

- **Multi-Tenant Architecture**: Each restaurant operates independently with its own subdomain
- **Rich Menu Management**: Support for detailed menu items including nutrition, allergens, and dietary info
- **Responsive Design**: Optimized for both mobile and desktop viewing
- **Multi-Language Support**: English and Arabic interfaces
- **Real-Time Updates**: Changes reflect immediately on the public menu
- **Customization**: Restaurants can customize colors, fonts, and layout
- **Media Support**: Upload images for menu items and categories
- **Allergen Management**: Visual allergen indicators with custom icons
- **Analytics Ready**: Track menu views and user interactions

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt
- **File Storage**: Local filesystem (upgradeable to S3)

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Build Tool**: Create React App

## Project Structure

```
MenuSystem/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── database.py                # Database configuration
│   ├── models.py                  # SQLAlchemy models
│   ├── auth.py                    # Authentication logic
│   ├── pydantic_models.py         # Request/response schemas
│   ├── system_admin_routes.py     # System admin API endpoints
│   ├── tenant_routes.py           # Tenant management endpoints
│   ├── tenant_auth_routes.py      # Tenant authentication
│   ├── public_menu_routes.py      # Public menu API
│   ├── init_database.py           # Database initialization
│   └── migrations/                # Database migration scripts
│
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main application component
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service layers
│   │   ├── contexts/              # React contexts
│   │   └── assets/                # Images and icons
│   └── public/                    # Static files
│
└── README.md                      # This file
```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MenuSystem.git
cd MenuSystem/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

5. Initialize the database:
```bash
python init_database.py
```

6. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Default Credentials

### System Admin
- Email: admin@menuiq.io
- Password: admin123

### Demo Tenant Admin
- Email: admin@entrecote.com
- Password: admin123

## API Documentation

Once the backend is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

## Key API Endpoints

### Public Endpoints
- `GET /api/public/{subdomain}/menu-items` - Get menu items
- `GET /api/public/{subdomain}/categories` - Get categories
- `GET /api/public/{subdomain}/settings` - Get display settings

### Tenant Endpoints (Requires Authentication)
- `GET /api/tenant/menu-items` - List menu items
- `POST /api/tenant/menu-items` - Create menu item
- `PUT /api/tenant/menu-items/{id}` - Update menu item
- `DELETE /api/tenant/menu-items/{id}` - Delete menu item

### System Admin Endpoints
- `GET /api/system-admin/tenants` - List all tenants
- `POST /api/system-admin/tenants` - Create new tenant
- `GET /api/system-admin/analytics` - View system analytics

## Database Schema

### Core Tables
- **tenants**: Restaurant accounts
- **users**: Tenant admin users
- **system_admins**: Platform administrators
- **categories**: Menu categories
- **menu_items**: Individual menu items
- **settings**: Tenant-specific settings
- **allergen_icons**: Allergen definitions

### Relationships
- One tenant has many users, categories, and menu items
- Menu items belong to one category
- Menu items can have multiple allergens (many-to-many)

## Deployment

### Production Deployment

1. **Backend Deployment (Ubuntu/Debian)**:
```bash
# Install system dependencies
sudo apt update
sudo apt install python3-pip python3-venv postgresql nginx

# Set up the application
cd /opt/menuiq
git clone <repository>
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure systemd service
sudo cp menuiq.service /etc/systemd/system/
sudo systemctl enable menuiq
sudo systemctl start menuiq
```

2. **Frontend Deployment**:
```bash
# Build the frontend
npm run build

# Deploy to hosting service (Vercel, Netlify, etc.)
# Or serve with Nginx
```

3. **Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name api.menuiq.io;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/menuiq
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEFAULT_SUBDOMAIN=menuiq
```

## Customization

### Adding New Features

1. **Backend**: Add new models in `models.py`, create pydantic schemas, add routes
2. **Frontend**: Create components, add routes in `App.js`, update API services

### Theming

Tenants can customize:
- Primary/secondary colors
- Font family
- Layout styles
- Logo and branding

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- API endpoints are protected with authentication
- File uploads are validated and sanitized
- SQL injection protection via SQLAlchemy ORM
- XSS protection with React and DOMPurify

## Performance Optimization

- Database connection pooling
- Lazy loading of images
- API response caching
- Pagination for large datasets
- Optimized database queries with proper indexes

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **CORS Errors**:
   - Check allowed origins in `main.py`
   - Ensure frontend URL is whitelisted

3. **Image Upload Issues**:
   - Check uploads directory permissions
   - Verify file size limits

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@menuiq.io or create an issue in the repository.

## Roadmap

- [ ] Analytics dashboard implementation
- [ ] Multi-location support
- [ ] QR code menu generation
- [ ] Online ordering integration
- [ ] Inventory management
- [ ] Customer reviews and ratings
- [ ] A/B testing for menu layouts
- [ ] Advanced search and filtering
- [ ] API rate limiting
- [ ] Webhook support for integrations

---

Built with ❤️ by the MenuIQ Team