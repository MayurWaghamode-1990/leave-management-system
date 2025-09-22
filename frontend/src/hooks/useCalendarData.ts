import { useState, useEffect, useMemo } from 'react';
import api from '@/config/api';
import { useAuth } from './useAuth';

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

interface LeaveEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeName?: string;
  employeeId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Mock user data for demo
const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'HR_ADMIN' },
  { id: '2', name: 'Manager User', email: 'manager@company.com', role: 'MANAGER' },
  { id: '3', name: 'Employee User', email: 'user@company.com', role: 'EMPLOYEE' },
  { id: '4', name: 'John Doe', email: 'john.doe@company.com', role: 'EMPLOYEE' },
  { id: '5', name: 'Jane Smith', email: 'jane.smith@company.com', role: 'EMPLOYEE' },
  { id: '6', name: 'Bob Wilson', email: 'bob.wilson@company.com', role: 'EMPLOYEE' }
];

export const useCalendarData = (showTeamLeaves: boolean = false) => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError(null);

        let endpoint = '/leaves';
        if (showTeamLeaves && user && (user.role === 'MANAGER' || user.role === 'HR_ADMIN')) {
          endpoint = '/leaves/all'; // Endpoint for getting all team leaves
        }

        const response = await api.get(endpoint);

        if (response.data.success) {
          const leavesData = response.data.data;
          setLeaves(Array.isArray(leavesData) ? leavesData : []);
        } else {
          setError('Failed to fetch leave data');
        }
      } catch (err: any) {
        console.error('Error fetching leaves:', err);
        setError(err?.response?.data?.message || 'Failed to fetch leave data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLeaves();
    }
  }, [user, showTeamLeaves]);

  // Convert leave requests to calendar events
  const calendarEvents = useMemo(() => {
    if (!leaves || !Array.isArray(leaves) || leaves.length === 0) return [];

    return leaves
      .filter(leave => leave.status !== 'CANCELLED') // Don't show cancelled leaves
      .map((leave): LeaveEvent => {
        const employee = mockUsers.find(u => u.id === leave.employeeId);

        return {
          id: leave.id,
          title: `${leave.leaveType.replace('_', ' ')} - ${employee?.name || 'Unknown'}`,
          startDate: new Date(leave.startDate),
          endDate: new Date(leave.endDate),
          type: leave.leaveType,
          status: leave.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          employeeName: employee?.name,
          employeeId: leave.employeeId
        };
      });
  }, [leaves]);

  // Filter events based on user permissions
  const filteredEvents = useMemo(() => {
    if (!user) return [];

    if (showTeamLeaves && (user.role === 'MANAGER' || user.role === 'HR_ADMIN')) {
      // Show all team leaves for managers and HR
      return calendarEvents;
    } else {
      // Show only user's own leaves
      return calendarEvents.filter(event => event.employeeId === user.id);
    }
  }, [calendarEvents, user, showTeamLeaves]);

  // Get events for a specific date range
  const getEventsInRange = (startDate: Date, endDate: Date) => {
    return filteredEvents.filter(event =>
      (event.startDate <= endDate && event.endDate >= startDate)
    );
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return filteredEvents.filter(event =>
      dayStart <= event.endDate && dayEnd >= event.startDate
    );
  };

  // Refresh data
  const refreshData = async () => {
    if (user) {
      setLoading(true);
      // Re-trigger the effect by updating a state that useEffect depends on
      // This is a simple way to refresh without duplicating the fetch logic
      try {
        const endpoint = showTeamLeaves && (user.role === 'MANAGER' || user.role === 'HR_ADMIN')
          ? '/leaves/all'
          : '/leaves';

        const response = await api.get(endpoint);

        if (response.data.success) {
          const leavesData = response.data.data;
          setLeaves(Array.isArray(leavesData) ? leavesData : []);
        }
      } catch (err: any) {
        console.error('Error refreshing leaves:', err);
        setError(err?.response?.data?.message || 'Failed to refresh leave data');
      } finally {
        setLoading(false);
      }
    }
  };

  // Statistics for the calendar
  const statistics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const approvedThisMonth = thisMonthEvents.filter(e => e.status === 'APPROVED').length;
    const pendingThisMonth = thisMonthEvents.filter(e => e.status === 'PENDING').length;

    return {
      totalEvents: filteredEvents.length,
      thisMonthEvents: thisMonthEvents.length,
      approvedThisMonth,
      pendingThisMonth,
      upcomingEvents: filteredEvents.filter(event => event.startDate > now).length
    };
  }, [filteredEvents]);

  return {
    events: filteredEvents,
    loading,
    error,
    getEventsInRange,
    getEventsForDate,
    refreshData,
    statistics,
    rawLeaves: leaves
  };
};