# Entrecôte Café de Paris Menu System

A modern, luxury restaurant menu system with bilingual support (English/Arabic), rich content management, and Saudi Arabia compliance features.

## Features

- 🌐 Bilingual menu (English/Arabic) with RTL support
- 📱 Fully responsive design
- 🎨 Rich text editor for custom footer content
- 🖼️ Image upload for menu items
- 🥗 Allergen icons and dietary information
- 💰 VAT calculation (15% for Saudi Arabia)
- ☕ Caffeine indicator
- 🌶️ Spicy level indicator
- 🏃 Exercise time calculator (walk/run minutes)
- 📊 Dashboard for menu management
- 🗄️ MySQL database backend

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- MySQL Server
- npm or yarn

## Quick Start

### 1. Database Setup

1. Install MySQL if not already installed:
```bash
# On macOS with Homebrew
brew install mysql
brew services start mysql

# On Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

2. Create the database:
```bash
mysql -u root -p
```

Then in MySQL prompt:
```sql
CREATE DATABASE entrecote_menu;
EXIT;
```

3. Update database credentials in `/backend/.env`:
```
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/entrecote_menu
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python main_mysql.py
```

The backend API will run on http://localhost:8000

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on http://localhost:3000

## Usage

### Accessing the Application

1. **Main Menu (Embedded)**: http://localhost:3000
   - View the restaurant menu
   - Switch between English/Arabic
   - Filter by categories

2. **Dashboard**: http://localhost:3000/dashboard
   - Add/Edit/Delete menu items
   - Manage categories
   - Configure settings and footer text

### Dashboard Features

#### Adding Menu Items
1. Click "Add New Item" in the sidebar
2. Fill in the form:
   - Basic info (name, price, description) in both languages
   - Upload an image (optional)
   - Select allergens from visual icons
   - Set dietary options
   - Add nutritional info

#### Managing Categories
1. Go to "Category Management"
2. Add custom categories with bilingual names
3. Reorder categories
4. Delete unused categories

#### Settings (Footer Text)
1. Go to "Settings"
2. Enable/Disable footer text
3. Use the rich text editor to create custom footer content
4. Preview before saving

## Project Structure

```
MenuSystem/
├── backend/
│   ├── main_mysql.py      # FastAPI app with MySQL
│   ├── database.py        # SQLAlchemy models
│   ├── requirements.txt   # Python dependencies
│   ├── uploads/          # Image uploads directory
│   └── .env             # Database configuration
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Main pages
│   │   ├── services/    # API services
│   │   └── assets/      # Images and static files
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## API Endpoints

- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Create new item
- `PUT /api/menu-items/{id}` - Update item
- `DELETE /api/menu-items/{id}` - Delete item
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `POST /api/upload-image` - Upload image
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/allergen-icons` - Get allergen icons

## Troubleshooting

### MySQL Connection Issues
1. Ensure MySQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status mysql
```

2. Check credentials in `.env` file
3. Verify database exists:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Port Already in Use
- Backend: Change port in `main_mysql.py` (default: 8000)
- Frontend: Use `PORT=3001 npm start` for different port

### Missing Dependencies
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Database Tables Not Created
The tables are automatically created when you first run the backend. If you need to reset:
```bash
mysql -u root -p
DROP DATABASE entrecote_menu;
CREATE DATABASE entrecote_menu;
EXIT;
```

Then restart the backend.

## Production Deployment

### Backend
1. Update CORS settings in `main_mysql.py` with your domain
2. Set production database URL in `.env`
3. Use a production ASGI server:
```bash
pip install gunicorn
gunicorn main_mysql:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
1. Update API URL in `.env`:
```
REACT_APP_API_URL=https://your-api-domain.com
```

2. Build production version:
```bash
npm run build
```

3. Serve the `build` folder with nginx or deploy to Netlify/Vercel

## Technologies Used

- **Frontend**: React, Tailwind CSS, DOMPurify, React Quill, Axios
- **Backend**: FastAPI, SQLAlchemy, MySQL, Pydantic
- **Database**: MySQL with SQLAlchemy ORM
- **File Upload**: Python multipart
- **Rich Text**: React Quill editor with DOMPurify sanitization

## Color Scheme

- Primary: #00594f (Teal)
- Gold Accent: #c9a961
- White & Cream backgrounds
- Text: #1a1a1a (Primary Dark)

## License

© 2024 Entrecôte Café de Paris. All rights reserved.