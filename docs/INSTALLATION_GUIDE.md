# 🚀 Leave Management System - Installation Guide

## Prerequisites

Before installing the Leave Management System, ensure you have the following software installed:

### Required Software
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **MySQL** 8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Git** (for cloning the repository)

### Optional (for Docker deployment)
- **Docker** 20.x or higher ([Download](https://www.docker.com/get-started))
- **Docker Compose** 2.x or higher

### System Requirements
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Disk Space**: Minimum 2GB free space
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

---

## Installation Methods

### Method 1: Local Development Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-company/leave-management-system.git
cd leave-management-system
```

#### Step 2: Install Dependencies

**Backend Dependencies:**
```bash
cd backend
npm install
```

**Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

#### Step 3: Database Setup

**Create MySQL Database:**
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE leave_management_db;

-- Create user (optional)
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON leave_management_db.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 4: Environment Configuration

**Backend Environment (.env):**
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file:
```env
# Database Configuration
DATABASE_URL=mysql://lms_user:password123@localhost:3306/leave_management_db
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leave_management_db
DB_USER=lms_user
DB_PASSWORD=password123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_PROVIDER=GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=LMS - Leave Management System
EMAIL_FROM_ADDRESS=your-email@gmail.com

# Application Settings
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
COMPANY_NAME=Your Company Name
CORS_ORIGIN=http://localhost:5173
```

**Frontend Environment (.env):**
```bash
cd ../frontend
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_NAME=Leave Management System
```

#### Step 5: Database Migration
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data (optional)
npx prisma db seed
```

#### Step 6: Start the Application

**Start Backend Server:**
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:3001

**Start Frontend Application:**
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173

#### Step 7: Initial Setup

1. **Open your browser** and navigate to http://localhost:5173
2. **Create admin account** using the setup wizard
3. **Configure company settings** in the admin panel
4. **Add users** and configure leave policies

---

### Method 2: Docker Deployment

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-company/leave-management-system.git
cd leave-management-system
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_PASSWORD=your-secure-password
DB_ROOT_PASSWORD=your-root-password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Email Configuration
EMAIL_PROVIDER=GMAIL
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Company Settings
COMPANY_NAME=Your Company Name
FRONTEND_URL=http://localhost:8080
```

#### Step 3: Build and Start Services
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 4: Access the Application
- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api/v1
- **API Documentation**: http://localhost:8080/api/v1/docs

---

### Method 3: Production Deployment

#### Step 1: Server Preparation

**Update System:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Install Dependencies:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### Step 2: Application Setup

**Clone and Build:**
```bash
cd /var/www
sudo git clone https://github.com/your-company/leave-management-system.git
sudo chown -R $USER:$USER leave-management-system
cd leave-management-system

# Install dependencies
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build
```

**Configure Environment:**
```bash
cd /var/www/leave-management-system
sudo cp .env.example .env
sudo nano .env
```

Production `.env` configuration:
```env
NODE_ENV=production
DATABASE_URL=mysql://lms_user:secure_password@localhost:3306/leave_management_db
JWT_SECRET=very-long-secure-jwt-secret-for-production-use
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Production email settings
EMAIL_PROVIDER=SENDGRID
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Step 3: Database Setup
```bash
cd backend
npx prisma migrate deploy
```

#### Step 4: Process Manager (PM2)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
cd backend
pm2 start npm --name "lms-backend" -- start
pm2 save
pm2 startup
```

#### Step 5: Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/lms
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/leave-management-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Post-Installation Configuration

### Initial Admin Setup

1. **Access the application** at your configured URL
2. **Complete the setup wizard**:
   - Create admin account
   - Configure company information
   - Set up basic leave policies
   - Configure email settings

### User Management

**Create Users:**
```bash
# Via API (example)
curl -X POST "https://your-domain.com/api/v1/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": "Engineering"
  }'
```

**Bulk Import Users:**
1. Navigate to **Admin → Users → Import**
2. Download CSV template
3. Fill in user data
4. Upload CSV file

### Leave Policy Configuration

1. **Navigate to Admin → Policies**
2. **Create Leave Types**:
   - Annual Leave
   - Sick Leave
   - Personal Leave
   - Maternity/Paternity Leave
3. **Configure Approval Workflows**
4. **Set Regional Settings**

### Email Configuration

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in SMTP_PASS

**SendGrid Setup:**
1. Create SendGrid account
2. Generate API key
3. Configure sender identity

---

## Troubleshooting

### Common Installation Issues

#### Database Connection Error
```
Error: P1001: Can't reach database server at localhost:3306
```

**Solutions:**
1. Check MySQL service status: `sudo systemctl status mysql`
2. Start MySQL: `sudo systemctl start mysql`
3. Verify connection: `mysql -u lms_user -p`
4. Check firewall settings

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
1. Find process using port: `lsof -i :3001`
2. Kill process: `kill -9 <PID>`
3. Change port in configuration

#### Prisma Migration Errors
```
Error: Migration failed to apply
```

**Solutions:**
1. Reset database: `npx prisma migrate reset`
2. Generate client: `npx prisma generate`
3. Apply migrations: `npx prisma migrate deploy`

#### Frontend Build Errors
```
Error: Module not found
```

**Solutions:**
1. Clear cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Rebuild: `npm run build`

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
```

#### Nginx Optimization
```nginx
# Add to nginx configuration
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Node.js Optimization
```bash
# Set environment variables
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=16
```

---

## Security Hardening

### Database Security
```sql
-- Remove test database and anonymous users
DELETE FROM mysql.user WHERE User='';
DROP DATABASE IF EXISTS test;
FLUSH PRIVILEGES;

-- Create restricted user
CREATE USER 'lms_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_management_db.* TO 'lms_app'@'localhost';
```

### Application Security
```env
# Use strong JWT secret
JWT_SECRET=very-long-random-string-with-numbers-and-special-chars-123!@#

# Disable debug in production
NODE_ENV=production
DEBUG=false

# Set secure session settings
SESSION_SECURE=true
COOKIE_SECURE=true
```

### Firewall Configuration
```bash
# Configure UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/lms"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u lms_user -p$DB_PASSWORD leave_management_db > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/leave-management-system

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Schedule Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /var/scripts/backup.sh
```

---

## Monitoring Setup

### Health Check Endpoint
The application provides health check endpoints:

```bash
# Application health
curl http://localhost:3001/health

# Detailed monitoring
curl http://localhost:3001/api/v1/monitoring/health
```

### Log Monitoring
```bash
# View application logs
tail -f backend/logs/app.log

# Monitor with PM2
pm2 logs lms-backend

# System logs
sudo journalctl -u nginx -f
```

---

## Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/leave-management-system
npm audit fix

# Update PM2
pm2 update
```

### Database Maintenance
```sql
-- Optimize tables monthly
OPTIMIZE TABLE leave_requests, users, approvals;

-- Analyze tables for performance
ANALYZE TABLE leave_requests, users, approvals;
```

---

## Support

### Getting Help
- **Documentation**: Check this guide and API documentation
- **Issues**: Report issues on GitHub repository
- **Email Support**: [support@your-company.com]
- **Community**: Join our Slack/Discord community

### Professional Support
For enterprise installations and professional support:
- **Consulting**: Professional installation and configuration
- **Training**: User and administrator training sessions
- **Maintenance**: Ongoing maintenance and support contracts

---

*Installation guide last updated: [Current Date]*
*For technical support during installation: [SUPPORT_EMAIL]*