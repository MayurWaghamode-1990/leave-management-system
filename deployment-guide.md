# 🚀 Deployment Guide - Leave Management System

## Overview

This guide covers multiple deployment options for the Leave Management System, from development to enterprise production environments.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MySQL 8.0+ or compatible database
- Domain name and SSL certificates (for production)
- SMTP email service configured

## 🛠️ Deployment Options

### 1. Quick Start with Docker Compose (Recommended)

#### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd leave-management-system

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### Step 2: Configure Environment
Update `.env` with your settings:

```env
# Database
DB_PASSWORD=your-secure-password
DB_ROOT_PASSWORD=your-root-password

# JWT Secret (generate strong key)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Email Configuration
EMAIL_PROVIDER=GMAIL
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Company Settings
COMPANY_NAME=Your Company Name
FRONTEND_URL=http://your-domain.com
```

#### Step 3: Deploy
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 4: Initial Setup
```bash
# The system will automatically:
# - Create database tables
# - Run migrations
# - Seed initial data (in development mode)

# Access the application
# Frontend: http://localhost:8080
# API: http://localhost:8080/api/v1
# API Docs: http://localhost:8080/api/v1/docs
```

### 2. Production Deployment with SSL

#### Step 1: Domain and SSL Setup
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Place your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

#### Step 2: Production Environment
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Use strong passwords
JWT_SECRET=your-super-secure-jwt-secret-at-least-64-characters-long
DB_PASSWORD=super-secure-database-password
DB_ROOT_PASSWORD=super-secure-root-password

# Production email settings
EMAIL_PROVIDER=SENDGRID  # or your preferred provider
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Step 3: Enable HTTPS
```bash
# Uncomment HTTPS configuration in nginx/nginx.conf
nano nginx/nginx.conf

# Update server_name to your domain
# Uncomment SSL server block
# Uncomment HTTP to HTTPS redirect
```

#### Step 4: Deploy with SSL
```bash
# Start with nginx profile for reverse proxy
docker-compose --profile nginx up -d

# Access via HTTPS
# https://your-domain.com
```

### 3. Cloud Provider Deployment

#### AWS Deployment

1. **ECS with Fargate**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Tag and push images
docker build -t lms-backend ./backend
docker tag lms-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/lms-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/lms-backend:latest

docker build -t lms-frontend ./frontend
docker tag lms-frontend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/lms-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/lms-frontend:latest
```

2. **RDS Database Setup**
- Create MySQL 8.0 RDS instance
- Configure security groups
- Update DATABASE_URL in environment

3. **Application Load Balancer**
- Configure ALB with SSL termination
- Set up target groups for frontend/backend
- Configure health checks

#### Google Cloud Platform

1. **Cloud Run Deployment**
```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT-ID/lms-backend ./backend
gcloud run deploy lms-backend --image gcr.io/PROJECT-ID/lms-backend --platform managed

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT-ID/lms-frontend ./frontend
gcloud run deploy lms-frontend --image gcr.io/PROJECT-ID/lms-frontend --platform managed
```

2. **Cloud SQL Setup**
- Create Cloud SQL MySQL instance
- Configure connection and environment variables

#### Microsoft Azure

1. **Container Instances**
```bash
# Create resource group
az group create --name lms-rg --location eastus

# Deploy container group
az container create \
  --resource-group lms-rg \
  --file docker-compose.yml \
  --location eastus
```

2. **Azure Database for MySQL**
- Create managed MySQL instance
- Configure firewall rules
- Update connection strings

### 4. Kubernetes Deployment

#### Step 1: Create Kubernetes Manifests
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: lms

---
# k8s/mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: lms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "rootpassword"
        - name: MYSQL_DATABASE
          value: "leave_management_db"
        - name: MYSQL_USER
          value: "lms_user"
        - name: MYSQL_PASSWORD
          value: "password123"
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
```

#### Step 2: Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n lms
kubectl get services -n lms
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `DATABASE_URL` | MySQL connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `EMAIL_PROVIDER` | Email service provider | `GMAIL` | Yes |
| `SMTP_USER` | SMTP username | - | Yes |
| `SMTP_PASS` | SMTP password/API key | - | Yes |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` | Yes |
| `COMPANY_NAME` | Organization name | `Your Company` | No |

### Performance Tuning

#### Database Optimization
```env
# Connection pooling
DB_POOL_MIN=5
DB_POOL_MAX=20

# Query timeout
DB_TIMEOUT=30000
```

#### Email Performance
```env
# SMTP connection limits
SMTP_MAX_CONNECTIONS=10
SMTP_MAX_MESSAGES=100
SMTP_RATE_LIMIT=10
```

#### Caching
```env
# Redis configuration
REDIS_URL=redis://redis:6379
CACHE_TTL=3600
```

## 🚀 Health Checks and Monitoring

### Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Application health status |
| `/api/v1/monitoring/health` | Detailed health check |
| `/api/v1/monitoring/metrics` | Application metrics |

### Monitoring Setup

#### Docker Compose Monitoring
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

#### Application Metrics
The system exposes metrics at `/api/v1/monitoring/metrics`:
- Request count and duration
- Database connection status
- Email delivery status
- Active user sessions
- System resource usage

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Enable SSL/TLS encryption
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Network segmentation
- [ ] Access logging

### SSL/TLS Setup

1. **Let's Encrypt (Free)**
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d your-domain.com

# Auto-renewal
crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

2. **Custom Certificates**
```bash
# Place certificates in nginx/ssl/
cp your-cert.pem nginx/ssl/cert.pem
cp your-private-key.pem nginx/ssl/key.pem
```

## 📊 Backup Strategy

### Automated Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec lms-mysql mysqldump -u root -p$DB_ROOT_PASSWORD leave_management_db > backup_$DATE.sql

# Schedule daily backups
0 2 * * * /path/to/backup-script.sh
```

### File Backup
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🔄 Updates and Maintenance

### Rolling Updates
```bash
# Pull latest images
docker-compose pull

# Rolling restart (zero downtime)
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend
```

### Database Migrations
```bash
# Run migrations
docker exec lms-backend npx prisma migrate deploy

# Check migration status
docker exec lms-backend npx prisma migrate status
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
```bash
# Check MySQL status
docker-compose logs mysql

# Verify connection
docker exec lms-backend node -e "console.log(process.env.DATABASE_URL)"
```

2. **Email Not Sending**
```bash
# Test email configuration
curl -X GET "http://localhost:3001/api/v1/email/test-connection" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **High Memory Usage**
```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost:3001/api/v1/monitoring/metrics
```

### Log Analysis
```bash
# View application logs
docker-compose logs -f backend frontend

# Search for specific errors
docker-compose logs backend | grep ERROR

# Tail logs in real-time
docker-compose logs -f --tail=100
```

## 📞 Support

For deployment issues:
1. Check logs first: `docker-compose logs`
2. Verify environment variables
3. Check network connectivity
4. Review security configurations
5. Consult monitoring dashboards

This deployment guide provides comprehensive coverage for deploying the Leave Management System in various environments from development to enterprise production.