import { useEffect, useCallback, useState } from 'react';
import { socketService, NotificationData } from '../services/socket';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const handleNewNotification = useCallback((notification: NotificationData) => {
    console.log('📬 New real-time notification:', notification);

    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);

    // Show toast notification
    const toastIcon = notification.type === 'LEAVE_APPROVED' ? '✅' :
                     notification.type === 'LEAVE_REJECTED' ? '❌' :
                     notification.type === 'LEAVE_PENDING' ? '⏳' :
                     'ℹ️';

    toast(notification.message, {
      icon: toastIcon,
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#333',
        color: '#fff',
        maxWidth: '400px'
      }
    });

    // Play a notification sound (optional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore if audio fails to play (user might not have interacted with page yet)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  const connectSocket = useCallback(async () => {
    if (!user) return;

    try {
      await socketService.connect(user.id, user.role);
      setIsConnected(true);
      socketService.onNotification(handleNewNotification);
      console.log('🔔 Real-time notifications enabled');
    } catch (error) {
      console.error('Failed to connect to real-time notifications:', error);
      setIsConnected(false);
    }
  }, [user, handleNewNotification]);

  const disconnectSocket = useCallback(() => {
    socketService.offNotification(handleNewNotification);
    socketService.disconnect();
    setIsConnected(false);
    console.log('🔔 Real-time notifications disabled');
  }, [handleNewNotification]);

  // Connect when user is available and component mounts
  useEffect(() => {
    if (user) {
      connectSocket();
    }

    // Cleanup on unmount or user change
    return () => {
      disconnectSocket();
    };
  }, [user, connectSocket, disconnectSocket]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsConnected(false);
    }
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  return {
    isConnected,
    notifications,
    clearNotifications,
    markNotificationAsRead,
    removeNotification,
    socketConnected: isConnected && socketService.isSocketConnected()
  };
};