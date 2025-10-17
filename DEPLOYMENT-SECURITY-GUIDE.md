# Secure Deployment Guide - Leave Management System

## Table of Contents
1. [Pre-Deployment Security Checklist](#pre-deployment-security-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Security](#database-security)
4. [Application Security](#application-security)
5. [Server Security](#server-security)
6. [Deployment Options](#deployment-options)
7. [Post-Deployment Security](#post-deployment-security)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Security Checklist

### 1. Remove Test/Development Data
- [ ] Remove all test user credentials from code
- [ ] Remove hardcoded credentials
- [ ] Clean up console.log statements
- [ ] Remove debug endpoints
- [ ] Remove development-only features

### 2. Code Review
- [ ] Review all authentication logic
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify input validation on all endpoints
- [ ] Review file upload security
- [ ] Check for XSS vulnerabilities
- [ ] Review CORS configuration

### 3. Dependencies
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update outdated packages
- [ ] Remove unused dependencies
- [ ] Verify package integrity

---

## Environment Configuration

### 1. Generate Secure Secrets

**DO NOT USE** the development secrets in production!

```bash
# Generate secure JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate secure email action token secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Production Environment Variables

Create a `.env.production` file (NEVER commit this to git):

```bash
# Database - Use strong credentials
DATABASE_URL="mysql://prod_user:STRONG_PASSWORD_HERE@your-db-host:3306/leave_management_prod"

# JWT - Use newly generated secrets
JWT_SECRET="YOUR_NEWLY_GENERATED_64_CHAR_SECRET_HERE"
JWT_EXPIRES_IN="2h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
NODE_ENV="production"
PORT="3001"
API_PREFIX="/api/v1"

# CORS - Specify your actual frontend domain
CORS_ORIGIN="https://yourdomain.com"

# Email - Use real SMTP credentials
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-production-email@company.com"
EMAIL_PASS="your-app-specific-password"
EMAIL_FROM="Leave Management System <noreply@yourcompany.com>"
EMAIL_ACTION_TOKEN_SECRET="YOUR_NEWLY_GENERATED_SECRET_HERE"

# Redis (if using)
REDIS_URL="redis://your-redis-host:6379"
# Or use Redis with password
# REDIS_URL="redis://:password@your-redis-host:6379"

# File Upload
MAX_FILE_SIZE="5242880"
UPLOAD_DIR="/secure/path/uploads"

# Regional Configuration
DEFAULT_REGION="INDIA"
DEFAULT_LOCATION="Bengaluru"

# Logging
LOG_LEVEL="error"  # Use "error" in production, not "debug"

# Rate Limiting - Production settings
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"  # 100 requests per 15 minutes

# Company Information
COMPANY_NAME="Your Company Name"
COMPANY_TIMEZONE="Asia/Kolkata"

# SSL/TLS (if handling directly)
SSL_CERT_PATH="/path/to/ssl/cert.pem"
SSL_KEY_PATH="/path/to/ssl/key.pem"
```

### 3. Frontend Environment Variables

Create `.env.production` in frontend directory:

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME="Leave Management System"
VITE_ENABLE_ANALYTICS=true
```

---

## Database Security

### 1. Create Production Database User

```sql
-- Create dedicated database user with limited permissions
CREATE USER 'lms_app'@'%' IDENTIFIED BY 'VERY_STRONG_PASSWORD_HERE';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_management_prod.* TO 'lms_app'@'%';

-- Revoke dangerous permissions
REVOKE ALL PRIVILEGES ON mysql.* FROM 'lms_app'@'%';
REVOKE FILE ON *.* FROM 'lms_app'@'%';

FLUSH PRIVILEGES;
```

### 2. Database Configuration

**MySQL Configuration (`my.cnf`):**

```ini
[mysqld]
# Security
skip-name-resolve
local-infile=0

# SSL/TLS
require_secure_transport=ON
ssl-ca=/path/to/ca-cert.pem
ssl-cert=/path/to/server-cert.pem
ssl-key=/path/to/server-key.pem

# Connection limits
max_connections=200
max_user_connections=50

# Query timeout
max_execution_time=30000

# Log security events
log_error=/var/log/mysql/error.log
```

### 3. Backup Strategy

```bash
# Daily automated backup script
#!/bin/bash
BACKUP_DIR="/secure/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="backup_user"
MYSQL_PASS="backup_password"
DATABASE="leave_management_prod"

# Create backup with encryption
mysqldump -u $MYSQL_USER -p$MYSQL_PASS $DATABASE | \
  gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -out "$BACKUP_DIR/backup_$DATE.sql.gz.enc"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz.enc" -mtime +30 -delete
```

---

## Application Security

### 1. Remove Test User Selector

**IMPORTANT**: Remove the test user dropdown from production login page!

Edit `frontend/src/pages/auth/LoginPage.tsx`:

```typescript
// REMOVE THIS ENTIRE SECTION IN PRODUCTION:
// <FormControl fullWidth margin="normal">
//   <InputLabel>Quick Select Test User</InputLabel>
//   <Select ... >
//   ...
//   </Select>
// </FormControl>

// OR better, use environment variable:
{import.meta.env.DEV && (
  <FormControl fullWidth margin="normal">
    <InputLabel>Quick Select Test User (Dev Only)</InputLabel>
    <Select>...</Select>
  </FormControl>
)}
```

### 2. Security Headers

Add to your backend `src/index.ts` or main server file:

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Use Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use('/api/v1/auth/login', authLimiter);
```

### 3. Password Requirements

Enforce strong passwords in backend validation:

```typescript
// backend/src/utils/validation.ts
export const passwordSchema = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/
};
```

### 4. Secure Session Management

```typescript
// Use secure cookies
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    sameSite: 'strict',
  }
}));
```

---

## Server Security

### 1. Linux Server Hardening

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3306/tcp   # Don't expose MySQL

# Install fail2ban (brute force protection)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Disable root login via SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Create non-root user for deployment
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 2. Install Node.js & PM2

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### 3. Install & Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/leave-management
```

**Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/leave-management

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React)
    location / {
        root /var/www/leave-management/frontend;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Stricter rate limit for login
    location /api/v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;

        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|git|gitignore)$ {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/leave-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (certbot creates a cron job automatically)
sudo certbot renew --dry-run
```

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, Linode)

#### Step 1: Prepare Application

```bash
# On your local machine
cd leave-management-system

# Backend
cd backend
npm ci --production
npm run build

# Frontend
cd ../frontend
npm ci
npm run build
```

#### Step 2: Deploy to Server

```bash
# Copy files to server
scp -r backend/ deploy@your-server-ip:/var/www/leave-management/
scp -r frontend/dist deploy@your-server-ip:/var/www/leave-management/frontend/

# SSH into server
ssh deploy@your-server-ip

# Navigate to backend
cd /var/www/leave-management/backend

# Set up environment
cp .env.production .env
nano .env  # Edit with production values

# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# Start with PM2
pm2 start dist/index.js --name leave-management-api
pm2 save
```

#### Step 3: Configure PM2 Ecosystem

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'leave-management-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/leave-management-error.log',
    out_file: '/var/log/pm2/leave-management-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with ecosystem:

```bash
pm2 start ecosystem.config.js
pm2 save
```

### Option 2: Docker Deployment

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: lms-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: leave_management_prod
      MYSQL_USER: lms_app
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: lms-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: lms-backend
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://lms_app:${MYSQL_PASSWORD}@mysql:3306/leave_management_prod
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: lms-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - lms-network

  nginx:
    image: nginx:alpine
    container_name: lms-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - lms-network

volumes:
  mysql_data:
  redis_data:

networks:
  lms-network:
    driver: bridge
```

Create `.env` file:

```bash
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_app_password
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_secure_jwt_secret
```

Deploy with Docker:

```bash
# Build and start
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Platform as a Service (Heroku, Railway, Render)

#### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-lms-app

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_generated_secret
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

---

## Post-Deployment Security

### 1. Change All Default Passwords

```sql
-- Delete all test users
DELETE FROM users WHERE email LIKE '%@company.com';

-- Create first admin user with secure password
-- Use bcrypt to hash password before inserting
INSERT INTO users (email, password, firstName, lastName, role)
VALUES ('admin@yourcompany.com', 'BCRYPT_HASHED_PASSWORD', 'Admin', 'User', 'ADMIN');
```

### 2. Configure Monitoring

```bash
# Install monitoring tools
npm install @sentry/node @sentry/tracing

# Backend error tracking (backend/src/index.ts)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Set Up Logging

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '/var/log/lms/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/lms/combined.log'
    })
  ]
});

// Log security events
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('SECURITY_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};
```

### 4. Enable Database Auditing

```sql
-- Enable MySQL audit log
SET GLOBAL audit_log_policy = ALL;
SET GLOBAL audit_log_format = JSON;
```

---

## Monitoring & Maintenance

### 1. Health Checks

Create health check endpoint (`backend/src/routes/health.ts`):

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

export default router;
```

### 2. Automated Backups

```bash
# Create backup script
cat > /usr/local/bin/lms-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/secure/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec lms-mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD leave_management_prod | \
  gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_PASSWORD \
  -out "$BACKUP_DIR/db_$DATE.sql.gz.enc"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/db_$DATE.sql.gz.enc" s3://your-backup-bucket/

# Keep only 30 days
find $BACKUP_DIR -name "db_*.sql.gz.enc" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/lms-backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/lms-backup.sh
```

### 3. Security Updates

```bash
# Create update script
cat > /usr/local/bin/lms-update.sh << 'EOF'
#!/bin/bash
cd /var/www/leave-management

# Pull latest code
git pull origin main

# Backend
cd backend
npm ci --production
npm run build
pm2 restart leave-management-api

# Frontend
cd ../frontend
npm ci
npm run build

# Reload Nginx
sudo systemctl reload nginx

echo "Update completed: $(date)"
EOF

chmod +x /usr/local/bin/lms-update.sh
```

### 4. Monitoring Dashboard

Set up Grafana + Prometheus for monitoring:

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Configure Prometheus
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'leave-management-api'
    static_configs:
      - targets: ['localhost:3001']
EOF

# Start Prometheus
./prometheus --config.file=prometheus.yml &
```

---

## Security Incident Response

### 1. Suspected Breach

```bash
# Immediately change all passwords
# Rotate JWT secrets
# Check logs for suspicious activity
grep "FAILED_LOGIN" /var/log/lms/combined.log

# Block suspicious IPs
sudo ufw deny from <suspicious-ip>

# Review database for unauthorized changes
SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 100;
```

### 2. Regular Security Audits

```bash
# Run weekly security scan
npm audit
docker scan your-image:latest

# Check for exposed secrets
git secrets --scan-history

# Review access logs
tail -f /var/log/nginx/access.log
```

---

## Compliance & Legal

### 1. GDPR Compliance (if applicable)

- Implement data export functionality
- Add data deletion endpoints
- Maintain audit logs
- Provide privacy policy

### 2. Data Retention Policy

```sql
-- Archive old data
CREATE TABLE leave_requests_archive LIKE leave_requests;
INSERT INTO leave_requests_archive
SELECT * FROM leave_requests WHERE createdAt < DATE_SUB(NOW(), INTERVAL 7 YEAR);
```

---

## Quick Deployment Checklist

- [ ] Generate new JWT secrets
- [ ] Configure production database with strong credentials
- [ ] Remove test user selector from login page
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure error monitoring (Sentry)
- [ ] Set up health checks
- [ ] Enable audit logging
- [ ] Create non-root database user
- [ ] Disable debug mode
- [ ] Configure proper logging
- [ ] Test disaster recovery
- [ ] Document admin credentials securely
- [ ] Set up monitoring alerts
- [ ] Review and update dependencies
- [ ] Perform security testing

---

## Support & Resources

- **Security Issues**: Report to security@yourcompany.com
- **Documentation**: https://docs.yourcompany.com
- **Status Page**: https://status.yourcompany.com

---

**Last Updated**: 2025-10-17
**Version**: 1.0
