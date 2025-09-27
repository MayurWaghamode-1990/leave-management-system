import express, { Response } from 'express';
import { AuthenticatedRequest, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { LeaveStatus, LeaveType } from '@prisma/client';

const router = express.Router();

interface LeaveReport {
  employeeId: string;
  employeeName: string;
  department: string;
  location: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  reason: string;
}

interface DepartmentSummary {
  department: string;
  totalEmployees: number;
  totalLeavesDays: number;
  averageLeaveDays: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

interface LeaveTypeAnalytics {
  leaveType: LeaveType;
  totalRequests: number;
  totalDays: number;
  approvalRate: number;
  averageDuration: number;
  peakMonths: string[];
}

interface MonthlyTrends {
  month: string;
  year: number;
  totalRequests: number;
  totalDays: number;
  approvalRate: number;
  mostRequestedLeaveType: LeaveType;
}

// Mock data for reports
const mockLeaveReports: LeaveReport[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    location: 'Bengaluru',
    leaveType: 'EARNED_LEAVE',
    startDate: '2024-01-15',
    endDate: '2024-01-19',
    totalDays: 5,
    status: 'APPROVED',
    appliedDate: '2024-01-01',
    approvedBy: 'Admin User',
    approvedDate: '2024-01-02',
    reason: 'Family vacation'
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    department: 'Marketing',
    location: 'Mumbai',
    leaveType: 'SICK_LEAVE',
    startDate: '2024-02-10',
    endDate: '2024-02-12',
    totalDays: 3,
    status: 'APPROVED',
    appliedDate: '2024-02-09',
    approvedBy: 'Admin User',
    approvedDate: '2024-02-09',
    reason: 'Medical treatment'
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Mike Johnson',
    department: 'Sales',
    location: 'Delhi',
    leaveType: 'CASUAL_LEAVE',
    startDate: '2024-03-05',
    endDate: '2024-03-06',
    totalDays: 2,
    status: 'PENDING',
    appliedDate: '2024-03-01',
    reason: 'Personal work'
  },
  {
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    location: 'Bengaluru',
    leaveType: 'COMPENSATORY_OFF',
    startDate: '2024-04-20',
    endDate: '2024-04-20',
    totalDays: 1,
    status: 'APPROVED',
    appliedDate: '2024-04-15',
    approvedBy: 'Admin User',
    approvedDate: '2024-04-16',
    reason: 'Worked on weekend for project delivery'
  },
  {
    employeeId: 'EMP004',
    employeeName: 'Sarah Williams',
    department: 'HR',
    location: 'Pune',
    leaveType: 'MATERNITY_LEAVE',
    startDate: '2024-05-01',
    endDate: '2024-08-01',
    totalDays: 92,
    status: 'APPROVED',
    appliedDate: '2024-03-15',
    approvedBy: 'Admin User',
    approvedDate: '2024-03-16',
    reason: 'Maternity leave'
  }
];

/**
 * @swagger
 * /reports/leave-reports:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Generate detailed leave reports
 *     description: Generate comprehensive leave reports with filtering and pagination (HR Admin/Manager only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leave reports from this date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leave reports until this date
 *         example: "2024-12-31"
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *         example: "Engineering"
 *       - in: query
 *         name: leaveType
 *         schema:
 *           type: string
 *           enum: [SICK_LEAVE, CASUAL_LEAVE, EARNED_LEAVE, MATERNITY_LEAVE, PATERNITY_LEAVE, COMPENSATORY_OFF, BEREAVEMENT_LEAVE, MARRIAGE_LEAVE]
 *         description: Filter by leave type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filter by leave status
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by specific employee ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Leave reports generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Generate leave reports
router.get('/leave-reports',
  authorize('HR_ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      startDate,
      endDate,
      department,
      leaveType,
      status,
      employeeId,
      page = 1,
      limit = 10
    } = req.query;

    let filteredReports = [...mockLeaveReports];

    // Apply filters
    if (startDate) {
      filteredReports = filteredReports.filter(report =>
        new Date(report.startDate) >= new Date(startDate as string)
      );
    }

    if (endDate) {
      filteredReports = filteredReports.filter(report =>
        new Date(report.endDate) <= new Date(endDate as string)
      );
    }

    if (department) {
      filteredReports = filteredReports.filter(report =>
        report.department === department
      );
    }

    if (leaveType) {
      filteredReports = filteredReports.filter(report =>
        report.leaveType === leaveType
      );
    }

    if (status) {
      filteredReports = filteredReports.filter(report =>
        report.status === status
      );
    }

    if (employeeId) {
      filteredReports = filteredReports.filter(report =>
        report.employeeId === employeeId
      );
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    const totalPages = Math.ceil(filteredReports.length / limitNum);

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalRecords: filteredReports.length,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  })
);

// Department-wise summary
router.get('/department-summary',
  authorize('HR_ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const departmentStats: { [key: string]: DepartmentSummary } = {};

    // Calculate department statistics
    mockLeaveReports.forEach(report => {
      const dept = report.department;
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          totalEmployees: 0,
          totalLeavesDays: 0,
          averageLeaveDays: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0
        };
      }

      const stats = departmentStats[dept];
      stats.totalLeavesDays += report.totalDays;

      switch (report.status) {
        case 'PENDING':
          stats.pendingRequests++;
          break;
        case 'APPROVED':
          stats.approvedRequests++;
          break;
        case 'REJECTED':
          stats.rejectedRequests++;
          break;
      }
    });

    // Calculate employee counts and averages (mock data)
    const employeeCounts: Record<string, number> = {
      'Engineering': 15,
      'Marketing': 8,
      'Sales': 12,
      'HR': 5,
      'Finance': 6
    };

    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      stats.totalEmployees = employeeCounts[dept] || 10;
      stats.averageLeaveDays = Math.round(stats.totalLeavesDays / stats.totalEmployees * 10) / 10;
    });

    res.json({
      success: true,
      data: Object.values(departmentStats)
    });
  })
);

// Leave type analytics
router.get('/leave-type-analytics',
  authorize('HR_ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const leaveTypeStats: { [key: string]: LeaveTypeAnalytics } = {};

    mockLeaveReports.forEach(report => {
      const type = report.leaveType;
      if (!leaveTypeStats[type]) {
        leaveTypeStats[type] = {
          leaveType: type,
          totalRequests: 0,
          totalDays: 0,
          approvalRate: 0,
          averageDuration: 0,
          peakMonths: []
        };
      }

      const stats = leaveTypeStats[type];
      stats.totalRequests++;
      stats.totalDays += report.totalDays;
    });

    // Calculate averages and approval rates
    Object.keys(leaveTypeStats).forEach(type => {
      const stats = leaveTypeStats[type];
      stats.averageDuration = Math.round(stats.totalDays / stats.totalRequests * 10) / 10;

      const approvedCount = mockLeaveReports.filter(r =>
        r.leaveType === type && r.status === 'APPROVED'
      ).length;
      stats.approvalRate = Math.round((approvedCount / stats.totalRequests) * 100);

      // Mock peak months
      stats.peakMonths = ['January', 'December'];
    });

    res.json({
      success: true,
      data: Object.values(leaveTypeStats)
    });
  })
);

// Monthly trends
router.get('/monthly-trends',
  authorize('HR_ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData: MonthlyTrends[] = [];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((month, index) => {
      // Filter reports for this month
      const monthReports = mockLeaveReports.filter(report => {
        const reportDate = new Date(report.appliedDate);
        return reportDate.getMonth() === index && reportDate.getFullYear() === parseInt(year as string);
      });

      const totalRequests = monthReports.length;
      const totalDays = monthReports.reduce((sum, report) => sum + report.totalDays, 0);
      const approvedCount = monthReports.filter(r => r.status === 'APPROVED').length;
      const approvalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;

      // Find most requested leave type
      const leaveTypeCounts: { [key: string]: number } = {};
      monthReports.forEach(report => {
        leaveTypeCounts[report.leaveType] = (leaveTypeCounts[report.leaveType] || 0) + 1;
      });

      const mostRequestedLeaveType = Object.keys(leaveTypeCounts).reduce((a, b) =>
        leaveTypeCounts[a] > leaveTypeCounts[b] ? a : b,
        'CASUAL_LEAVE'
      ) as LeaveType;

      monthlyData.push({
        month,
        year: parseInt(year as string),
        totalRequests,
        totalDays,
        approvalRate,
        mostRequestedLeaveType
      });
    });

    res.json({
      success: true,
      data: monthlyData
    });
  })
);

// Export data as CSV
router.get('/export/csv',
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type = 'leave-reports' } = req.query;

    let csvData = '';
    let filename = '';

    switch (type) {
      case 'leave-reports':
        filename = `leave-reports-${new Date().toISOString().split('T')[0]}.csv`;
        csvData = 'Employee ID,Employee Name,Department,Location,Leave Type,Start Date,End Date,Total Days,Status,Applied Date,Approved By,Approved Date,Reason\n';
        mockLeaveReports.forEach(report => {
          csvData += `${report.employeeId},"${report.employeeName}",${report.department},${report.location},${report.leaveType},${report.startDate},${report.endDate},${report.totalDays},${report.status},${report.appliedDate},"${report.approvedBy || ''}",${report.approvedDate || ''},"${report.reason}"\n`;
        });
        break;

      case 'department-summary':
        filename = `department-summary-${new Date().toISOString().split('T')[0]}.csv`;
        csvData = 'Department,Total Employees,Total Leave Days,Average Leave Days,Pending Requests,Approved Requests,Rejected Requests\n';
        // This would use the same logic as the department-summary endpoint
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  })
);

// Dashboard KPIs
router.get('/kpis',
  authorize('HR_ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const totalRequests = mockLeaveReports.length;
    const approvedRequests = mockLeaveReports.filter(r => r.status === 'APPROVED').length;
    const pendingRequests = mockLeaveReports.filter(r => r.status === 'PENDING').length;
    const rejectedRequests = mockLeaveReports.filter(r => r.status === 'REJECTED').length;

    const totalLeaveDays = mockLeaveReports
      .filter(r => r.status === 'APPROVED')
      .reduce((sum, report) => sum + report.totalDays, 0);

    const averageLeaveDuration = approvedRequests > 0
      ? Math.round(totalLeaveDays / approvedRequests * 10) / 10
      : 0;

    const approvalRate = totalRequests > 0
      ? Math.round((approvedRequests / totalRequests) * 100)
      : 0;

    // Calculate current month data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthReports = mockLeaveReports.filter(report => {
      const reportDate = new Date(report.appliedDate);
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
    });

    const kpis = {
      overview: {
        totalRequests,
        approvedRequests,
        pendingRequests,
        rejectedRequests,
        approvalRate,
        totalLeaveDays,
        averageLeaveDuration
      },
      currentMonth: {
        totalRequests: currentMonthReports.length,
        totalDays: currentMonthReports.reduce((sum, report) => sum + report.totalDays, 0),
        pendingRequests: currentMonthReports.filter(r => r.status === 'PENDING').length
      },
      trends: {
        requestsVsPreviousMonth: 15, // Mock percentage change
        approvalRateVsPreviousMonth: -2, // Mock percentage change
        averageDurationVsPreviousMonth: 5 // Mock percentage change
      }
    };

    res.json({
      success: true,
      data: kpis
    });
  })
);

// Get manager-specific statistics
router.get('/manager-stats',
  authorize('MANAGER', 'HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filter reports for current manager's team (mock data)
    const teamReports = mockLeaveReports.filter(report => {
      // In real implementation, filter by manager's team
      return true; // For now, include all reports
    });

    // Get current month reports
    const currentMonthReports = teamReports.filter(report => {
      const reportDate = new Date(report.appliedDate);
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
    });

    // Calculate stats
    const totalTeamMembers = 15; // Mock team size
    const pendingApprovals = teamReports.filter(r => r.status === 'PENDING').length;
    const approvedThisMonth = currentMonthReports.filter(r => r.status === 'APPROVED').length;
    const rejectedThisMonth = currentMonthReports.filter(r => r.status === 'REJECTED').length;

    // Calculate team members currently on leave
    const today = new Date();
    const teamOnLeave = teamReports.filter(report => {
      if (report.status !== 'APPROVED') return false;
      const startDate = new Date(report.startDate);
      const endDate = new Date(report.endDate);
      return startDate <= today && endDate >= today;
    }).length;

    const stats = {
      totalTeamMembers,
      pendingApprovals,
      approvedThisMonth,
      rejectedThisMonth,
      teamOnLeave
    };

    res.json({
      success: true,
      data: stats
    });
  })
);

// Get calendar statistics for team calendar view
router.get('/calendar-stats',
  authorize('MANAGER', 'HR_ADMIN', 'IT_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    // Mock leave data (in a real app this would come from database)
    const mockLeaveRequests = [
      { id: '1', employeeId: '1', status: 'APPROVED', startDate: '2024-12-20', endDate: '2024-12-22' },
      { id: '2', employeeId: '1', status: 'APPROVED', startDate: '2024-11-15', endDate: '2024-11-15' },
      { id: '3', employeeId: '2', status: 'PENDING', startDate: '2024-12-25', endDate: '2024-12-31' },
      { id: '4', employeeId: '2', status: 'PENDING', startDate: '2024-12-18', endDate: '2024-12-18' },
      { id: '5', employeeId: '2', status: 'PENDING', startDate: '2024-12-23', endDate: '2024-12-24' }
    ];

    let filteredRequests = mockLeaveRequests;

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredRequests = filteredRequests.filter(req => {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        return (reqStart <= end && reqEnd >= start);
      });
    }

    const today = new Date();

    // Calculate stats
    const totalOnLeave = filteredRequests.filter(req => {
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      return req.status === 'APPROVED' && reqStart <= today && reqEnd >= today;
    }).length;

    const pendingApprovals = filteredRequests.filter(req => req.status === 'PENDING').length;

    const upcomingLeaves = filteredRequests.filter(req => {
      const reqStart = new Date(req.startDate);
      return req.status === 'APPROVED' && reqStart > today;
    }).length;

    // Calculate conflicting requests (days with multiple people on leave)
    const dateLeaveCount = new Map();
    filteredRequests.forEach(req => {
      if (req.status === 'APPROVED') {
        const startDate = new Date(req.startDate);
        const endDate = new Date(req.endDate);

        // Count each day in the leave period
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dateKey = date.toDateString();
          dateLeaveCount.set(dateKey, (dateLeaveCount.get(dateKey) || 0) + 1);
        }
      }
    });

    const conflictingRequests = Array.from(dateLeaveCount.values()).filter(count => count > 3).length;

    const stats = {
      totalOnLeave,
      pendingApprovals,
      upcomingLeaves,
      conflictingRequests
    };

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;