# MenuIQ Production Deployment Guide

This comprehensive guide covers deploying MenuIQ to production using Hetzner Cloud for the backend and Vercel for the frontend.

## Architecture Overview

- **Frontend**: React SPA deployed on Vercel with automatic scaling
- **Backend**: FastAPI deployed on Hetzner Cloud VPS
- **Database**: MySQL 8.0 on Hetzner or managed service
- **File Storage**: Local storage (upgrade to S3-compatible storage recommended)
- **DNS/CDN**: Cloudflare for DNS management and DDoS protection

## URL Structure

MenuIQ uses subdomain-based multi-tenancy. Each tenant gets their own subdomain:

### For Tenants (e.g., Entrecôte Restaurant)
- **Public Menu**: `https://entrecote.menuiq.io/menu` (no login required)
- **Dashboard**: `https://entrecote.menuiq.io/dashboard` (login required)
- **Login**: `https://entrecote.menuiq.io/login`

### For System Administrators
- **Admin Login**: `https://app.menuiq.io/admin/login`
- **Admin Dashboard**: `https://app.menuiq.io/admin/dashboard`

### API Endpoints
- **All API calls**: `https://api.menuiq.io/api/*`

Each tenant's data is completely isolated based on their subdomain.

## Prerequisites

- Domain registered and configured in Cloudflare
- Hetzner Cloud account
- Vercel account
- SSH key pair for server access

## Part 1: Hetzner Backend Deployment

### 1.1 Create Hetzner Cloud Server

1. **Login to Hetzner Cloud Console**
   - Go to https://console.hetzner.cloud
   - Create new project for MenuIQ

2. **Create Server**
   ```
   Location: Nuremberg or Helsinki (EU)
   Image: Ubuntu 22.04
   Type: CX21 (2 vCPU, 4GB RAM) - minimum for production
   Volume: 40GB SSD
   Network: IPv4 + IPv6
   SSH Keys: Add your public key
   Name: menuiq-backend
   ```

3. **Note the server IP address**

### 1.2 Initial Server Setup

1. **Connect to server**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Update system and install dependencies**
   ```bash
   apt update && apt upgrade -y
   apt install -y python3-pip python3-venv nginx mysql-server ufw git
   ```

3. **Configure firewall**
   ```bash
   ufw allow OpenSSH
   ufw allow 'Nginx Full'
   ufw allow 3306/tcp  # MySQL (only if external access needed)
   ufw --force enable
   ```

4. **Create application user**
   ```bash
   adduser menuiq
   usermod -aG sudo menuiq
   su - menuiq
   ```

### 1.3 Setup MySQL Database

1. **Secure MySQL installation**
   ```bash
   sudo mysql_secure_installation
   ```

2. **Create database and user**
   ```bash
   sudo mysql -u root -p
   ```
   ```sql
   CREATE DATABASE menuiq_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'menuiq'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
   GRANT ALL PRIVILEGES ON menuiq_production.* TO 'menuiq'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### 1.4 Deploy Backend Application

1. **Clone repository**
   ```bash
   cd /home/menuiq
   git clone https://github.com/YOUR_REPO/menuiq.git
   cd menuiq/backend
   ```

2. **Setup Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install gunicorn
   ```

3. **Create production environment file**
   ```bash
   # Generate a secure secret key
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   # This will output something like: 3GX5kVNx9HWj4nZPKrYs8mB2uCfL7QaDt6eFgRiJhTo
   
   # Create the environment file
   nano .env.production
   ```
   ```env
   DATABASE_URL=mysql+pymysql://menuiq:YOUR_SECURE_PASSWORD@localhost/menuiq_production
   SECRET_KEY=3GX5kVNx9HWj4nZPKrYs8mB2uCfL7QaDt6eFgRiJhTo  # Use your generated key
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://menuiq.io,https://*.menuiq.io
   ```
   
   **Important**: 
   - Never use a simple or guessable secret key
   - Never commit the secret key to version control
   - Keep a secure backup of your production secret key
   - Each environment should have its own unique secret key
   - If your database password contains special characters (@, #, %, etc.), URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
     - Example: `pass@word` becomes `pass%40word`

4. **Run database migrations**
   ```bash
   source venv/bin/activate
   export $(cat .env.production | xargs)
   python init_database.py
   python migrate_to_multitenant.py
   ```

### 1.5 Setup Systemd Service

1. **Create service file**
   ```bash
   sudo nano /etc/systemd/system/menuiq.service
   ```
   
   **Option A: If running as menuiq user**
   ```ini
   [Unit]
   Description=MenuIQ FastAPI Backend
   After=network.target mysql.service

   [Service]
   Type=exec
   User=menuiq
   Group=menuiq
   WorkingDirectory=/home/menuiq/menuiq/backend
   Environment="PATH=/home/menuiq/menuiq/backend/venv/bin"
   EnvironmentFile=/home/menuiq/menuiq/backend/.env.production
   ExecStart=/home/menuiq/menuiq/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main_mysql:app --bind 127.0.0.1:8000
   Restart=on-failure
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```
   
   **Option B: If running as root (current setup)**
   ```ini
   [Unit]
   Description=MenuIQ FastAPI Backend
   After=network.target mysql.service

   [Service]
   Type=exec
   User=root
   Group=root
   WorkingDirectory=/root/menuiq/backend
   Environment="PATH=/root/menuiq/backend/venv/bin"
   EnvironmentFile=/root/menuiq/backend/.env.production
   ExecStart=/root/menuiq/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main_mysql:app --bind 127.0.0.1:8000
   Restart=on-failure
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable menuiq
   sudo systemctl start menuiq
   sudo systemctl status menuiq
   ```

### 1.6 Configure Nginx

1. **Create Nginx configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/menuiq
   ```
   ```nginx
   server {
       listen 80;
       server_name api.menuiq.io;
       
       client_max_body_size 10M;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /uploads {
           alias /home/menuiq/menuiq/backend/uploads;
           expires 30d;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

2. **Enable site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/menuiq /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 1.7 Setup SSL with Let's Encrypt

Since menuiq.io is using Vercel DNS, we'll use Let's Encrypt for the API subdomain:

1. **Install Certbot**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Configure DNS in Vercel Dashboard**
   - Login to Vercel dashboard
   - Go to your domain settings
   - Add A record: `api` → `YOUR_SERVER_IP`
   - Wait for DNS propagation (5-10 minutes)

3. **Generate SSL Certificate**
   ```bash
   sudo certbot --nginx -d api.menuiq.io
   ```
   - Enter your email when prompted
   - Agree to terms
   - Choose whether to redirect HTTP to HTTPS (recommended: yes)

4. **Update Nginx configuration for HTTPS**
   ```nginx
   server {
       listen 80;
       server_name api.menuiq.io;
       
       client_max_body_size 10M;
       
       # Important: Tell your app it's behind HTTPS proxy
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto https;  # Important!
           proxy_cache_bypass $http_upgrade;
       }
       
       location /uploads {
           alias /home/menuiq/menuiq/backend/uploads;
           expires 30d;
           add_header Cache-Control "public, immutable";
       }
   }
   ```
   
   Certbot will automatically configure the HTTPS server block.

5. **Auto-renewal setup**
   Certbot automatically sets up renewal. Test it with:
   ```bash
   sudo certbot renew --dry-run
   ```

### 1.8 Setup Automated Backups

1. **Create backup script**
   ```bash
   sudo nano /home/menuiq/backup.sh
   ```
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/home/menuiq/backups"
   mkdir -p $BACKUP_DIR
   
   # Database backup
   mysqldump -u menuiq -p'YOUR_SECURE_PASSWORD' menuiq_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz
   
   # Uploads backup
   tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/menuiq/menuiq/backend/uploads
   
   # Keep only last 7 days of backups
   find $BACKUP_DIR -type f -mtime +7 -delete
   ```

2. **Setup cron job**
   ```bash
   crontab -e
   ```
   ```
   0 2 * * * /bin/bash /home/menuiq/backup.sh
   ```

## Part 2: Vercel Frontend Deployment

### 2.1 Prepare Frontend for Production

1. **Update environment configuration**
   ```bash
   cd frontend
   nano .env.production
   ```
   ```env
   REACT_APP_API_URL=https://api.menuiq.io
   ```

2. **Build and test locally**
   ```bash
   npm install
   npm run build
   ```

### 2.2 Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```
   - Choose project name: `menuiq-frontend`
   - Choose framework: Create React App
   - Set build command: `npm run build`
   - Set output directory: `build`

3. **Configure environment variables in Vercel dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://api.menuiq.io`

### 2.3 Configure Custom Domain

1. **Change Nameservers to Vercel**
   - Go to your domain registrar (where you bought menuiq.io)
   - Update nameservers to:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Remove Cloudflare nameservers
   - Wait for propagation (can take up to 48 hours, usually faster)

2. **In Vercel Dashboard**
   - Go to Settings → Domains
   - Add domain: `menuiq.io`
   - Add wildcard: `*.menuiq.io`
   - Vercel will automatically provision SSL certificates

3. **Configure DNS in Vercel Dashboard**
   - Vercel will automatically handle:
     - Root domain (menuiq.io)
     - Wildcard subdomains (*.menuiq.io)
   - Add A record for API:
     - Name: `api`
     - Value: `YOUR_SERVER_IP`
     - TTL: 3600

## Part 3: Post-Deployment Configuration

### 3.1 Vercel Settings

1. **SSL/TLS Configuration**
   - Vercel automatically provisions and renews SSL certificates
   - No manual configuration needed
   - Supports both root domain and wildcard subdomains

2. **Redirect Configuration**
   - In Vercel project settings
   - Add redirect from www to non-www if desired
   - Challenge Passage: 30 minutes
   - Enable Browser Integrity Check
   - Enable Hotlink Protection

3. **Page Rules (Free plan allows 3 rules)**
   - Rule 1: `api.menuiq.io/*`
     - Cache Level: Bypass
     - Disable Performance Features
   - Rule 2: `*.menuiq.io/*`
     - Always Use HTTPS: On
     - Cache Level: Standard
   - Rule 3: `menuiq.io/*`
     - Always Use HTTPS: On
     - Cache Level: Standard

4. **DNS Records Summary**
   ```
   Type    Name    Content                    Proxy
   A       api     YOUR_SERVER_IP            ✓ (Proxied)
   CNAME   @       cname.vercel-dns.com      ✓ (Proxied)
   CNAME   *       cname.vercel-dns.com      ✓ (Proxied)
   ```

### 3.2 Monitoring Setup

1. **Server monitoring**
   ```bash
   # Install monitoring agent (optional)
   curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
   ```

2. **Application monitoring**
   - Setup error tracking with Sentry
   - Configure uptime monitoring (UptimeRobot, Pingdom)

### 3.3 Security Hardening

1. **Change default passwords**
   - System admin: `admin@menuiq.io`
   - Default tenant admin

2. **Generate strong passwords and keys**
   ```bash
   # For SECRET_KEY (choose one method):
   
   # Method 1: Python secrets module (recommended)
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Method 2: OpenSSL
   openssl rand -hex 32
   
   # Method 3: Using /dev/urandom
   head -c 32 /dev/urandom | base64
   
   # For database passwords:
   openssl rand -base64 24
   ```

3. **Configure fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Regular updates**
   ```bash
   # Create update script
   sudo nano /home/menuiq/update.sh
   ```
   ```bash
   #!/bin/bash
   cd /home/menuiq/menuiq
   git pull
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   sudo systemctl restart menuiq
   ```

## Maintenance

### Daily Tasks
- Check application logs: `sudo journalctl -u menuiq -f`
- Monitor disk usage: `df -h`
- Check backup completion

### Weekly Tasks
- Review error logs
- Check SSL certificate expiry
- Update dependencies if needed

### Monthly Tasks
- Security updates: `sudo apt update && sudo apt upgrade`
- Review resource usage
- Test backup restoration

## Troubleshooting

### Backend Issues
```bash
# Check service status
sudo systemctl status menuiq

# View logs
sudo journalctl -u menuiq -n 100

# Restart service
sudo systemctl restart menuiq

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Database Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Connect to database
mysql -u menuiq -p menuiq_production
```

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables
- Check browser console for errors

## Support & Documentation

- Backend logs: `/var/log/nginx/error.log`
- Application logs: `journalctl -u menuiq`
- Database location: `/var/lib/mysql`
- Uploads location: `/home/menuiq/menuiq/backend/uploads`

## Cost Estimation

- Hetzner CX21: €5.83/month
- Domain: ~$12/year
- Vercel: Free tier (hobby)
- Total: ~€6-7/month

## Scaling Considerations

When you need to scale:
1. **Vertical scaling**: Upgrade to CX31 or CX41
2. **Horizontal scaling**: Add load balancer + multiple backend servers
3. **Database**: Move to managed MySQL service
4. **Storage**: Implement S3-compatible object storage
5. **CDN**: Use Cloudflare's paid plans for better performance

## Production Verification Checklist

After deployment, verify the following:

### 1. System Admin Access
- [ ] Visit `https://app.menuiq.io/admin/login`
- [ ] Login with system admin credentials
- [ ] Create a test tenant (e.g., "demo")

### 2. Tenant Functionality
- [ ] Visit `https://demo.menuiq.io/menu` - Should show public menu (no login required)
- [ ] Visit `https://demo.menuiq.io/login` - Should show tenant login page
- [ ] Login with tenant credentials
- [ ] Access `https://demo.menuiq.io/dashboard` - Should show tenant dashboard
- [ ] Add/edit menu items
- [ ] Upload images
- [ ] Check menu updates reflect on public menu page

### 3. Security Verification
- [ ] HTTPS working on all URLs
- [ ] HTTP redirects to HTTPS
- [ ] API calls use authentication
- [ ] Tenant data isolation (one tenant can't see another's data)
- [ ] File uploads are restricted by size

### 4. Performance Check
- [ ] Menu page loads quickly
- [ ] Images are cached properly
- [ ] API response times < 500ms

### 5. Mobile Responsiveness
- [ ] Test menu on mobile devices
- [ ] Test dashboard on tablets
- [ ] Verify touch interactions work

## Common Issues & Solutions

### Subdomain not working
- Check Cloudflare DNS wildcard record `*.menuiq.io`
- Verify Vercel accepts wildcard domains
- Check frontend subdomain detection logic

### Menu page requires login
- Verify `/menu` route is public in App.js
- Check backend CORS settings
- Ensure API allows unauthenticated menu access

### Images not uploading
- Check Nginx client_max_body_size
- Verify upload directory permissions
- Check disk space on server