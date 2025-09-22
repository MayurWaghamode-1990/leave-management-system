import { io, Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  type: 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_PENDING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string, role: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        resolve(true);
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3002';
      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        this.isConnected = true;

        // Authenticate the user for real-time features
        this.socket?.emit('authenticate', { userId, role });
      });

      this.socket.on('authenticated', (response) => {
        if (response.success) {
          console.log('👤 User authenticated for real-time notifications');
          resolve(true);
        } else {
          console.error('❌ Authentication failed:', response.error);
          reject(new Error(response.error));
        }
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Set a timeout for the authentication
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  onNotification(callback: (notification: NotificationData) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback?: (notification: NotificationData) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('notification', callback);
      } else {
        this.socket.off('notification');
      }
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export type { NotificationData };