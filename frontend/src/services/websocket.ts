import React from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'NOTIFICATION' | 'LEAVE_STATUS_UPDATE' | 'SYSTEM_ALERT' | 'HEARTBEAT';
  data: any;
  timestamp: string;
  userId?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private heartbeatInterval: number | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Use the backend Socket.IO URL - use environment variable or default to 3004
      const serverUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3006';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', null);

        // Authenticate with user data if available
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            this.socket?.emit('authenticate', {
              userId: userData.id,
              role: userData.role
            });
          } catch (error) {
            console.error('Error parsing user data for authentication:', error);
          }
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnected = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnected = false;
        this.emit('error', error);
      });

      // Handle authentication success
      this.socket.on('authenticated', (data) => {
        if (data.success) {
          console.log('Socket.IO authenticated successfully');
        } else {
          console.error('Socket.IO authentication failed:', data.error);
        }
      });

      // Handle incoming notifications
      this.socket.on('notification', (data) => {
        this.handleMessage({
          type: 'NOTIFICATION',
          data,
          timestamp: new Date().toISOString()
        });
      });

      this.socket.on('leave_status_update', (data) => {
        this.handleMessage({
          type: 'LEAVE_STATUS_UPDATE',
          data,
          timestamp: new Date().toISOString()
        });
      });

      this.socket.on('system_alert', (data) => {
        this.handleMessage({
          type: 'SYSTEM_ALERT',
          data,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'NOTIFICATION':
        this.handleNotification(message.data);
        break;
      case 'LEAVE_STATUS_UPDATE':
        this.handleLeaveStatusUpdate(message.data);
        break;
      case 'SYSTEM_ALERT':
        this.handleSystemAlert(message.data);
        break;
      case 'HEARTBEAT':
        // Socket.IO handles heartbeat automatically
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }

    this.emit('message', message);
  }

  private handleNotification(notification: any) {
    // This would be handled by the NotificationContext
    this.emit('notification', notification);
  }

  private handleLeaveStatusUpdate(update: any) {
    this.emit('leave_status_update', update);
  }

  private handleSystemAlert(alert: any) {
    this.emit('system_alert', alert);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached', null);
    }
  }

  public send(message: Partial<WebSocketMessage>) {
    if (this.socket && this.socket.connected) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'HEARTBEAT',
        data: message.data || {},
        timestamp: new Date().toISOString(),
        ...message
      };

      // Emit the message type as the event name
      this.socket.emit(message.type?.toLowerCase() || 'message', fullMessage);
    } else {
      console.warn('Socket.IO is not connected. Message not sent:', message);
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 1000);
  }
}

// Create a singleton instance
export const wsService = new WebSocketService();

// React hook for using WebSocket in components
export const useWebSocket = () => {
  // This will be imported dynamically to avoid circular dependencies
  const addNotification = (notification: any) => {
    // This would normally come from useNotifications context
    console.log('New notification:', notification);
  };

  React.useEffect(() => {
    const handleNotification = (notification: any) => {
      // Add the notification to the context
      addNotification({
        id: notification.id || Date.now().toString(),
        type: notification.type,
        message: notification.message,
        read: false,
        createdAt: new Date().toISOString(),
        userId: notification.userId
      });
    };

    const handleLeaveStatusUpdate = (update: any) => {
      // Handle leave status updates
      addNotification({
        id: Date.now().toString(),
        type: 'LEAVE_STATUS_UPDATE',
        message: `Your leave request has been ${update.status.toLowerCase()}`,
        read: false,
        createdAt: new Date().toISOString(),
        userId: update.userId
      });
    };

    const handleSystemAlert = (alert: any) => {
      // Handle system alerts
      addNotification({
        id: Date.now().toString(),
        type: 'SYSTEM_ALERT',
        message: alert.message,
        read: false,
        createdAt: new Date().toISOString(),
        userId: alert.userId
      });
    };

    // Subscribe to WebSocket events
    wsService.on('notification', handleNotification);
    wsService.on('leave_status_update', handleLeaveStatusUpdate);
    wsService.on('system_alert', handleSystemAlert);

    // Cleanup on unmount
    return () => {
      wsService.off('notification', handleNotification);
      wsService.off('leave_status_update', handleLeaveStatusUpdate);
      wsService.off('system_alert', handleSystemAlert);
    };
  }, [addNotification]);

  return {
    send: wsService.send.bind(wsService),
    connectionStatus: wsService.getConnectionStatus(),
    reconnect: wsService.reconnect.bind(wsService),
    disconnect: wsService.disconnect.bind(wsService)
  };
};

export default wsService;