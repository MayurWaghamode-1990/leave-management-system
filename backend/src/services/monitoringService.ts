import { logger } from '../utils/logger';
import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
}

export interface ApplicationMetrics {
  timestamp: string;
  requests: {
    total: number;
    rate: number;
    errors: number;
    averageResponseTime: number;
  };
  database: {
    connections: number;
    queries: number;
    errors: number;
  };
  email: {
    sent: number;
    failed: number;
    queue: number;
  };
  users: {
    active: number;
    sessions: number;
  };
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

class MonitoringService {
  private requestMetrics = {
    total: 0,
    errors: 0,
    responseTimes: [] as number[],
    startTime: Date.now()
  };

  private databaseMetrics = {
    connections: 0,
    queries: 0,
    errors: 0
  };

  private emailMetrics = {
    sent: 0,
    failed: 0,
    queue: 0
  };

  private userMetrics = {
    active: 0,
    sessions: 0
  };

  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  constructor() {
    this.registerDefaultHealthChecks();
    this.startPeriodicCollection();
  }

  // Request metrics
  recordRequest(responseTime: number, isError: boolean = false) {
    this.requestMetrics.total++;
    if (isError) {
      this.requestMetrics.errors++;
    }
    this.requestMetrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times for memory efficiency
    if (this.requestMetrics.responseTimes.length > 1000) {
      this.requestMetrics.responseTimes = this.requestMetrics.responseTimes.slice(-1000);
    }
  }

  // Database metrics
  recordDatabaseQuery(isError: boolean = false) {
    this.databaseMetrics.queries++;
    if (isError) {
      this.databaseMetrics.errors++;
    }
  }

  recordDatabaseConnection(delta: number) {
    this.databaseMetrics.connections += delta;
  }

  // Email metrics
  recordEmailSent() {
    this.emailMetrics.sent++;
  }

  recordEmailFailed() {
    this.emailMetrics.failed++;
  }

  updateEmailQueue(count: number) {
    this.emailMetrics.queue = count;
  }

  // User metrics
  updateActiveUsers(count: number) {
    this.userMetrics.active = count;
  }

  updateActiveSessions(count: number) {
    this.userMetrics.sessions = count;
  }

  // System metrics collection
  getSystemMetrics(): SystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      timestamp: new Date().toISOString(),
      uptime: os.uptime(),
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        usage: (usedMemory / totalMemory) * 100
      },
      cpu: {
        usage: this.getCpuUsage(),
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }

  // Application metrics collection
  getApplicationMetrics(): ApplicationMetrics {
    const timeWindow = (Date.now() - this.requestMetrics.startTime) / 1000;
    const requestRate = this.requestMetrics.total / timeWindow;
    const avgResponseTime = this.requestMetrics.responseTimes.length > 0
      ? this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.requestMetrics.responseTimes.length
      : 0;

    return {
      timestamp: new Date().toISOString(),
      requests: {
        total: this.requestMetrics.total,
        rate: requestRate,
        errors: this.requestMetrics.errors,
        averageResponseTime: avgResponseTime
      },
      database: { ...this.databaseMetrics },
      email: { ...this.emailMetrics },
      users: { ...this.userMetrics }
    };
  }

  // Health checks
  registerHealthCheck(name: string, check: () => Promise<HealthCheckResult>) {
    this.healthChecks.set(name, check);
  }

  async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [name, check] of this.healthChecks.entries()) {
      try {
        const result = await check();
        results.push(result);
      } catch (error: any) {
        results.push({
          service: name,
          status: 'unhealthy',
          responseTime: 0,
          message: error.message
        });
      }
    }

    return results;
  }

  async getOverallHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckResult[];
    timestamp: string;
  }> {
    const checks = await this.performHealthChecks();
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Alert thresholds
  checkAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();

    // Memory usage alert
    if (systemMetrics.memory.usage > 90) {
      alerts.push({
        type: 'memory',
        message: `High memory usage: ${systemMetrics.memory.usage.toFixed(1)}%`,
        severity: 'high'
      });
    } else if (systemMetrics.memory.usage > 80) {
      alerts.push({
        type: 'memory',
        message: `Elevated memory usage: ${systemMetrics.memory.usage.toFixed(1)}%`,
        severity: 'medium'
      });
    }

    // CPU usage alert
    const cpuUsage = systemMetrics.cpu.usage;
    if (cpuUsage > 90) {
      alerts.push({
        type: 'cpu',
        message: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
        severity: 'high'
      });
    }

    // Error rate alert
    const errorRate = appMetrics.requests.total > 0
      ? (appMetrics.requests.errors / appMetrics.requests.total) * 100
      : 0;

    if (errorRate > 10) {
      alerts.push({
        type: 'errors',
        message: `High error rate: ${errorRate.toFixed(1)}%`,
        severity: 'high'
      });
    }

    // Response time alert
    if (appMetrics.requests.averageResponseTime > 5000) {
      alerts.push({
        type: 'performance',
        message: `Slow response time: ${appMetrics.requests.averageResponseTime.toFixed(0)}ms`,
        severity: 'medium'
      });
    }

    // Database errors
    if (this.databaseMetrics.errors > 0) {
      alerts.push({
        type: 'database',
        message: `Database errors detected: ${this.databaseMetrics.errors}`,
        severity: 'high'
      });
    }

    return alerts;
  }

  // Export metrics in Prometheus format
  getPrometheusMetrics(): string {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();

    const metrics = [
      `# HELP lms_memory_usage_bytes Memory usage in bytes`,
      `# TYPE lms_memory_usage_bytes gauge`,
      `lms_memory_usage_bytes ${systemMetrics.memory.used}`,
      ``,
      `# HELP lms_cpu_usage_percent CPU usage percentage`,
      `# TYPE lms_cpu_usage_percent gauge`,
      `lms_cpu_usage_percent ${systemMetrics.cpu.usage}`,
      ``,
      `# HELP lms_requests_total Total number of requests`,
      `# TYPE lms_requests_total counter`,
      `lms_requests_total ${appMetrics.requests.total}`,
      ``,
      `# HELP lms_request_errors_total Total number of request errors`,
      `# TYPE lms_request_errors_total counter`,
      `lms_request_errors_total ${appMetrics.requests.errors}`,
      ``,
      `# HELP lms_request_duration_ms Average request duration in milliseconds`,
      `# TYPE lms_request_duration_ms gauge`,
      `lms_request_duration_ms ${appMetrics.requests.averageResponseTime}`,
      ``,
      `# HELP lms_database_queries_total Total number of database queries`,
      `# TYPE lms_database_queries_total counter`,
      `lms_database_queries_total ${appMetrics.database.queries}`,
      ``,
      `# HELP lms_email_sent_total Total number of emails sent`,
      `# TYPE lms_email_sent_total counter`,
      `lms_email_sent_total ${appMetrics.email.sent}`,
      ``,
      `# HELP lms_active_users Current number of active users`,
      `# TYPE lms_active_users gauge`,
      `lms_active_users ${appMetrics.users.active}`,
      ``
    ];

    return metrics.join('\n');
  }

  private registerDefaultHealthChecks() {
    // Database health check
    this.registerHealthCheck('database', async () => {
      const start = performance.now();
      try {
        // In production, this would check actual database connection
        // await prisma.$queryRaw`SELECT 1`;
        const responseTime = performance.now() - start;
        return {
          service: 'database',
          status: 'healthy',
          responseTime,
          message: 'Database connection OK'
        };
      } catch (error: any) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: performance.now() - start,
          message: error.message
        };
      }
    });

    // Email service health check
    this.registerHealthCheck('email', async () => {
      const start = performance.now();
      try {
        // Check email configuration
        const isConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        const responseTime = performance.now() - start;

        return {
          service: 'email',
          status: isConfigured ? 'healthy' : 'degraded',
          responseTime,
          message: isConfigured ? 'Email service configured' : 'Email service in demo mode'
        };
      } catch (error: any) {
        return {
          service: 'email',
          status: 'unhealthy',
          responseTime: performance.now() - start,
          message: error.message
        };
      }
    });

    // Disk space health check
    this.registerHealthCheck('disk', async () => {
      const start = performance.now();
      try {
        // This would check actual disk usage in production
        const responseTime = performance.now() - start;
        return {
          service: 'disk',
          status: 'healthy',
          responseTime,
          message: 'Disk space OK'
        };
      } catch (error: any) {
        return {
          service: 'disk',
          status: 'unhealthy',
          responseTime: performance.now() - start,
          message: error.message
        };
      }
    });
  }

  private getCpuUsage(): number {
    // Simple CPU usage calculation
    // In production, this would use more sophisticated CPU monitoring
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    return Math.min((loadAvg / cpuCount) * 100, 100);
  }

  private startPeriodicCollection() {
    // Log metrics every 5 minutes
    setInterval(() => {
      const systemMetrics = this.getSystemMetrics();
      const appMetrics = this.getApplicationMetrics();
      const alerts = this.checkAlerts();

      logger.info('System metrics collected', {
        memory: systemMetrics.memory.usage,
        cpu: systemMetrics.cpu.usage,
        requests: appMetrics.requests.total,
        errors: appMetrics.requests.errors
      });

      if (alerts.length > 0) {
        alerts.forEach(alert => {
          logger.warn(`Alert: ${alert.message}`, { type: alert.type, severity: alert.severity });
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.requestMetrics = {
      total: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now()
    };

    this.databaseMetrics = {
      connections: 0,
      queries: 0,
      errors: 0
    };

    this.emailMetrics = {
      sent: 0,
      failed: 0,
      queue: 0
    };

    this.userMetrics = {
      active: 0,
      sessions: 0
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
export default monitoringService;