import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import { LeaveStatus, UserRole } from '@/types';

export interface ApprovalRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

interface ApprovalsContextType {
  requests: ApprovalRequest[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  loading: boolean;
  refreshRequests: () => void;
}

const ApprovalsContext = createContext<ApprovalsContextType | undefined>(undefined);

export const useApprovals = () => {
  const context = useContext(ApprovalsContext);
  if (!context) {
    throw new Error('useApprovals must be used within an ApprovalsProvider');
  }
  return context;
};

interface ApprovalsProviderProps {
  children: ReactNode;
}

export const ApprovalsProvider: React.FC<ApprovalsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!user || (user.role !== UserRole.MANAGER && user.role !== UserRole.HR_ADMIN)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/leaves/team-requests');
      setRequests(response.data.data.requests || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const pendingCount = requests.filter(req => req.status === LeaveStatus.PENDING).length;
  const approvedCount = requests.filter(req => req.status === LeaveStatus.APPROVED).length;
  const rejectedCount = requests.filter(req => req.status === LeaveStatus.REJECTED).length;

  const contextValue: ApprovalsContextType = {
    requests,
    pendingCount,
    approvedCount,
    rejectedCount,
    loading,
    refreshRequests: fetchRequests
  };

  return (
    <ApprovalsContext.Provider value={contextValue}>
      {children}
    </ApprovalsContext.Provider>
  );
};