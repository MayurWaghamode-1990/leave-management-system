import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Badge,
  Typography,
  Fade,
  Zoom,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  CloudDone,
  CloudOff,
  Sync,
  SyncProblem,
  Circle,
  Notifications,
  Speed,
  AccessTime
} from '@mui/icons-material';
import { wsService } from '@/services/websocket';
import dayjs from 'dayjs';

interface LiveStatusIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  variant?: 'minimal' | 'detailed';
  showLastActivity?: boolean;
}

interface ConnectionStats {
  isConnected: boolean;
  reconnectAttempts: number;
  lastHeartbeat?: string;
  latency?: number;
  messageCount: number;
  uptime: string;
}

const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  position = 'bottom-right',
  variant = 'minimal',
  showLastActivity = true
}) => {
  const [stats, setStats] = useState<ConnectionStats>({
    isConnected: false,
    reconnectAttempts: 0,
    messageCount: 0,
    uptime: '0s'
  });
  const [lastActivity, setLastActivity] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  useEffect(() => {
    let startTime = Date.now();
    let uptimeInterval: NodeJS.Timeout;
    let heartbeatStart: number;

    const updateConnectionStats = () => {
      const status = wsService.getConnectionStatus();
      const uptime = Math.floor((Date.now() - startTime) / 1000);

      setStats(prev => ({
        ...prev,
        isConnected: status.isConnected,
        reconnectAttempts: status.reconnectAttempts,
        uptime: formatUptime(uptime)
      }));
    };

    const handleConnected = () => {
      setLastActivity('Connected to server');
      addActivity('🟢 Connected');
      updateConnectionStats();
    };

    const handleDisconnected = (data: any) => {
      setLastActivity(`Disconnected: ${data?.reason || 'Unknown reason'}`);
      addActivity('🔴 Disconnected');
      updateConnectionStats();
    };

    const handleMessage = (message: any) => {
      setStats(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
        lastHeartbeat: message.type === 'HEARTBEAT' ? new Date().toISOString() : prev.lastHeartbeat
      }));

      if (message.type !== 'HEARTBEAT') {
        setLastActivity(`Received: ${message.type}`);
        addActivity(`📩 ${message.type}`);
      }

      // Calculate latency for heartbeat responses
      if (message.type === 'HEARTBEAT' && heartbeatStart) {
        const latency = Date.now() - heartbeatStart;
        setStats(prev => ({ ...prev, latency }));
      }
    };

    const handleError = (error: any) => {
      setLastActivity('Connection error occurred');
      addActivity('⚠️ Error');
      updateConnectionStats();
    };

    const addActivity = (activity: string) => {
      setRecentActivity(prev => {
        const newActivity = `${dayjs().format('HH:mm:ss')} ${activity}`;
        return [newActivity, ...prev].slice(0, 5); // Keep last 5 activities
      });
    };

    // Setup event listeners
    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('message', handleMessage);
    wsService.on('error', handleError);

    // Start uptime counter
    uptimeInterval = setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      setStats(prev => ({ ...prev, uptime: formatUptime(uptime) }));
    }, 1000);

    // Initial status check
    updateConnectionStats();

    // Periodic heartbeat to measure latency
    const latencyInterval = setInterval(() => {
      if (stats.isConnected) {
        heartbeatStart = Date.now();
        wsService.send({ type: 'HEARTBEAT', data: { ping: true } });
      }
    }, 10000);

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
      wsService.off('message', handleMessage);
      wsService.off('error', handleError);
      clearInterval(uptimeInterval);
      clearInterval(latencyInterval);
    };
  }, []);

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getPositionStyles = () => {
    const base = { position: 'fixed' as const, zIndex: 1300 };
    switch (position) {
      case 'top-right':
        return { ...base, top: 16, right: 16 };
      case 'top-left':
        return { ...base, top: 16, left: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      default: // bottom-right
        return { ...base, bottom: 16, right: 16 };
    }
  };

  const getStatusColor = () => {
    if (stats.isConnected) return 'success';
    if (stats.reconnectAttempts > 0) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (stats.isConnected) return <CloudDone />;
    if (stats.reconnectAttempts > 0) return <Sync className="animate-spin" />;
    return <CloudOff />;
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (variant === 'minimal') {
    return (
      <Fade in={isVisible}>
        <Box sx={getPositionStyles()}>
          <Tooltip
            title={
              <Box>
                <Typography variant="caption" display="block">
                  Status: {stats.isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
                <Typography variant="caption" display="block">
                  Messages: {stats.messageCount}
                </Typography>
                <Typography variant="caption" display="block">
                  Uptime: {stats.uptime}
                </Typography>
                {stats.latency && (
                  <Typography variant="caption" display="block">
                    Latency: {stats.latency}ms
                  </Typography>
                )}
                {showLastActivity && lastActivity && (
                  <Typography variant="caption" display="block">
                    Last: {lastActivity}
                  </Typography>
                )}
              </Box>
            }
            arrow
          >
            <Chip
              icon={getStatusIcon()}
              label={stats.isConnected ? 'Live' : 'Offline'}
              color={getStatusColor()}
              size="small"
              variant={stats.isConnected ? 'filled' : 'outlined'}
              onClick={handleToggleVisibility}
              sx={{
                cursor: 'pointer',
                '& .animate-spin': {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }
              }}
            />
          </Tooltip>
        </Box>
      </Fade>
    );
  }

  return (
    <Zoom in={isVisible}>
      <Paper
        elevation={3}
        sx={{
          ...getPositionStyles(),
          p: 2,
          minWidth: 280,
          backgroundColor: 'background.paper',
          borderLeft: 4,
          borderColor: `${getStatusColor()}.main`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            System Status
          </Typography>
          <Chip
            icon={getStatusIcon()}
            label={stats.isConnected ? 'Live' : 'Offline'}
            color={getStatusColor()}
            size="small"
            variant="filled"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Circle sx={{ fontSize: 8, color: `${getStatusColor()}.main` }} />
            <Typography variant="caption">
              {stats.isConnected ? 'Connected to server' : 'Connection lost'}
            </Typography>
          </Box>

          {!stats.isConnected && stats.reconnectAttempts > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="warning.main">
                Reconnecting... (Attempt {stats.reconnectAttempts})
              </Typography>
              <LinearProgress
                color="warning"
                sx={{ height: 2, mt: 0.5, borderRadius: 1 }}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Messages
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.messageCount}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Uptime
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.uptime}
            </Typography>
          </Box>

          {stats.latency && (
            <>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Latency
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.latency}ms
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Quality
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={stats.latency < 100 ? 'success.main' : stats.latency < 300 ? 'warning.main' : 'error.main'}
                >
                  {stats.latency < 100 ? 'Excellent' : stats.latency < 300 ? 'Good' : 'Poor'}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {recentActivity.length > 0 && (
          <Box>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
              {recentActivity.map((activity, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  display="block"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    opacity: 1 - (index * 0.15),
                    mb: 0.25
                  }}
                >
                  {activity}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Zoom>
  );
};

export default LiveStatusIndicator;