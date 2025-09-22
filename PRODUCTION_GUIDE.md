# 🏭 Production Environment Guide - Leave Management System

## Table of Contents
1. [Production Architecture](#production-architecture)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Security Configuration](#security-configuration)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Backup and Recovery](#backup-and-recovery)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Scaling Guidelines](#scaling-guidelines)
9. [Troubleshooting](#troubleshooting)
10. [Compliance and Auditing](#compliance-and-auditing)

---

## Production Architecture

### System Overview
```
Internet
    ↓
[Load Balancer/CDN]
    ↓
[Nginx Reverse Proxy] ← SSL Termination
    ↓
[Frontend (React)]    [Backend (Node.js)]
                           ↓
[Redis Cache] ← → [MySQL Database]
    ↓
[Monitoring Stack]
- Prometheus
- Grafana
- AlertManager
- ELK Stack
```

### Component Responsibilities

#### Load Balancer (AWS ALB/Cloudflare)
- SSL termination
- Traffic distribution
- Health checks
- DDoS protection
- Geographic load balancing

#### Nginx Reverse Proxy
- Request routing
- Rate limiting
- Static file serving
- Compression
- Security headers

#### Application Layer
- **Frontend**: React SPA served as static files
- **Backend**: Node.js API with clustering
- **Database**: MySQL with read replicas
- **Cache**: Redis for sessions and data caching

#### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **AlertManager**: Alert routing and notifications
- **ELK Stack**: Centralized logging and search

---

## Infrastructure Requirements

### Production Specifications

#### Minimum Requirements
```yaml
Application Servers:
  CPU: 4 vCPUs
  RAM: 8GB
  Storage: 50GB SSD
  Count: 2 (for high availability)

Database Server:
  CPU: 4 vCPUs
  RAM: 16GB
  Storage: 200GB SSD (with backup)
  Type: MySQL 8.0+

Cache Server:
  CPU: 2 vCPUs
  RAM: 4GB
  Storage: 20GB SSD
  Type: Redis 7+

Load Balancer:
  Type: Managed service (AWS ALB, GCP LB, etc.)
  SSL: Required
  Health Checks: Enabled
```

#### Recommended Production Setup
```yaml
Application Servers:
  CPU: 8 vCPUs
  RAM: 16GB
  Storage: 100GB SSD
  Count: 3-5 (autoscaling)

Database Server:
  CPU: 8 vCPUs
  RAM: 32GB
  Storage: 500GB SSD
  Read Replicas: 2
  Backup: Daily automated

Cache Cluster:
  CPU: 4 vCPUs
  RAM: 8GB
  Storage: 50GB SSD
  Nodes: 3 (Redis Cluster)

CDN:
  Provider: CloudFront, Cloudflare
  Caching: Static assets
  Compression: Enabled
```

### Cloud Provider Configurations

#### AWS Production Setup
```yaml
# VPC Configuration
VPC:
  CIDR: 10.0.0.0/16
  Availability Zones: 3

Subnets:
  Public:
    - 10.0.1.0/24 (AZ-a)
    - 10.0.2.0/24 (AZ-b)
    - 10.0.3.0/24 (AZ-c)
  Private:
    - 10.0.10.0/24 (AZ-a)
    - 10.0.20.0/24 (AZ-b)
    - 10.0.30.0/24 (AZ-c)

# ECS Cluster
ECS:
  Service: Fargate
  Task Definition:
    CPU: 2048
    Memory: 4096
  Auto Scaling:
    Min: 2
    Max: 10
    Target CPU: 70%

# RDS Configuration
RDS:
  Engine: MySQL 8.0
  Instance Class: db.r5.xlarge
  Multi-AZ: Yes
  Encryption: Yes
  Backup Retention: 30 days

# ElastiCache
ElastiCache:
  Engine: Redis 7.0
  Node Type: cache.r6g.large
  Num Nodes: 3
  Multi-AZ: Yes
```

#### Google Cloud Platform Setup
```yaml
# GKE Cluster
GKE:
  Node Pool:
    Machine Type: e2-standard-4
    Disk Size: 100GB
    Auto Scaling:
      Min: 2
      Max: 10

# Cloud SQL
Cloud SQL:
  Database: MySQL 8.0
  Tier: db-n1-standard-4
  High Availability: Yes
  Backup: Automated daily

# Memorystore
Memorystore:
  Tier: Standard
  Memory: 5GB
  Version: Redis 6.x
```

---

## Security Configuration

### SSL/TLS Configuration

#### Certificate Management
```bash
# Let's Encrypt with Certbot
certbot certonly --webroot -w /var/www/html -d your-domain.com

# Automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Firewall Configuration

#### AWS Security Groups
```yaml
# Application Load Balancer
ALB Security Group:
  Inbound:
    - Port 443 (HTTPS): 0.0.0.0/0
    - Port 80 (HTTP): 0.0.0.0/0 (redirect to HTTPS)
  Outbound:
    - All traffic to Application SG

# Application Servers
Application Security Group:
  Inbound:
    - Port 3001: ALB Security Group
    - Port 22: Bastion Host SG
  Outbound:
    - Port 3306: Database SG
    - Port 6379: Redis SG
    - Port 443: 0.0.0.0/0 (external APIs)

# Database
Database Security Group:
  Inbound:
    - Port 3306: Application SG
  Outbound:
    - None
```

### Application Security

#### Environment Variables (Production)
```env
# Security
NODE_ENV=production
JWT_SECRET=your-ultra-secure-jwt-secret-64-characters-minimum-production
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data-32-chars

# Database (use AWS Secrets Manager in production)
DATABASE_URL=mysql://user:password@rds-endpoint:3306/lms_prod

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window

# CORS
CORS_ORIGIN=https://your-domain.com

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

# Session Security
SESSION_SECURE=true
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

#### Database Security
```sql
-- Create production user with limited privileges
CREATE USER 'lms_app'@'%' IDENTIFIED BY 'complex_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_production.* TO 'lms_app'@'%';

-- Remove default/test accounts
DROP USER IF EXISTS 'root'@'%';
DROP USER IF EXISTS ''@'%';

-- Enable SSL
REQUIRE SSL;

-- Enable audit logging
SET GLOBAL general_log = 'ON';
SET GLOBAL log_output = 'TABLE';
```

---

## Performance Optimization

### Application Performance

#### Node.js Optimization
```javascript
// server.js production configuration
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Start the application
  require('./app.js');
  console.log(`Worker ${process.pid} started`);
}
```

#### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'lms-backend',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

### Database Optimization

#### MySQL Configuration (my.cnf)
```ini
[mysqld]
# Performance settings
innodb_buffer_pool_size = 8G
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 500
max_connect_errors = 10000
connect_timeout = 60
wait_timeout = 28800

# Query cache
query_cache_type = 1
query_cache_size = 128M

# Binary logging
log-bin = mysql-bin
expire_logs_days = 7
```

#### Database Indexes
```sql
-- Optimize common queries
CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_approvals_approver_status ON approvals(approver_id, status);

-- Composite indexes for complex queries
CREATE INDEX idx_leave_requests_complex ON leave_requests(user_id, status, start_date, end_date);
```

### Caching Strategy

#### Redis Configuration
```conf
# redis.conf production settings
maxmemory 4gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 0

# Persistence
save 900 1
save 300 10
save 60 10000

# Append only file
appendonly yes
appendfsync everysec
```

#### Application Caching
```javascript
// Cache configuration
const cacheConfig = {
  // User sessions
  session: { ttl: 3600 }, // 1 hour

  // Leave balance cache
  leaveBalance: { ttl: 1800 }, // 30 minutes

  // Leave policies cache
  policies: { ttl: 86400 }, // 24 hours

  // API response cache
  apiResponses: { ttl: 300 } // 5 minutes
};
```

### Frontend Optimization

#### Build Optimization
```javascript
// vite.config.js production
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
          utils: ['date-fns', 'lodash']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

#### CDN Configuration
```javascript
// CloudFront distribution settings
{
  "Origins": [{
    "DomainName": "your-app-bucket.s3.amazonaws.com",
    "OriginPath": "",
    "CustomOriginConfig": {
      "HTTPPort": 443,
      "OriginProtocolPolicy": "https-only"
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-app-bucket",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "optimized-caching-policy",
    "Compress": true,
    "TTL": {
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    }
  }
}
```

---

## Monitoring and Alerting

### Metrics Collection

#### Application Metrics
```javascript
// Custom metrics collection
const prometheus = require('prom-client');

// Request duration histogram
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Active connections gauge
const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Business metrics
const leaveRequestsTotal = new prometheus.Counter({
  name: 'leave_requests_total',
  help: 'Total number of leave requests',
  labelNames: ['status', 'type']
});
```

#### Health Check Endpoints
```javascript
// Comprehensive health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = { status: 'up', latency: 0 };

    // Redis check
    await redis.ping();
    health.checks.redis = { status: 'up', latency: 0 };

    // External API checks
    health.checks.email = await checkEmailService();

    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.error = error.message;
    res.status(503).json(health);
  }
});
```

### Alert Configuration

#### Critical Alerts
```yaml
# AlertManager configuration
groups:
- name: lms-critical
  rules:
  - alert: ApplicationDown
    expr: up{job="lms-backend"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "LMS application is down"

  - alert: DatabaseConnections
    expr: mysql_global_status_threads_connected > 450
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High database connections"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
```

#### Notification Channels
```yaml
# notification channels
receivers:
- name: 'critical-alerts'
  email_configs:
  - to: 'sre-team@company.com'
    subject: '[CRITICAL] LMS Alert'

  slack_configs:
  - api_url: 'https://hooks.slack.com/services/...'
    channel: '#alerts'

  pagerduty_configs:
  - service_key: 'your-pagerduty-key'
```

### Dashboard Configuration

#### Grafana Dashboard JSON
```json
{
  "dashboard": {
    "title": "LMS Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100"
          }
        ],
        "thresholds": [5, 10]
      }
    ]
  }
}
```

---

## Backup and Recovery

### Database Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
RETENTION_DAYS=30

# Create backup
mysqldump \
  --host=$DB_HOST \
  --user=$DB_USER \
  --password=$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME | gzip > $BACKUP_DIR/lms_backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/lms_backup_$DATE.sql.gz \
  s3://your-backup-bucket/database/

# Cleanup old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
gunzip -t $BACKUP_DIR/lms_backup_$DATE.sql.gz
if [ $? -eq 0 ]; then
  echo "Backup created successfully: lms_backup_$DATE.sql.gz"
else
  echo "Backup verification failed!" >&2
  exit 1
fi
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1
RESTORE_DATE=$2

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file> [restore_date]"
  exit 1
fi

# Stop application
systemctl stop lms-backend

# Create restoration database
mysql -u root -p$ROOT_PASSWORD -e "CREATE DATABASE lms_restore;"

# Restore from backup
gunzip -c $BACKUP_FILE | mysql -u root -p$ROOT_PASSWORD lms_restore

# Point-in-time recovery (if restore_date provided)
if [ -n "$RESTORE_DATE" ]; then
  mysqlbinlog --stop-datetime="$RESTORE_DATE" /var/log/mysql/mysql-bin.* | \
    mysql -u root -p$ROOT_PASSWORD lms_restore
fi

# Switch databases
mysql -u root -p$ROOT_PASSWORD << EOF
RENAME TABLE lms_production TO lms_production_old;
RENAME TABLE lms_restore TO lms_production;
EOF

# Start application
systemctl start lms-backend
```

### Application Backup

#### File Backup Strategy
```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads/

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /app/.env \
  /etc/nginx/sites-available/lms \
  /etc/systemd/system/lms-backend.service

# Upload to S3
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/files/

# Cleanup local backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Disaster Recovery Plan

#### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Maximum Tolerable Downtime**: 8 hours

#### Recovery Procedures
1. **Infrastructure Recovery**
   - Deploy infrastructure using IaC templates
   - Restore load balancer and DNS configuration
   - Provision new application servers

2. **Data Recovery**
   - Restore database from latest backup
   - Apply binary logs for point-in-time recovery
   - Restore uploaded files from S3

3. **Application Recovery**
   - Deploy latest application version
   - Run database migrations if needed
   - Verify system functionality

4. **Validation**
   - Run smoke tests
   - Verify critical user journeys
   - Check data integrity
   - Monitor system performance

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Check system health dashboards
- [ ] Review error logs and alerts
- [ ] Monitor performance metrics
- [ ] Verify backup completion
- [ ] Check SSL certificate status

#### Weekly Tasks
- [ ] Review security scan results
- [ ] Analyze performance trends
- [ ] Update dependency vulnerabilities
- [ ] Review system capacity
- [ ] Clean up old log files

#### Monthly Tasks
- [ ] Update system packages
- [ ] Review and update monitoring thresholds
- [ ] Conduct disaster recovery test
- [ ] Review access controls and permissions
- [ ] Update documentation

#### Quarterly Tasks
- [ ] Security audit and penetration testing
- [ ] Capacity planning review
- [ ] Business continuity plan update
- [ ] Performance optimization review
- [ ] Update incident response procedures

### Maintenance Windows

#### Scheduled Maintenance
```bash
# Maintenance window script
#!/bin/bash

echo "Starting maintenance window..."

# 1. Enable maintenance mode
curl -X POST http://localhost:3001/admin/maintenance/enable

# 2. Stop accepting new requests
# Update load balancer to redirect traffic

# 3. Wait for active requests to complete
sleep 30

# 4. Perform maintenance tasks
systemctl stop lms-backend
# Run updates, migrations, etc.
systemctl start lms-backend

# 5. Verify system health
./scripts/health-check.sh

# 6. Disable maintenance mode
curl -X POST http://localhost:3001/admin/maintenance/disable

echo "Maintenance window completed"
```

### Update Procedures

#### Application Updates
```bash
#!/bin/bash
# Rolling update procedure

# 1. Build new version
docker build -t lms:$NEW_VERSION .

# 2. Update one instance at a time
for instance in instance1 instance2 instance3; do
  echo "Updating $instance..."

  # Remove from load balancer
  aws elbv2 deregister-targets --target-group-arn $TG_ARN \
    --targets Id=$instance

  # Wait for connections to drain
  sleep 60

  # Deploy new version
  docker stop lms-$instance
  docker run -d --name lms-$instance lms:$NEW_VERSION

  # Health check
  while ! curl -f http://$instance:3001/health; do
    sleep 5
  done

  # Add back to load balancer
  aws elbv2 register-targets --target-group-arn $TG_ARN \
    --targets Id=$instance

  echo "$instance updated successfully"
done
```

---

## Scaling Guidelines

### Horizontal Scaling

#### Auto Scaling Configuration
```yaml
# AWS Auto Scaling Group
AutoScalingGroup:
  MinSize: 2
  MaxSize: 10
  DesiredCapacity: 3
  TargetGroupARNs:
    - !Ref ApplicationTargetGroup

  Policies:
    ScaleUp:
      MetricName: CPUUtilization
      TargetValue: 70
      ScaleUpCooldown: 300

    ScaleDown:
      MetricName: CPUUtilization
      TargetValue: 30
      ScaleDownCooldown: 900
```

#### Load Testing for Scaling
```javascript
// K6 load test for scaling validation
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up
    { duration: '10m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 200 },   // Scale up
    { duration: '10m', target: 200 },  // Test at 200 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### Database Scaling

#### Read Replica Configuration
```sql
-- Create read replica
CREATE REPLICA lms_read_replica_1
FROM lms_production
WITH (
  AVAILABILITY_ZONE = 'us-west-2b',
  INSTANCE_CLASS = 'db.r5.large'
);

-- Application connection routing
const dbConfig = {
  write: {
    host: 'lms-production.cluster-xxx.us-west-2.rds.amazonaws.com',
    port: 3306,
    database: 'lms_production'
  },
  read: {
    host: 'lms-read-replica.cluster-xxx.us-west-2.rds.amazonaws.com',
    port: 3306,
    database: 'lms_production'
  }
};
```

#### Database Partitioning Strategy
```sql
-- Partition leave_requests table by year
ALTER TABLE leave_requests
PARTITION BY RANGE (YEAR(start_date)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## Troubleshooting

### Common Production Issues

#### High CPU Usage
```bash
# Investigate high CPU
top -p $(pgrep -f "node.*lms")
perf top -p $(pgrep -f "node.*lms")

# Check for infinite loops or heavy operations
node --prof app.js
node --prof-process isolate-xxx-v8.log > processed.txt
```

#### Memory Leaks
```bash
# Monitor memory usage
while true; do
  ps aux | grep node | grep -v grep
  sleep 60
done

# Generate heap dump
kill -USR2 $(pgrep -f "node.*lms")

# Analyze heap dump
node --inspect-brk=0.0.0.0:9229 app.js
```

#### Database Performance Issues
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log
WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY query_time DESC;

-- Check locks
SHOW ENGINE INNODB STATUS;

-- Optimize queries
EXPLAIN SELECT * FROM leave_requests
WHERE user_id = 123 AND status = 'PENDING';
```

### Log Analysis

#### Application Logs
```bash
# Search for errors
grep -i error /var/log/lms/app.log | tail -100

# Monitor real-time logs
tail -f /var/log/lms/app.log | grep -i "error\|warn"

# Analyze patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

#### ELK Stack Queries
```json
// Elasticsearch query for errors
{
  "query": {
    "bool": {
      "must": [
        {"match": {"level": "error"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  },
  "aggs": {
    "error_types": {
      "terms": {"field": "message.keyword"}
    }
  }
}
```

---

## Compliance and Auditing

### Security Compliance

#### SOC 2 Compliance Checklist
- [ ] Data encryption at rest and in transit
- [ ] Access controls and authentication
- [ ] Audit logging and monitoring
- [ ] Incident response procedures
- [ ] Change management processes
- [ ] Backup and recovery procedures
- [ ] Vendor risk management

#### GDPR Compliance
- [ ] Data processing agreements
- [ ] Right to erasure implementation
- [ ] Data portability features
- [ ] Privacy by design principles
- [ ] Consent management
- [ ] Data breach notification procedures

### Audit Logging

#### Application Audit Events
```javascript
// Audit logging middleware
const auditLogger = (action, resource, user, details) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    user: user.id,
    ip: user.ip,
    userAgent: user.userAgent,
    details,
    requestId: user.requestId
  };

  // Log to audit database
  prisma.auditLog.create({ data: auditLog });

  // Log to secure log file
  audit.info('AUDIT', auditLog);
};

// Usage examples
auditLogger('CREATE', 'LEAVE_REQUEST', user, { requestId });
auditLogger('APPROVE', 'LEAVE_REQUEST', approver, { requestId, decision });
auditLogger('LOGIN', 'USER_SESSION', user, { successful: true });
```

#### System Audit Configuration
```bash
# auditd configuration for file access
echo "-w /app/uploads -p wa -k file_access" >> /etc/audit/rules.d/lms.rules
echo "-w /app/.env -p wa -k config_change" >> /etc/audit/rules.d/lms.rules

# Restart auditd
systemctl restart auditd

# Search audit logs
ausearch -k file_access -ts today
```

### Reporting and Analytics

#### Compliance Reports
```sql
-- Data access report
SELECT
  u.email,
  COUNT(*) as access_count,
  MAX(al.timestamp) as last_access
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action = 'VIEW'
  AND al.resource = 'LEAVE_REQUEST'
  AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY u.id
ORDER BY access_count DESC;

-- Data retention report
SELECT
  table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM information_schema.tables t
JOIN (
  SELECT 'leave_requests' as table_name, created_at FROM leave_requests
  UNION ALL
  SELECT 'users' as table_name, created_at FROM users
) data ON data.table_name = t.table_name
GROUP BY table_name;
```

---

## Final Production Checklist

### Pre-Deployment Verification
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan results reviewed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] SSL certificates installed and verified
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] Team training completed

### Go-Live Checklist
- [ ] DNS records updated
- [ ] Load balancer configured
- [ ] SSL certificates active
- [ ] Application deployed and healthy
- [ ] Database connections verified
- [ ] Cache services running
- [ ] Monitoring dashboards accessible
- [ ] Alert notifications working
- [ ] Smoke tests passed
- [ ] Performance within acceptable limits

### Post-Deployment Tasks
- [ ] Monitor system for 24 hours
- [ ] Verify all integrations working
- [ ] Check error rates and performance
- [ ] Validate user workflows
- [ ] Update runbooks if needed
- [ ] Schedule first backup verification
- [ ] Plan first maintenance window
- [ ] Document lessons learned

---

*This production guide should be reviewed and updated quarterly or after any major system changes.*
*For production support: [PRODUCTION_SUPPORT_EMAIL]*
*Last updated: [Current Date]*