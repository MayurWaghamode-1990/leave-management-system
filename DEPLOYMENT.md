# Leave Management System - Production Deployment Guide

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Rollback Procedures](#rollback-procedures)
12. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test` in both frontend and backend)
- [ ] No ESLint errors (`npm run lint`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] Security audit clean (`npm audit`)
- [ ] Code review completed and approved
- [ ] Version tagged in Git

### Documentation
- [ ] API documentation updated
- [ ] FEATURES.md reviewed and current
- [ ] TESTING_GUIDE.md verified
- [ ] Environment variables documented
- [ ] Deployment runbook prepared

### Infrastructure
- [ ] Production server provisioned
- [ ] Database server configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Load balancer configured (if applicable)

### Third-Party Services
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] Calendar API credentials (Google/Outlook)
- [ ] Monitoring service setup (New Relic/DataDog)
- [ ] Log aggregation service (ELK/Splunk)
- [ ] CDN configured for frontend assets

---

## Environment Setup

### Server Requirements

#### Backend Server
```
OS: Ubuntu 22.04 LTS or equivalent
CPU: 2+ cores (4 cores recommended)
RAM: 4GB minimum (8GB recommended)
Storage: 50GB SSD minimum
Node.js: v18.x or v20.x
```

#### Database Server
```
OS: Ubuntu 22.04 LTS or equivalent
CPU: 2+ cores (4 cores recommended)
RAM: 8GB minimum (16GB recommended)
Storage: 100GB SSD minimum
MySQL: 8.0.x
```

#### Frontend Server (Static Hosting)
```
CDN: CloudFront, Cloudflare, or Netlify
Storage: 1GB for build artifacts
```

### Environment Variables

#### Backend (.env.production)
```bash
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://api.leavesystem.company.com
FRONTEND_URL=https://leave.company.com

# Database
DATABASE_URL="mysql://username:password@db.company.com:3306/leave_management_prod?connection_limit=20&pool_timeout=30"

# Security
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SESSION_SECRET=<generate-strong-random-secret>

# Email Service
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@company.com
SENDGRID_API_KEY=<sendgrid-api-key>
# OR for AWS SES
# EMAIL_SERVICE=ses
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=<access-key>
# AWS_SECRET_ACCESS_KEY=<secret-key>

# Calendar Integration
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
GOOGLE_REDIRECT_URI=https://api.leavesystem.company.com/api/v1/calendar/google/callback

OUTLOOK_CLIENT_ID=<outlook-client-id>
OUTLOOK_CLIENT_SECRET=<outlook-secret>
OUTLOOK_REDIRECT_URI=https://api.leavesystem.company.com/api/v1/calendar/outlook/callback

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_LICENSE_KEY=<new-relic-key>
NEW_RELIC_APP_NAME=Leave-Management-Backend

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://leave.company.com

# Scheduled Jobs
ENABLE_SCHEDULED_JOBS=true
TIMEZONE=Asia/Kolkata
```

#### Frontend (.env.production)
```bash
VITE_API_BASE_URL=https://api.leavesystem.company.com
VITE_APP_NAME=Leave Management System
VITE_ENV=production
VITE_GOOGLE_ANALYTICS_ID=<ga-id>
VITE_SENTRY_DSN=<sentry-dsn>
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate session secret
openssl rand -base64 64

# Generate database password
openssl rand -base64 32
```

---

## Database Setup

### MySQL Production Configuration

#### Create Database and User

```sql
-- Connect as root
mysql -u root -p

-- Create production database
CREATE DATABASE leave_management_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'lms_prod_user'@'%' IDENTIFIED BY '<strong-password>';

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_management_prod.* TO 'lms_prod_user'@'%';
GRANT CREATE, ALTER, DROP, INDEX ON leave_management_prod.* TO 'lms_prod_user'@'%';
FLUSH PRIVILEGES;
```

#### MySQL Configuration Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Connection Settings
max_connections = 200
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600

# Buffer Pool Settings (adjust based on available RAM)
innodb_buffer_pool_size = 4G
innodb_buffer_pool_instances = 4

# Log Settings
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Character Set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# Binary Logging (for backups and replication)
log_bin = /var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds = 604800
max_binlog_size = 100M

# InnoDB Settings
innodb_flush_log_at_trx_commit = 2
innodb_log_buffer_size = 16M
innodb_file_per_table = 1
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Run Prisma Migrations

```bash
cd backend

# Set DATABASE_URL
export DATABASE_URL="mysql://lms_prod_user:password@db.company.com:3306/leave_management_prod"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify migration
npx prisma migrate status
```

### Seed Production Data

```bash
# Create admin user and initial policies
npx tsx prisma/seed-production.ts
```

Create `prisma/seed-production.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('Seeding production data...');

  // Create HR Admin
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12);

  const hrAdmin = await prisma.user.create({
    data: {
      employeeId: 'ADMIN001',
      email: 'admin@company.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'HR_ADMIN',
      department: 'Human Resources',
      location: 'Corporate',
      status: 'ACTIVE',
      country: 'INDIA',
      joiningDate: new Date(),
    },
  });

  console.log('Created HR Admin:', hrAdmin.email);

  // Create leave policies (India)
  const indiaPolicies = [
    {
      name: 'Casual Leave - India',
      leaveType: 'CASUAL_LEAVE',
      entitlementDays: 12,
      accrualRate: 1.0,
      maxCarryForward: 5,
      location: 'All',
      region: 'INDIA',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
    },
    {
      name: 'Sick Leave - India',
      leaveType: 'SICK_LEAVE',
      entitlementDays: 12,
      accrualRate: 1.0,
      maxCarryForward: 0,
      requiresDocumentation: true,
      documentationThreshold: 3,
      location: 'All',
      region: 'INDIA',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
    },
    {
      name: 'Privilege Leave - India',
      leaveType: 'PRIVILEGE_LEAVE',
      entitlementDays: 12,
      accrualRate: 1.0,
      maxCarryForward: 10,
      minimumGap: 7,
      location: 'All',
      region: 'INDIA',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
    },
    {
      name: 'Maternity Leave - India',
      leaveType: 'MATERNITY_LEAVE',
      entitlementDays: 180,
      requiresDocumentation: true,
      location: 'All',
      region: 'INDIA',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
    },
    {
      name: 'Paternity Leave - India',
      leaveType: 'PATERNITY_LEAVE',
      entitlementDays: 15,
      requiresDocumentation: true,
      location: 'All',
      region: 'INDIA',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
    },
  ];

  for (const policy of indiaPolicies) {
    await prisma.leavePolicy.create({ data: policy });
  }

  console.log('Created India leave policies');

  // Create holidays (example for 2025)
  const holidays2025 = [
    { name: 'New Year', date: new Date('2025-01-01'), location: 'All', region: 'INDIA' },
    { name: 'Republic Day', date: new Date('2025-01-26'), location: 'All', region: 'INDIA' },
    { name: 'Holi', date: new Date('2025-03-14'), location: 'All', region: 'INDIA' },
    { name: 'Independence Day', date: new Date('2025-08-15'), location: 'All', region: 'INDIA' },
    { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), location: 'All', region: 'INDIA' },
    { name: 'Diwali', date: new Date('2025-10-20'), location: 'All', region: 'INDIA' },
    { name: 'Christmas', date: new Date('2025-12-25'), location: 'All', region: 'INDIA' },
  ];

  for (const holiday of holidays2025) {
    await prisma.holiday.create({ data: holiday });
  }

  console.log('Created holidays for 2025');

  console.log('Production seed completed successfully!');
}

seedProduction()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Backend Deployment

### Option 1: PM2 (Process Manager)

#### Install PM2
```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'leave-backend',
    script: './dist/server.js',
    instances: 4, // Use 4 instances for load balancing
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
  }]
};
```

#### Build and Deploy

```bash
cd backend

# Install dependencies
npm ci --production=false

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### PM2 Management Commands

```bash
# View logs
pm2 logs leave-backend

# Monitor
pm2 monit

# Restart
pm2 restart leave-backend

# Stop
pm2 stop leave-backend

# Reload (zero-downtime)
pm2 reload leave-backend
```

### Option 2: Docker Deployment

#### Dockerfile (backend)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

#### Docker Compose

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: leave-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_SERVICE=${EMAIL_SERVICE}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    networks:
      - leave-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  db:
    image: mysql:8.0
    container_name: leave-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=leave_management_prod
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backup:/backup
    ports:
      - "3306:3306"
    networks:
      - leave-network
    command: --default-authentication-plugin=mysql_native_password

  nginx:
    image: nginx:alpine
    container_name: leave-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - leave-network

volumes:
  mysql_data:

networks:
  leave-network:
    driver: bridge
```

#### Build and Deploy with Docker

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=4
```

### Nginx Configuration

`nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server backend:3001 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_status 429;

    server {
        listen 80;
        server_name api.leavesystem.company.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.leavesystem.company.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Logging
        access_log /var/log/nginx/api_access.log;
        error_log /var/log/nginx/api_error.log;

        # API Proxy
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

---

## Frontend Deployment

### Build Production Bundle

```bash
cd frontend

# Install dependencies
npm ci

# Build production bundle
npm run build

# Output directory: dist/
```

### Option 1: Nginx Static Hosting

```nginx
server {
    listen 80;
    server_name leave.company.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name leave.company.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    root /var/www/leave-frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Deploy:
```bash
# Copy build files
sudo mkdir -p /var/www/leave-frontend
sudo cp -r dist/* /var/www/leave-frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/leave-frontend
sudo chmod -R 755 /var/www/leave-frontend

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Sync to S3
aws s3 sync dist/ s3://leave-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

---

## Security Hardening

### Application Security

#### Enable HTTPS Only
```typescript
// backend/src/server.ts
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

#### Security Headers (Helmet)
```typescript
import helmet from 'helmet';

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
```

#### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

app.use('/api/v1/auth/login', authLimiter);
```

#### Input Validation
```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/v1/leaves',
  [
    body('leaveType').isIn(['CASUAL_LEAVE', 'SICK_LEAVE', 'PRIVILEGE_LEAVE']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('reason').trim().isLength({ min: 10, max: 500 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### Database Security

#### Enable SSL Connection
```bash
DATABASE_URL="mysql://user:pass@host:3306/db?ssl=true&sslaccept=strict"
```

#### Limit User Privileges
```sql
-- Remove unnecessary privileges
REVOKE ALL PRIVILEGES ON leave_management_prod.* FROM 'lms_prod_user'@'%';

-- Grant only required privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_management_prod.* TO 'lms_prod_user'@'%';
```

### Firewall Configuration

```bash
# Allow SSH (from specific IP)
sudo ufw allow from 1.2.3.4 to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL (from backend server only)
sudo ufw allow from <backend-server-ip> to any port 3306

# Enable firewall
sudo ufw enable
```

---

## Monitoring & Logging

### Application Monitoring (New Relic)

```typescript
// backend/src/server.ts
if (process.env.NODE_ENV === 'production') {
  require('newrelic');
}
```

`newrelic.js`:
```javascript
exports.config = {
  app_name: ['Leave Management Backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'response.headers.set-cookie'
    ]
  }
};
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Structured Logging (Winston)

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'leave-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Health Check Endpoint

```typescript
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: 'OK',
      memory: 'OK',
      disk: 'OK'
    }
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.status = 'ERROR';
    health.checks.database = 'ERROR';
    return res.status(503).json(health);
  }

  // Memory check
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
    health.checks.memory = 'WARNING';
  }

  res.json(health);
});
```

---

## Backup & Recovery

### Database Backup Strategy

#### Automated Daily Backups

`backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="leave_management_prod"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
mysqldump -h db.company.com -u backup_user -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME | gzip > $BACKUP_DIR/lms_backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/lms_backup_$DATE.sql.gz \
  s3://company-backups/lms/daily/

# Remove old backups (older than 30 days)
find $BACKUP_DIR -name "lms_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: lms_backup_$DATE.sql.gz"
```

#### Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Restore Procedure

```bash
# Download backup from S3
aws s3 cp s3://company-backups/lms/daily/lms_backup_20250118_020000.sql.gz .

# Decompress
gunzip lms_backup_20250118_020000.sql.gz

# Restore
mysql -h db.company.com -u lms_prod_user -p leave_management_prod < lms_backup_20250118_020000.sql

# Verify
mysql -h db.company.com -u lms_prod_user -p leave_management_prod -e "SELECT COUNT(*) FROM users;"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: cd backend && npm ci

      - name: Run Backend Tests
        run: cd backend && npm test

      - name: Lint Backend
        run: cd backend && npm run lint

      - name: Install Frontend Dependencies
        run: cd frontend && npm ci

      - name: Run Frontend Tests
        run: cd frontend && npm test

      - name: Build Frontend
        run: cd frontend && npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build

      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SERVER_SSH_KEY }}
          source: "backend/dist,backend/package*.json,backend/prisma"
          target: "/opt/leave-backend"

      - name: Restart Backend
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SERVER_SSH_KEY }}
          script: |
            cd /opt/leave-backend/backend
            npm ci --production
            npx prisma generate
            pm2 reload leave-backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.PROD_API_URL }}

      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: 'us-east-1'
          SOURCE_DIR: 'frontend/dist'

      - name: Invalidate CloudFront
        uses: chetan/invalidate-cloudfront-action@v2
        env:
          DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
          PATHS: '/*'
          AWS_REGION: 'us-east-1'
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Post-Deployment Verification

### Automated Smoke Tests

`smoke-test.sh`:
```bash
#!/bin/bash

API_URL="https://api.leavesystem.company.com"
FRONTEND_URL="https://leave.company.com"

echo "Running smoke tests..."

# Test 1: API Health Check
echo "1. Testing API health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
  echo "✓ API health check passed"
else
  echo "✗ API health check failed (HTTP $HTTP_CODE)"
  exit 1
fi

# Test 2: Database Connection
echo "2. Testing database connection..."
RESPONSE=$(curl -s $API_URL/health)
DB_STATUS=$(echo $RESPONSE | jq -r '.checks.database')
if [ "$DB_STATUS" = "OK" ]; then
  echo "✓ Database connection passed"
else
  echo "✗ Database connection failed"
  exit 1
fi

# Test 3: Frontend Availability
echo "3. Testing frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $HTTP_CODE -eq 200 ]; then
  echo "✓ Frontend availability passed"
else
  echo "✗ Frontend availability failed (HTTP $HTTP_CODE)"
  exit 1
fi

# Test 4: Login Endpoint
echo "4. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"wrong"}')
ERROR_MESSAGE=$(echo $LOGIN_RESPONSE | jq -r '.message')
if [[ "$ERROR_MESSAGE" == *"Invalid"* ]]; then
  echo "✓ Login endpoint passed"
else
  echo "✗ Login endpoint failed"
  exit 1
fi

echo ""
echo "All smoke tests passed! ✓"
```

### Manual Verification Checklist

- [ ] Can access frontend at https://leave.company.com
- [ ] Can login with admin credentials
- [ ] Dashboard loads without errors
- [ ] Can view leave balances
- [ ] Can apply for leave
- [ ] Can approve/reject leaves (as manager)
- [ ] Email notifications working
- [ ] Calendar integration working
- [ ] Reports generating correctly
- [ ] Audit logs capturing actions
- [ ] No console errors in browser
- [ ] API response times < 500ms
- [ ] SSL certificate valid
- [ ] No security warnings

---

## Rollback Procedures

### Backend Rollback

#### PM2 Rollback
```bash
# List previous versions
pm2 list

# Rollback to previous version
cd /opt/leave-backend/previous-version
pm2 reload leave-backend
```

#### Docker Rollback
```bash
# Tag previous version
docker tag leave-backend:latest leave-backend:previous

# Deploy new version
docker tag leave-backend:v1.2.0 leave-backend:latest

# If issues, rollback
docker tag leave-backend:previous leave-backend:latest
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback

```bash
# Restore from backup
mysql -h db.company.com -u lms_prod_user -p leave_management_prod < backup_before_deployment.sql

# Or use Prisma migrate
cd backend
npx prisma migrate resolve --rolled-back 20250118120000_migration_name
```

### Frontend Rollback

#### S3 Rollback
```bash
# List previous versions
aws s3api list-object-versions --bucket leave-frontend-prod --prefix index.html

# Restore specific version
aws s3api copy-object \
  --bucket leave-frontend-prod \
  --copy-source leave-frontend-prod/index.html?versionId=VERSION_ID \
  --key index.html

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Backend Not Starting

**Symptoms**: PM2 shows "errored" status

**Diagnosis**:
```bash
pm2 logs leave-backend --err
```

**Common Causes**:
- Database connection failure (check DATABASE_URL)
- Missing environment variables
- Port already in use
- Prisma client not generated

**Solutions**:
```bash
# Check environment variables
pm2 env leave-backend

# Regenerate Prisma client
cd backend
npx prisma generate

# Check port usage
netstat -tulpn | grep 3001

# Restart with logs
pm2 restart leave-backend --watch
```

#### Issue 2: Database Connection Timeout

**Symptoms**: "Error: P1001: Can't reach database server"

**Diagnosis**:
```bash
# Test MySQL connection
mysql -h db.company.com -u lms_prod_user -p

# Check MySQL status
sudo systemctl status mysql

# Check firewall
sudo ufw status
```

**Solutions**:
```bash
# Restart MySQL
sudo systemctl restart mysql

# Update connection pool settings
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=60"

# Check max connections
mysql -e "SHOW VARIABLES LIKE 'max_connections';"
```

#### Issue 3: High Memory Usage

**Symptoms**: Server becomes unresponsive, PM2 restarts frequently

**Diagnosis**:
```bash
# Monitor memory
pm2 monit

# Check Node.js heap
node --max-old-space-size=512 dist/server.js
```

**Solutions**:
```bash
# Increase max memory in PM2
pm2 delete leave-backend
pm2 start ecosystem.config.js --max-memory-restart 1G

# Enable garbage collection
node --expose-gc dist/server.js
```

#### Issue 4: SSL Certificate Issues

**Symptoms**: "NET::ERR_CERT_AUTHORITY_INVALID"

**Solutions**:
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/nginx/ssl/fullchain.pem -noout -dates

# Test SSL configuration
sudo nginx -t
```

### Performance Optimization

#### Database Query Optimization

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Analyze slow queries
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- Add indexes
CREATE INDEX idx_leave_requests_employee_status ON leave_requests(employeeId, status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(startDate, endDate);
```

#### Backend Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

app.get('/api/v1/balances', async (req, res) => {
  const cacheKey = `balances_${req.user.id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId: req.user.id }
  });

  cache.set(cacheKey, balances);
  res.json(balances);
});
```

---

## Maintenance Windows

### Planned Maintenance Procedure

1. **Notify Users** (24-48 hours advance):
   - Send email to all users
   - Display banner on frontend
   - Update status page

2. **Pre-Maintenance**:
   ```bash
   # Backup database
   ./backup.sh

   # Backup current code
   cd /opt/leave-backend
   tar -czf backup-$(date +%Y%m%d).tar.gz *
   ```

3. **During Maintenance**:
   ```bash
   # Put system in maintenance mode
   pm2 stop leave-backend

   # Display maintenance page on Nginx
   # Update nginx.conf to return 503

   # Perform updates
   cd /opt/leave-backend
   git pull origin main
   npm ci
   npm run build
   npx prisma migrate deploy
   ```

4. **Post-Maintenance**:
   ```bash
   # Restart services
   pm2 start leave-backend

   # Run smoke tests
   ./smoke-test.sh

   # Monitor for 15 minutes
   pm2 logs leave-backend

   # Remove maintenance page
   # Restore nginx.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. **Notify Users**: Send completion email

---

## Support Contacts

**Development Team**:
- Email: dev-team@company.com
- Slack: #leave-management-dev

**Infrastructure Team**:
- Email: infra@company.com
- On-Call: +1-XXX-XXX-XXXX

**Database Team**:
- Email: dba@company.com
- On-Call: +1-XXX-XXX-XXXX

---

**Document Version**: 1.0
**Last Updated**: 2025-10-18
**Next Review**: 2025-11-18
