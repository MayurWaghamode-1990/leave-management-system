export interface UsaPtoPolicy {
  id: string;
  designation: string;
  annualPtoDays: number;
  accrualFrequency: 'YEARLY' | 'MONTHLY' | 'BI_WEEKLY';
  accrualRate: number;
  maxCarryForward: number;
  carryForwardExpiry: number;
  proRataCalculation: boolean;
  minimumServiceMonths: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsaPtoBalance {
  accrual: number;
  carryForward: number;
  total: number;
  carryForwardExpiry?: string;
}

export interface UsaPtoAccrual {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  year: number;
  month?: number;
  designation: string;
  accrualAmount: number;
  carryForwardAmount: number;
  totalAvailable: number;
  used: number;
  balance: number;
  proRated: boolean;
  proRataMonths?: number;
  status: 'PROCESSED' | 'SKIPPED' | 'ERROR';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsaPtoCarryForward {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  fromYear: number;
  toYear: number;
  carriedDays: number;
  expiryDate: string;
  used: number;
  expired: number;
  remaining: number;
  status: 'ACTIVE' | 'EXPIRED' | 'FULLY_USED';
  createdAt: string;
  updatedAt: string;
}

export interface UsaPtoReport {
  accrual: {
    annual: number;
    carryForward: number;
    total: number;
    used: number;
    balance: number;
    proRated: boolean;
  };
  carryForward: {
    amount: number;
    used: number;
    expired: number;
    remaining: number;
    expiryDate?: string;
    status: string;
  };
  leaveRequests: Array<{
    id: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
  }>;
}

export interface UsaPtoSystemStatus {
  currentYear: number;
  usaEmployees: number;
  activePolicies: number;
  accrualRecords: number;
  activeCarryForwards: number;
  scheduledJobs: Array<{
    name: string;
    schedule: string;
    cron: string;
  }>;
}

export interface UsaPtoAccrualSummary {
  year: number;
  summary: {
    totalEmployees: number;
    totalAccrued: number;
    totalCarryForward: number;
    totalUsed: number;
    totalBalance: number;
    proRatedCount: number;
  };
  accruals: UsaPtoAccrual[];
}

export interface UsaPtoCarryForwardSummary {
  year: number;
  summary: {
    totalCarryForwards: number;
    activeCount: number;
    expiredCount: number;
    totalCarriedDays: number;
    totalUsed: number;
    totalExpired: number;
    totalRemaining: number;
  };
  carryForwards: UsaPtoCarryForward[];
}
