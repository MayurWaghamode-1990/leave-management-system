import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';

export interface Notification {
  id: string;
  type: 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_PENDING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  leaveRequestId?: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  refreshNotifications: () => void;
  isRealtimeConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const {
    notifications: realtimeNotifications,
    isConnected: isRealtimeConnected,
    markNotificationAsRead: markRealtimeAsRead,
    removeNotification: removeRealtimeNotification
  } = useRealTimeNotifications();

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0 && user) {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const initializeNotifications = () => {
    // Try to load existing notifications from localStorage
    if (user) {
      const savedNotifications = localStorage.getItem(`notifications-${user.id}`);
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
          return;
        } catch (error) {
          console.warn('Failed to parse saved notifications, generating new ones');
        }
      }
    }

    // Comprehensive mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'LEAVE_APPROVED',
        title: 'Leave Request Approved',
        message: 'Your sick leave request for Dec 18 has been approved by Admin User',
        timestamp: new Date().toISOString(),
        read: false,
        leaveRequestId: '4',
        actionUrl: '/leaves'
      },
      {
        id: '2',
        type: 'LEAVE_REJECTED',
        title: 'Leave Request Rejected',
        message: 'Your casual leave request for Dec 23-24 was rejected. Please provide more specific reason for personal work',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        read: false,
        leaveRequestId: '5',
        actionUrl: '/leaves'
      },
      {
        id: '3',
        type: 'INFO',
        title: 'Leave Balance Update',
        message: 'Your leave balance has been updated for the new year. Check your updated balances.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/dashboard'
      },
      {
        id: '4',
        type: 'LEAVE_PENDING',
        title: 'Pending Leave Request',
        message: 'John Doe has requested earned leave for Dec 25-31. Please review and approve.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        read: user?.role === 'EMPLOYEE',
        leaveRequestId: '3',
        actionUrl: '/approvals'
      },
      {
        id: '5',
        type: 'INFO',
        title: 'System Maintenance Notice',
        message: 'The leave management system will undergo maintenance on Dec 30 from 2 AM to 4 AM',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/dashboard'
      },
      {
        id: '6',
        type: 'LEAVE_APPROVED',
        title: 'Compensatory Leave Approved',
        message: 'Your compensatory off for weekend work has been approved and added to your balance',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/leaves'
      },
      {
        id: '7',
        type: 'INFO',
        title: 'Policy Update',
        message: 'New leave policy changes are effective from January 1st. Please review the updated guidelines.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/dashboard'
      }
    ];

    // Filter based on user role
    const roleBasedNotifications = user?.role === 'EMPLOYEE'
      ? mockNotifications.filter(n => n.type !== 'LEAVE_PENDING' || n.type === 'INFO')
      : mockNotifications;

    setNotifications(roleBasedNotifications);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAsUnread = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const refreshNotifications = () => {
    // Clear localStorage and regenerate notifications
    if (user) {
      localStorage.removeItem(`notifications-${user.id}`);
    }
    initializeNotifications();
    toast.success('Notifications refreshed');
  };

  // Combine static notifications with real-time notifications
  const allNotifications = [
    ...realtimeNotifications.map(rtn => ({
      id: rtn.id,
      type: rtn.type,
      title: rtn.title,
      message: rtn.message,
      timestamp: rtn.timestamp,
      read: rtn.read,
      leaveRequestId: rtn.data?.leaveRequestId,
      actionUrl: rtn.type === 'LEAVE_APPROVED' || rtn.type === 'LEAVE_REJECTED' ? '/leaves' :
                rtn.type === 'LEAVE_PENDING' ? '/approvals' : '/dashboard'
    })),
    ...notifications
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const enhancedMarkAsRead = (notificationId: string) => {
    // Check if it's a real-time notification
    const isRealtimeNotif = realtimeNotifications.find(rtn => rtn.id === notificationId);
    if (isRealtimeNotif) {
      markRealtimeAsRead(notificationId);
    } else {
      markAsRead(notificationId);
    }
  };

  const enhancedDeleteNotification = (notificationId: string) => {
    // Check if it's a real-time notification
    const isRealtimeNotif = realtimeNotifications.find(rtn => rtn.id === notificationId);
    if (isRealtimeNotif) {
      removeRealtimeNotification(notificationId);
    } else {
      deleteNotification(notificationId);
    }
  };

  const enhancedMarkAllAsRead = () => {
    // Mark all static notifications as read
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Mark all real-time notifications as read
    realtimeNotifications.forEach(rtn => {
      if (!rtn.read) {
        markRealtimeAsRead(rtn.id);
      }
    });

    toast.success('All notifications marked as read');
  };

  const contextValue: NotificationContextType = {
    notifications: allNotifications,
    unreadCount,
    markAsRead: enhancedMarkAsRead,
    markAsUnread,
    markAllAsRead: enhancedMarkAllAsRead,
    deleteNotification: enhancedDeleteNotification,
    refreshNotifications,
    isRealtimeConnected
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};