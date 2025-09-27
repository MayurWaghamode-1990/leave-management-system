import { prisma } from '../index';
import { logger } from '../utils/logger';

export interface AdvancedReportFilters {
  startDate?: Date;
  endDate?: Date;
  departments?: string[];
  locations?: string[];
  employeeIds?: string[];
  leaveTypes?: string[];
  statuses?: string[];
  managers?: string[];
  regions?: string[];
  minDuration?: number;
  maxDuration?: number;
  includeHalfDays?: boolean;
  sortBy?: 'date' | 'duration' | 'employee' | 'department';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LeaveReportRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  location: string;
  manager: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  status: string;
  appliedDate: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reason: string;
  attachments?: string;
}

export interface AnalyticsMetrics {
  totalRequests: number;
  totalDays: number;
  averageDuration: number;
  approvalRate: number;
  rejectionRate: number;
  pendingRate: number;
  leaveTypeBreakdown: { type: string; count: number; percentage: number }[];
  departmentBreakdown: { department: string; count: number; days: number; percentage: number }[];
  monthlyTrends: { month: string; requests: number; days: number; approvalRate: number }[];
  topEmployees: { employeeId: string; name: string; totalDays: number; requestCount: number }[];
  peakPeriods: { period: string; intensity: number; description: string }[];
}

export interface UtilizationReport {
  department: string;
  totalEmployees: number;
  employeesOnLeave: number;
  utilizationRate: number;
  averageLeaveDays: number;
  forecastedUtilization: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ComplianceReport {
  region: string;
  totalEntitlements: number;
  utilizationRate: number;
  pendingBalances: number;
  expiringLeaves: number;
  complianceScore: number;
  violations: { type: string; count: number; description: string }[];
}

class AdvancedReportingService {

  async getFilteredLeaveReports(filters: AdvancedReportFilters): Promise<{
    data: LeaveReportRow[];
    totalCount: number;
    summary: AnalyticsMetrics;
  }> {
    try {
      const whereClause: any = {};

      // Date filters
      if (filters.startDate || filters.endDate) {
        whereClause.OR = [];
        if (filters.startDate && filters.endDate) {
          whereClause.OR.push({
            startDate: { gte: filters.startDate, lte: filters.endDate }
          });
          whereClause.OR.push({
            endDate: { gte: filters.startDate, lte: filters.endDate }
          });
          whereClause.OR.push({
            AND: [
              { startDate: { lte: filters.startDate } },
              { endDate: { gte: filters.endDate } }
            ]
          });
        }
      }

      // Filter by departments
      if (filters.departments && filters.departments.length > 0) {
        whereClause.employee = {
          ...whereClause.employee,
          department: { in: filters.departments }
        };
      }

      // Filter by locations
      if (filters.locations && filters.locations.length > 0) {
        whereClause.employee = {
          ...whereClause.employee,
          location: { in: filters.locations }
        };
      }

      // Filter by specific employees
      if (filters.employeeIds && filters.employeeIds.length > 0) {
        whereClause.employeeId = { in: filters.employeeIds };
      }

      // Filter by leave types
      if (filters.leaveTypes && filters.leaveTypes.length > 0) {
        whereClause.leaveType = { in: filters.leaveTypes };
      }

      // Filter by status
      if (filters.statuses && filters.statuses.length > 0) {
        whereClause.status = { in: filters.statuses };
      }

      // Filter by duration
      if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
        whereClause.totalDays = {};
        if (filters.minDuration !== undefined) {
          whereClause.totalDays.gte = filters.minDuration;
        }
        if (filters.maxDuration !== undefined) {
          whereClause.totalDays.lte = filters.maxDuration;
        }
      }

      // Filter half days
      if (filters.includeHalfDays === false) {
        whereClause.isHalfDay = false;
      }

      // Build sort clause
      const orderBy: any = {};
      switch (filters.sortBy) {
        case 'date':
          orderBy.startDate = filters.sortOrder || 'desc';
          break;
        case 'duration':
          orderBy.totalDays = filters.sortOrder || 'desc';
          break;
        case 'employee':
          orderBy.employee = { firstName: filters.sortOrder || 'asc' };
          break;
        case 'department':
          orderBy.employee = { department: filters.sortOrder || 'asc' };
          break;
        default:
          orderBy.appliedDate = 'desc';
      }

      // Get total count for pagination
      const totalCount = await prisma.leaveRequest.count({ where: whereClause });

      // Get paginated results
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              location: true,
              reportingManager: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy,
        skip: filters.offset || 0,
        take: filters.limit || 100
      });

      // Transform to report format
      const data: LeaveReportRow[] = leaveRequests.map(request => ({
        id: request.id,
        employeeId: request.employeeId,
        employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
        employeeEmail: request.employee.email,
        department: request.employee.department,
        location: request.employee.location,
        manager: request.employee.reportingManager
          ? `${request.employee.reportingManager.firstName} ${request.employee.reportingManager.lastName}`
          : 'N/A',
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays: request.totalDays,
        isHalfDay: request.isHalfDay,
        status: request.status,
        appliedDate: request.appliedDate,
        approvedBy: request.approvals.find(a => a.status === 'APPROVED')?.approver.firstName,
        approvedAt: request.approvals.find(a => a.status === 'APPROVED')?.updatedAt,
        reason: request.reason,
        attachments: request.attachments
      }));

      // Calculate analytics
      const summary = await this.calculateAnalytics(data);

      return { data, totalCount, summary };
    } catch (error) {
      logger.error('Error getting filtered leave reports:', error);
      throw new Error('Failed to generate leave reports');
    }
  }

  private async calculateAnalytics(data: LeaveReportRow[]): Promise<AnalyticsMetrics> {
    const totalRequests = data.length;
    const totalDays = data.reduce((sum, report) => sum + report.totalDays, 0);
    const averageDuration = totalRequests > 0 ? totalDays / totalRequests : 0;

    const statusCounts = data.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const approvedCount = statusCounts['APPROVED'] || 0;
    const rejectedCount = statusCounts['REJECTED'] || 0;
    const pendingCount = statusCounts['PENDING'] || 0;

    const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;
    const rejectionRate = totalRequests > 0 ? (rejectedCount / totalRequests) * 100 : 0;
    const pendingRate = totalRequests > 0 ? (pendingCount / totalRequests) * 100 : 0;

    // Leave type breakdown
    const leaveTypeCounts = data.reduce((acc, report) => {
      acc[report.leaveType] = (acc[report.leaveType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leaveTypeBreakdown = Object.entries(leaveTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalRequests) * 100
    }));

    // Department breakdown
    const departmentData = data.reduce((acc, report) => {
      if (!acc[report.department]) {
        acc[report.department] = { count: 0, days: 0 };
      }
      acc[report.department].count += 1;
      acc[report.department].days += report.totalDays;
      return acc;
    }, {} as Record<string, { count: number; days: number }>);

    const departmentBreakdown = Object.entries(departmentData).map(([department, stats]) => ({
      department,
      count: stats.count,
      days: stats.days,
      percentage: (stats.count / totalRequests) * 100
    }));

    // Monthly trends (simplified for this example)
    const monthlyData = data.reduce((acc, report) => {
      const month = report.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) {
        acc[month] = { requests: 0, days: 0, approved: 0 };
      }
      acc[month].requests += 1;
      acc[month].days += report.totalDays;
      if (report.status === 'APPROVED') acc[month].approved += 1;
      return acc;
    }, {} as Record<string, { requests: number; days: number; approved: number }>);

    const monthlyTrends = Object.entries(monthlyData).map(([month, stats]) => ({
      month,
      requests: stats.requests,
      days: stats.days,
      approvalRate: stats.requests > 0 ? (stats.approved / stats.requests) * 100 : 0
    }));

    // Top employees by leave days
    const employeeData = data.reduce((acc, report) => {
      if (!acc[report.employeeId]) {
        acc[report.employeeId] = {
          name: report.employeeName,
          totalDays: 0,
          requestCount: 0
        };
      }
      acc[report.employeeId].totalDays += report.totalDays;
      acc[report.employeeId].requestCount += 1;
      return acc;
    }, {} as Record<string, { name: string; totalDays: number; requestCount: number }>);

    const topEmployees = Object.entries(employeeData)
      .map(([employeeId, stats]) => ({
        employeeId,
        name: stats.name,
        totalDays: stats.totalDays,
        requestCount: stats.requestCount
      }))
      .sort((a, b) => b.totalDays - a.totalDays)
      .slice(0, 10);

    // Peak periods analysis (simplified)
    const peakPeriods = [
      { period: 'December', intensity: 85, description: 'Holiday season peak' },
      { period: 'Summer (Jun-Aug)', intensity: 70, description: 'Summer vacation period' },
      { period: 'Festival seasons', intensity: 60, description: 'Cultural festival periods' }
    ];

    return {
      totalRequests,
      totalDays,
      averageDuration,
      approvalRate,
      rejectionRate,
      pendingRate,
      leaveTypeBreakdown,
      departmentBreakdown,
      monthlyTrends,
      topEmployees,
      peakPeriods
    };
  }

  async getUtilizationReport(filters: AdvancedReportFilters): Promise<UtilizationReport[]> {
    try {
      // Get all departments
      const departments = await prisma.user.groupBy({
        by: ['department'],
        _count: { id: true }
      });

      const utilizationReports: UtilizationReport[] = [];

      for (const dept of departments) {
        // Get employee count
        const totalEmployees = dept._count.id;

        // Get current leave requests for this department
        const currentLeaves = await prisma.leaveRequest.count({
          where: {
            employee: { department: dept.department },
            status: 'APPROVED',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        });

        // Calculate average leave days
        const avgLeaveData = await prisma.leaveRequest.aggregate({
          where: {
            employee: { department: dept.department },
            status: 'APPROVED'
          },
          _avg: { totalDays: true }
        });

        const averageLeaveDays = avgLeaveData._avg.totalDays || 0;
        const utilizationRate = totalEmployees > 0 ? (currentLeaves / totalEmployees) * 100 : 0;

        // Simple forecasting (in real implementation, use more sophisticated algorithms)
        const forecastedUtilization = Math.min(utilizationRate * 1.2, 100);

        // Risk assessment
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (utilizationRate > 30) riskLevel = 'HIGH';
        else if (utilizationRate > 15) riskLevel = 'MEDIUM';

        utilizationReports.push({
          department: dept.department,
          totalEmployees,
          employeesOnLeave: currentLeaves,
          utilizationRate,
          averageLeaveDays,
          forecastedUtilization,
          riskLevel
        });
      }

      return utilizationReports;
    } catch (error) {
      logger.error('Error generating utilization report:', error);
      throw new Error('Failed to generate utilization report');
    }
  }

  async getComplianceReport(region?: string): Promise<ComplianceReport[]> {
    try {
      // Mock compliance data (in real implementation, integrate with policy engine)
      const mockComplianceData: ComplianceReport[] = [
        {
          region: 'INDIA',
          totalEntitlements: 1200,
          utilizationRate: 78.5,
          pendingBalances: 342,
          expiringLeaves: 45,
          complianceScore: 92,
          violations: [
            { type: 'Excessive carryover', count: 12, description: 'Employees carrying over more than allowed limit' },
            { type: 'Minimum notice violation', count: 8, description: 'Leave applied with insufficient notice' }
          ]
        },
        {
          region: 'USA',
          totalEntitlements: 800,
          utilizationRate: 65.2,
          pendingBalances: 156,
          expiringLeaves: 23,
          complianceScore: 88,
          violations: [
            { type: 'FMLA non-compliance', count: 3, description: 'Medical leave not properly categorized' },
            { type: 'State law violations', count: 5, description: 'Sick leave usage below state requirements' }
          ]
        }
      ];

      if (region) {
        return mockComplianceData.filter(report => report.region === region);
      }

      return mockComplianceData;
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  async exportReportData(
    filters: AdvancedReportFilters,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    try {
      const { data } = await this.getFilteredLeaveReports(filters);

      if (format === 'csv') {
        const csvHeaders = [
          'Employee ID', 'Employee Name', 'Department', 'Location', 'Manager',
          'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Half Day',
          'Status', 'Applied Date', 'Approved By', 'Approved At', 'Reason'
        ];

        const csvRows = data.map(row => [
          row.employeeId,
          row.employeeName,
          row.department,
          row.location,
          row.manager,
          row.leaveType,
          row.startDate.toISOString().split('T')[0],
          row.endDate.toISOString().split('T')[0],
          row.totalDays.toString(),
          row.isHalfDay ? 'Yes' : 'No',
          row.status,
          row.appliedDate.toISOString().split('T')[0],
          row.approvedBy || '',
          row.approvedAt ? row.approvedAt.toISOString().split('T')[0] : '',
          row.reason
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        const timestamp = new Date().toISOString().split('T')[0];

        return {
          data: csvContent,
          filename: `leave-report-${timestamp}.csv`,
          mimeType: 'text/csv'
        };
      }

      // For now, only CSV is implemented
      throw new Error(`Export format ${format} not yet implemented`);
    } catch (error) {
      logger.error('Error exporting report data:', error);
      throw new Error('Failed to export report data');
    }
  }

  async getAvailableFilterOptions(): Promise<{
    departments: string[];
    locations: string[];
    leaveTypes: string[];
    managers: string[];
    regions: string[];
  }> {
    try {
      const [departments, locations, leaveTypes, managers] = await Promise.all([
        prisma.user.findMany({ select: { department: true }, distinct: ['department'] }),
        prisma.user.findMany({ select: { location: true }, distinct: ['location'] }),
        prisma.leaveRequest.findMany({ select: { leaveType: true }, distinct: ['leaveType'] }),
        prisma.user.findMany({
          where: { role: { in: ['MANAGER', 'HR_ADMIN'] } },
          select: { id: true, firstName: true, lastName: true }
        })
      ]);

      return {
        departments: departments.map(d => d.department),
        locations: locations.map(l => l.location),
        leaveTypes: leaveTypes.map(lt => lt.leaveType),
        managers: managers.map(m => `${m.firstName} ${m.lastName}`),
        regions: ['INDIA', 'USA', 'UK', 'CANADA'] // From regional policies
      };
    } catch (error) {
      logger.error('Error getting filter options:', error);
      throw new Error('Failed to get filter options');
    }
  }
}

export const advancedReportingService = new AdvancedReportingService();