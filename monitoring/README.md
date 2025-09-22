# 📊 Monitoring and Logging Setup

## Overview

This directory contains comprehensive monitoring and logging configuration for the Leave Management System, including:

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Dashboards and visualization
- **AlertManager** - Alert routing and notification
- **ELK Stack** - Centralized logging (Elasticsearch, Logstash, Kibana)
- **Filebeat** - Log shipping
- **Jaeger** - Distributed tracing
- **Custom Monitoring Service** - Application-specific metrics

## Quick Start

### 1. Basic Monitoring (Prometheus + Grafana)
```bash
# Start core monitoring stack
docker-compose --profile monitoring up -d

# Access dashboards
# Grafana: http://localhost:3000 (admin/admin123)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### 2. Full Monitoring Stack (with ELK)
```bash
# Start complete monitoring and logging
docker-compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up -d

# Additional access points
# Kibana: http://localhost:5601
# Elasticsearch: http://localhost:9200
# Jaeger: http://localhost:16686
# Redis Insight: http://localhost:8001
```

## Monitoring Components

### Prometheus Metrics
The application exposes metrics at `/api/v1/monitoring/metrics`:

```
# Application metrics
lms_requests_total - Total HTTP requests
lms_request_errors_total - Total HTTP errors
lms_request_duration_ms - Average response time
lms_memory_usage_bytes - Memory usage
lms_cpu_usage_percent - CPU usage
lms_database_queries_total - Database queries
lms_email_sent_total - Emails sent
lms_active_users - Current active users
```

### Grafana Dashboards
Pre-configured dashboards include:
- **System Overview** - Key performance indicators
- **Request Metrics** - HTTP request patterns and performance
- **Resource Usage** - CPU, memory, and disk utilization
- **Error Tracking** - Error rates and patterns
- **Business Metrics** - User activity and application usage

### Alert Rules
Configured alerts for:
- High memory usage (>80%)
- High CPU usage (>80%)
- High error rate (>10%)
- Slow response times (>5s)
- Service downtime
- Database connection issues
- Email delivery problems

### Log Management
Structured logging with:
- **Request/Response logging** - All HTTP traffic
- **Performance monitoring** - Response times and resource usage
- **Error tracking** - Detailed error information with stack traces
- **Business event logging** - Leave requests, approvals, etc.
- **Security logging** - Authentication and authorization events

## Configuration

### Environment Variables
```env
# Monitoring
GRAFANA_PASSWORD=admin123
PROMETHEUS_RETENTION=200h

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Alerts
SUPPORT_EMAIL=admin@yourcompany.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Custom Metrics
Add custom metrics in your application:

```typescript
import { monitoringService } from '../services/monitoringService';

// Record request metrics
monitoringService.recordRequest(responseTime, isError);

// Record database operations
monitoringService.recordDatabaseQuery(isError);

// Update user metrics
monitoringService.updateActiveUsers(count);
```

### Health Checks
Built-in health checks:
- Database connectivity
- Email service status
- Disk space usage
- External API availability

Access health status: `GET /api/v1/monitoring/health`

## Alerting

### Email Alerts
Configure SMTP settings in AlertManager for email notifications:

```yaml
smtp_smarthost: 'smtp.gmail.com:587'
smtp_from: 'alerts@yourcompany.com'
smtp_auth_username: 'your-email@gmail.com'
smtp_auth_password: 'your-app-password'
```

### Slack Integration
Add Slack webhook URL for real-time notifications:

```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/...'
    channel: '#alerts'
```

## Log Analysis

### Kibana Queries
Common log analysis queries:

```
# Find all errors
level:error

# High response times
responseTime:>5000

# Specific user activity
userId:"user123"

# Database errors
message:"database" AND level:error

# Security events
tags:"security" OR message:"auth"
```

### Performance Analysis
Monitor slow requests and performance bottlenecks:

```
# Slow endpoints
responseTime:>1000 AND url:"/api/*"

# Memory leaks
message:"memory" AND level:warn

# High CPU usage
message:"cpu" AND level:warn
```

## Troubleshooting

### Common Issues

1. **Prometheus not scraping metrics**
   - Check application health: `curl http://localhost:3001/health`
   - Verify metrics endpoint: `curl http://localhost:3001/api/v1/monitoring/metrics`

2. **Grafana showing no data**
   - Verify Prometheus data source connection
   - Check time range in dashboard
   - Confirm metrics are being generated

3. **Logs not appearing in Kibana**
   - Check Filebeat status: `docker logs lms-filebeat`
   - Verify Logstash pipeline: `docker logs lms-logstash`
   - Check Elasticsearch health: `curl http://localhost:9200/_cluster/health`

4. **Alerts not firing**
   - Check AlertManager configuration
   - Verify SMTP/Slack settings
   - Review alert rule syntax in Prometheus

### Performance Tuning

1. **Reduce monitoring overhead**
   ```env
   # Increase scrape intervals
   PROMETHEUS_SCRAPE_INTERVAL=30s

   # Reduce log verbosity in production
   LOG_LEVEL=warn
   ```

2. **Optimize storage**
   ```env
   # Reduce retention period
   PROMETHEUS_RETENTION=30d

   # Enable log compression
   LOG_COMPRESSION=true
   ```

## Security Considerations

1. **Secure dashboards**
   - Change default Grafana admin password
   - Enable HTTPS for external access
   - Configure user authentication

2. **Protect metrics endpoints**
   - Restrict access to monitoring ports
   - Use network segmentation
   - Enable authentication for sensitive metrics

3. **Log security**
   - Sanitize sensitive data in logs
   - Encrypt log transmission
   - Implement log retention policies

## Maintenance

### Regular Tasks
- Review and update alert thresholds
- Clean up old logs and metrics
- Update monitoring stack versions
- Review and optimize dashboard queries

### Backup
```bash
# Backup Grafana dashboards
docker exec lms-grafana grafana-cli admin export-dashboard > backup/dashboards.json

# Backup Prometheus data
docker run --rm -v prometheus_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz /data

# Backup Elasticsearch indices
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_$(date +%Y%m%d)"
```

This monitoring setup provides comprehensive observability for your Leave Management System, enabling proactive issue detection and performance optimization.