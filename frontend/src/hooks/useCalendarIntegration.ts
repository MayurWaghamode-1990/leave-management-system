import { useState, useEffect, useCallback } from 'react';
import api from '@/config/api';
import toast from 'react-hot-toast';

export interface CalendarIntegration {
  provider: 'google' | 'outlook';
  enabled: boolean;
  calendarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSyncEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
}

export const useCalendarIntegration = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's calendar integrations
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/calendar/integrations');
      if (response.data.success) {
        setIntegrations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch integrations');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch calendar integrations';
      setError(message);
      console.error('Error fetching calendar integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get authorization URL for a provider
  const getAuthUrl = useCallback(async (provider: 'google' | 'outlook'): Promise<string | null> => {
    try {
      const response = await api.get(`/calendar/${provider}/auth-url`);
      if (response.data.success) {
        return response.data.data.authUrl;
      }
      throw new Error(response.data.message || 'Failed to get authorization URL');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to get authorization URL';
      setError(message);
      toast.error(message);
      return null;
    }
  }, []);

  // Connect calendar with OAuth flow
  const connectCalendar = useCallback(async (provider: 'google' | 'outlook'): Promise<boolean> => {
    try {
      setSyncing(true);
      setError(null);

      const authUrl = await getAuthUrl(provider);
      if (!authUrl) {
        return false;
      }

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        `${provider}-auth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open authentication popup. Please allow popups for this site.');
      }

      // Return a promise that resolves when auth is complete
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setTimeout(() => {
              fetchIntegrations();
              resolve(true);
            }, 1000);
          }
        }, 1000);

        // Handle message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === `${provider.toUpperCase()}_AUTH_SUCCESS`) {
            popup.close();
            clearInterval(checkClosed);
            toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar connected successfully!`);
            fetchIntegrations();
            resolve(true);
          } else if (event.data.type === `${provider.toUpperCase()}_AUTH_ERROR`) {
            popup.close();
            clearInterval(checkClosed);
            const errorMsg = `Failed to connect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`;
            setError(errorMsg);
            toast.error(errorMsg);
            resolve(false);
          }

          window.removeEventListener('message', handleMessage);
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            const timeoutMsg = 'Authentication timed out';
            setError(timeoutMsg);
            toast.error(timeoutMsg);
            resolve(false);
          }
        }, 300000);
      });
    } catch (err: any) {
      const message = err.message || 'Failed to connect calendar';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [getAuthUrl, fetchIntegrations]);

  // Disconnect calendar
  const disconnectCalendar = useCallback(async (provider: 'google' | 'outlook'): Promise<boolean> => {
    try {
      setSyncing(true);
      setError(null);

      const response = await api.delete(`/calendar/disconnect/${provider}`);

      if (response.data.success) {
        toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
        await fetchIntegrations();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to disconnect calendar');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to disconnect calendar';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [fetchIntegrations]);

  // Sync specific leave with calendar
  const syncLeaveWithCalendar = useCallback(async (
    leaveId: string,
    action: 'create' | 'update' | 'delete'
  ): Promise<boolean> => {
    try {
      setSyncing(true);
      setError(null);

      const response = await api.post(`/calendar/sync-leave/${leaveId}`, { action });

      if (response.data.success) {
        toast.success('Leave synced with calendar successfully');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to sync leave');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to sync leave with calendar';
      setError(message);
      console.error('Error syncing leave with calendar:', err);
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  // Get iCal feed URL
  const getICalFeedUrl = useCallback((userId: string): string => {
    return `${api.defaults.baseURL}/calendar/ical/${userId}`;
  }, []);

  // Download iCal feed
  const downloadICalFeed = useCallback((userId: string) => {
    const url = getICalFeedUrl(userId);
    window.open(url, '_blank');
  }, [getICalFeedUrl]);

  // Check if a provider is connected
  const isProviderConnected = useCallback((provider: 'google' | 'outlook'): boolean => {
    return integrations.some(int => int.provider === provider && int.enabled);
  }, [integrations]);

  // Get provider integration details
  const getProviderIntegration = useCallback((provider: 'google' | 'outlook'): CalendarIntegration | null => {
    return integrations.find(int => int.provider === provider && int.enabled) || null;
  }, [integrations]);

  // Initialize hook
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    // State
    integrations,
    loading,
    syncing,
    error,

    // Actions
    fetchIntegrations,
    connectCalendar,
    disconnectCalendar,
    syncLeaveWithCalendar,
    downloadICalFeed,
    getICalFeedUrl,

    // Utilities
    isProviderConnected,
    getProviderIntegration,
  };
};