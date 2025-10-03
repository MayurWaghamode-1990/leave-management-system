import React, { useEffect, useState } from 'react';
import { Fab, Tooltip, Badge } from '@mui/material';
import { Speed, Warning } from '@mui/icons-material';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  errorCount: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    errorCount: 0
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setVisible(true);
      measurePerformance();
    }
  }, []);

  const measurePerformance = () => {
    // Measure page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;

    // Measure memory usage (if available)
    const memory = (performance as any).memory;
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

    // Count network requests
    const resources = performance.getEntriesByType('resource');
    const networkRequests = resources.length;

    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalRenderTime = 0;

      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('render')) {
          totalRenderTime += entry.duration;
        }
      });

      setMetrics(prev => ({
        ...prev,
        renderTime: totalRenderTime
      }));
    });

    observer.observe({ entryTypes: ['measure'] });

    setMetrics({
      loadTime: Math.round(loadTime),
      renderTime: 0,
      memoryUsage,
      networkRequests,
      errorCount: 0
    });

    // Clean up
    return () => observer.disconnect();
  };

  const getPerformanceStatus = () => {
    if (metrics.loadTime > 3000 || metrics.memoryUsage > 100) {
      return { color: 'error', severity: 'high' };
    } else if (metrics.loadTime > 2000 || metrics.memoryUsage > 50) {
      return { color: 'warning', severity: 'medium' };
    }
    return { color: 'success', severity: 'good' };
  };

  if (!visible) return null;

  const status = getPerformanceStatus();

  return (
    <Tooltip
      title={
        <div>
          <div><strong>Performance Metrics</strong></div>
          <div>Load Time: {metrics.loadTime}ms</div>
          <div>Memory Usage: {metrics.memoryUsage}MB</div>
          <div>Network Requests: {metrics.networkRequests}</div>
          <div>Status: {status.severity}</div>
        </div>
      }
      placement="left"
    >
      <Fab
        size="small"
        color={status.color as any}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000,
          opacity: 0.7,
          '&:hover': { opacity: 1 }
        }}
      >
        <Badge
          badgeContent={status.severity === 'high' ? '!' : null}
          color="error"
        >
          {status.severity === 'high' ? <Warning /> : <Speed />}
        </Badge>
      </Fab>
    </Tooltip>
  );
};

export default PerformanceMonitor;