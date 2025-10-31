import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedConfigurations() {
  console.log('🌱 Starting configuration seed...\n');

  try {
    // 1. LEAVE TYPE CONFIGURATIONS
    console.log('📋 Seeding Leave Type Configurations...');

    const leaveTypes = [
      // INDIA Leave Types
      {
        leaveTypeCode: 'CASUAL_LEAVE',
        displayName: 'Casual Leave (CL)',
        description: 'Short-term leave for personal matters',
        region: 'INDIA',
        defaultEntitlement: 12,
        allowNegativeBalance: false,
        requiresDocumentation: false,
        minimumAdvanceNoticeDays: 0,
        maxFutureBookingDays: 90,
        maxConsecutiveDays: 5,
        allowFullDay: true,
        allowHalfDay: true,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#3B82F6',
        icon: 'calendar',
      },
      {
        leaveTypeCode: 'PRIVILEGE_LEAVE',
        displayName: 'Privilege Leave (PL)',
        description: 'Planned leave for vacation or personal time',
        region: 'INDIA',
        defaultEntitlement: 12,
        allowNegativeBalance: false,
        requiresDocumentation: false,
        minimumAdvanceNoticeDays: 7,
        maxFutureBookingDays: 180,
        maxConsecutiveDays: 30,
        allowFullDay: true,
        allowHalfDay: true,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#10B981',
        icon: 'beach',
      },
      {
        leaveTypeCode: 'MATERNITY_LEAVE',
        displayName: 'Maternity Leave',
        description: 'Leave for maternity purposes',
        region: 'INDIA',
        defaultEntitlement: 180,
        allowNegativeBalance: false,
        requiresDocumentation: true,
        documentationThreshold: 1,
        eligibilityCriteria: JSON.stringify({
          gender: ['FEMALE'],
          maritalStatus: ['MARRIED'],
        }),
        minimumAdvanceNoticeDays: 30,
        maxFutureBookingDays: 90,
        maxConsecutiveDays: 180,
        allowFullDay: true,
        allowHalfDay: false,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#EC4899',
        icon: 'baby',
      },
      {
        leaveTypeCode: 'PATERNITY_LEAVE',
        displayName: 'Paternity Leave',
        description: 'Leave for paternity purposes',
        region: 'INDIA',
        defaultEntitlement: 5,
        allowNegativeBalance: false,
        requiresDocumentation: false,
        eligibilityCriteria: JSON.stringify({
          gender: ['MALE'],
          maritalStatus: ['MARRIED'],
        }),
        minimumAdvanceNoticeDays: 7,
        maxFutureBookingDays: 30,
        maxConsecutiveDays: 5,
        allowFullDay: true,
        allowHalfDay: false,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#8B5CF6',
        icon: 'baby',
      },
      {
        leaveTypeCode: 'LEAVE_WITHOUT_PAY',
        displayName: 'Leave Without Pay (LWP)',
        description: 'Unpaid leave',
        region: 'INDIA',
        defaultEntitlement: 0,
        allowNegativeBalance: true,
        negativeBalanceLimit: 365,
        requiresDocumentation: false,
        minimumAdvanceNoticeDays: 2,
        maxFutureBookingDays: 90,
        maxConsecutiveDays: 30,
        allowFullDay: true,
        allowHalfDay: true,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#F59E0B',
        icon: 'pause',
      },
      // USA Leave Types
      {
        leaveTypeCode: 'PTO',
        displayName: 'Paid Time Off (PTO)',
        description: 'Flexible paid time off',
        region: 'USA',
        defaultEntitlement: 15,
        allowNegativeBalance: false,
        requiresDocumentation: false,
        minimumAdvanceNoticeDays: 3,
        maxFutureBookingDays: 180,
        maxConsecutiveDays: 30,
        allowFullDay: true,
        allowHalfDay: true,
        allowQuarterDay: true,
        allowHourly: true,
        colorCode: '#06B6D4',
        icon: 'calendar-check',
      },
      {
        leaveTypeCode: 'BEREAVEMENT_LEAVE',
        displayName: 'Bereavement Leave',
        description: 'Leave for family bereavement',
        region: 'USA',
        defaultEntitlement: 3,
        allowNegativeBalance: false,
        requiresDocumentation: true,
        documentationThreshold: 1,
        minimumAdvanceNoticeDays: 0,
        maxFutureBookingDays: 7,
        maxConsecutiveDays: 3,
        allowFullDay: true,
        allowHalfDay: false,
        allowQuarterDay: false,
        allowHourly: false,
        colorCode: '#6B7280',
        icon: 'heart',
      },
    ];

    for (const leaveType of leaveTypes) {
      await prisma.leaveTypeConfiguration.upsert({
        where: { leaveTypeCode: leaveType.leaveTypeCode },
        update: leaveType,
        create: leaveType,
      });
    }
    console.log(`✅ Created ${leaveTypes.length} leave type configurations\n`);

    // 2. WIDGET DEFINITIONS
    console.log('🎨 Seeding Widget Definitions...');

    const widgets = [
      {
        widgetType: 'LEAVE_BALANCE',
        displayName: 'Leave Balance Card',
        description: 'Displays current leave balances',
        category: 'PERSONAL',
        icon: 'chart-pie',
        defaultWidth: 4,
        defaultHeight: 3,
        minWidth: 3,
        minHeight: 2,
        maxWidth: 6,
        maxHeight: 4,
        dataSourceEndpoint: '/api/v1/leave-balances/current',
        refreshIntervalSeconds: 300,
        requiredPermissions: JSON.stringify(['VIEW_OWN_BALANCE']),
        allowedRoles: JSON.stringify(['EMPLOYEE', 'MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'UPCOMING_HOLIDAYS',
        displayName: 'Upcoming Holidays',
        description: 'Shows next upcoming holidays',
        category: 'PERSONAL',
        icon: 'calendar-star',
        defaultWidth: 3,
        defaultHeight: 3,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        dataSourceEndpoint: '/api/v1/holidays/upcoming',
        refreshIntervalSeconds: 3600,
        allowedRoles: JSON.stringify(['EMPLOYEE', 'MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'TEAM_CALENDAR',
        displayName: 'Team Calendar',
        description: 'Team member leave calendar',
        category: 'TEAM',
        icon: 'users',
        defaultWidth: 8,
        defaultHeight: 4,
        minWidth: 6,
        minHeight: 3,
        maxWidth: 12,
        maxHeight: 6,
        dataSourceEndpoint: '/api/v1/team/calendar',
        refreshIntervalSeconds: 600,
        requiredPermissions: JSON.stringify(['VIEW_TEAM_CALENDAR']),
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'PENDING_APPROVALS',
        displayName: 'Pending Approvals',
        description: 'Leave requests pending your approval',
        category: 'TEAM',
        icon: 'clock',
        defaultWidth: 4,
        defaultHeight: 3,
        minWidth: 3,
        minHeight: 2,
        maxWidth: 6,
        maxHeight: 5,
        dataSourceEndpoint: '/api/v1/approvals/pending',
        refreshIntervalSeconds: 120,
        requiredPermissions: JSON.stringify(['APPROVE_LEAVES']),
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'LEAVE_TREND',
        displayName: 'Leave Trend Chart',
        description: 'Leave usage over time',
        category: 'ANALYTICS',
        icon: 'chart-line',
        defaultWidth: 6,
        defaultHeight: 4,
        minWidth: 4,
        minHeight: 3,
        maxWidth: 12,
        maxHeight: 6,
        dataSourceEndpoint: '/api/v1/analytics/leave-trends',
        refreshIntervalSeconds: 1800,
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'COMP_OFF_BALANCE',
        displayName: 'Comp Off Balance',
        description: 'Compensatory off credits and expiry',
        category: 'PERSONAL',
        icon: 'clock-rotate-left',
        defaultWidth: 3,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 3,
        dataSourceEndpoint: '/api/v1/comp-off/balance',
        refreshIntervalSeconds: 600,
        allowedRoles: JSON.stringify(['EMPLOYEE', 'MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'QUICK_ACTIONS',
        displayName: 'Quick Actions',
        description: 'Quick access buttons',
        category: 'PERSONAL',
        icon: 'bolt',
        defaultWidth: 3,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 3,
        refreshIntervalSeconds: 0,
        allowedRoles: JSON.stringify(['EMPLOYEE', 'MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
      },
      {
        widgetType: 'DEPARTMENT_STATS',
        displayName: 'Department Statistics',
        description: 'Department-wide leave metrics',
        category: 'ANALYTICS',
        icon: 'building',
        defaultWidth: 6,
        defaultHeight: 4,
        minWidth: 4,
        minHeight: 3,
        maxWidth: 12,
        maxHeight: 6,
        dataSourceEndpoint: '/api/v1/analytics/department-stats',
        refreshIntervalSeconds: 1800,
        requiredPermissions: JSON.stringify(['VIEW_DEPARTMENT_STATS']),
        allowedRoles: JSON.stringify(['HR', 'HR_ADMIN', 'ADMIN']),
      },
    ];

    for (const widget of widgets) {
      await prisma.widgetDefinition.upsert({
        where: { widgetType: widget.widgetType },
        update: widget,
        create: widget,
      });
    }
    console.log(`✅ Created ${widgets.length} widget definitions\n`);

    // 3. DASHBOARD CONFIGURATIONS (Role-based defaults)
    console.log('📊 Seeding Dashboard Configurations...');

    const dashboards = [
      {
        role: 'EMPLOYEE',
        isDefault: true,
        name: 'Employee Default Dashboard',
        description: 'Default dashboard for employees',
        layoutConfig: JSON.stringify({
          columns: 12,
          widgets: [
            { widgetId: 'w1', widgetType: 'LEAVE_BALANCE', position: { x: 0, y: 0, width: 4, height: 3 } },
            { widgetId: 'w2', widgetType: 'UPCOMING_HOLIDAYS', position: { x: 4, y: 0, width: 3, height: 3 } },
            { widgetId: 'w3', widgetType: 'COMP_OFF_BALANCE', position: { x: 7, y: 0, width: 3, height: 2 } },
            { widgetId: 'w4', widgetType: 'QUICK_ACTIONS', position: { x: 10, y: 0, width: 2, height: 2 } },
          ],
        }),
      },
      {
        role: 'MANAGER',
        isDefault: true,
        name: 'Manager Default Dashboard',
        description: 'Default dashboard for managers',
        layoutConfig: JSON.stringify({
          columns: 12,
          widgets: [
            { widgetId: 'w1', widgetType: 'PENDING_APPROVALS', position: { x: 0, y: 0, width: 4, height: 3 } },
            { widgetId: 'w2', widgetType: 'TEAM_CALENDAR', position: { x: 4, y: 0, width: 8, height: 4 } },
            { widgetId: 'w3', widgetType: 'LEAVE_BALANCE', position: { x: 0, y: 3, width: 4, height: 3 } },
            { widgetId: 'w4', widgetType: 'LEAVE_TREND', position: { x: 0, y: 6, width: 6, height: 4 } },
          ],
        }),
      },
      {
        role: 'HR',
        isDefault: true,
        name: 'HR Default Dashboard',
        description: 'Default dashboard for HR',
        layoutConfig: JSON.stringify({
          columns: 12,
          widgets: [
            { widgetId: 'w1', widgetType: 'PENDING_APPROVALS', position: { x: 0, y: 0, width: 4, height: 3 } },
            { widgetId: 'w2', widgetType: 'DEPARTMENT_STATS', position: { x: 4, y: 0, width: 8, height: 4 } },
            { widgetId: 'w3', widgetType: 'LEAVE_TREND', position: { x: 0, y: 4, width: 6, height: 4 } },
            { widgetId: 'w4', widgetType: 'TEAM_CALENDAR', position: { x: 6, y: 4, width: 6, height: 4 } },
          ],
        }),
      },
    ];

    for (const dashboard of dashboards) {
      await prisma.dashboardConfiguration.create({
        data: dashboard,
      });
    }
    console.log(`✅ Created ${dashboards.length} dashboard configurations\n`);

    // 4. BULK ACTION CONFIGURATIONS
    console.log('⚡ Seeding Bulk Action Configurations...');

    const bulkActions = [
      {
        actionType: 'APPROVE',
        enabled: true,
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
        maxItemsPerAction: 100,
        requiresConfirmation: true,
        requiresReason: false,
        validationRules: JSON.stringify({
          sameLeaveType: false,
          sameDepartment: false,
          sameStatus: true,
          withinDateRange: false,
        }),
        confirmationConfig: JSON.stringify({
          showSummary: true,
          summaryFields: ['employeeName', 'leaveType', 'duration', 'dates'],
          warningThreshold: 50,
          requiresComment: false,
          allowPartialExecution: true,
        }),
        auditConfig: JSON.stringify({
          logLevel: 'DETAILED',
          captureBeforeState: true,
          captureAfterState: true,
          notifyOnCompletion: true,
        }),
      },
      {
        actionType: 'REJECT',
        enabled: true,
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
        maxItemsPerAction: 100,
        requiresConfirmation: true,
        requiresReason: true,
        validationRules: JSON.stringify({
          sameLeaveType: false,
          sameDepartment: false,
          sameStatus: true,
          withinDateRange: false,
        }),
        confirmationConfig: JSON.stringify({
          showSummary: true,
          summaryFields: ['employeeName', 'leaveType', 'duration', 'dates'],
          warningThreshold: 50,
          requiresComment: true,
          allowPartialExecution: true,
        }),
        auditConfig: JSON.stringify({
          logLevel: 'DETAILED',
          captureBeforeState: true,
          captureAfterState: true,
          notifyOnCompletion: true,
        }),
      },
      {
        actionType: 'EXPORT',
        enabled: true,
        allowedRoles: JSON.stringify(['MANAGER', 'HR', 'HR_ADMIN', 'ADMIN']),
        maxItemsPerAction: 1000,
        requiresConfirmation: false,
        requiresReason: false,
        auditConfig: JSON.stringify({
          logLevel: 'BASIC',
          captureBeforeState: false,
          captureAfterState: false,
          notifyOnCompletion: false,
        }),
      },
    ];

    for (const action of bulkActions) {
      await prisma.bulkActionConfiguration.upsert({
        where: { actionType: action.actionType },
        update: action,
        create: action,
      });
    }
    console.log(`✅ Created ${bulkActions.length} bulk action configurations\n`);

    // 5. WORKFLOW CONFIGURATIONS
    console.log('🔄 Seeding Workflow Configurations...');

    const workflows = [
      {
        workflowType: 'LEAVE_REQUEST',
        name: 'Standard Leave Approval',
        description: 'Employee → Manager → HR approval flow',
        isDefault: true,
        priority: 1,
        conditions: JSON.stringify({}),
        steps: JSON.stringify([
          {
            level: 1,
            approverRole: 'REPORTING_MANAGER',
            executionMode: 'SEQUENTIAL',
            autoApproveAfterHours: null,
            escalateAfterHours: 48,
            escalateTo: 'HR',
          },
          {
            level: 2,
            approverRole: 'HR',
            executionMode: 'SEQUENTIAL',
            autoApproveAfterHours: null,
            escalateAfterHours: 72,
            escalateTo: 'HR_ADMIN',
          },
        ]),
        autoApprovalRules: JSON.stringify({
          enabled: false,
        }),
      },
      {
        workflowType: 'COMP_OFF_REQUEST',
        name: 'Comp Off Approval',
        description: 'Employee → L1 Manager → L2 Manager → HR',
        isDefault: true,
        priority: 1,
        conditions: JSON.stringify({}),
        steps: JSON.stringify([
          {
            level: 1,
            approverRole: 'REPORTING_MANAGER',
            executionMode: 'SEQUENTIAL',
            escalateAfterHours: 48,
          },
          {
            level: 2,
            approverRole: 'SECOND_LEVEL_MANAGER',
            executionMode: 'SEQUENTIAL',
            escalateAfterHours: 48,
          },
          {
            level: 3,
            approverRole: 'HR',
            executionMode: 'SEQUENTIAL',
            escalateAfterHours: 72,
          },
        ]),
      },
    ];

    for (const workflow of workflows) {
      await prisma.workflowConfiguration.create({
        data: workflow,
      });
    }
    console.log(`✅ Created ${workflows.length} workflow configurations\n`);

    // 6. LEAVE DURATION CONFIGURATIONS
    console.log('⏱️  Seeding Leave Duration Configurations...');

    const durationConfigs = [
      {
        region: 'INDIA',
        fullDayEnabled: true,
        fullDayHours: 8.0,
        halfDayEnabled: true,
        halfDayHours: 4.0,
        halfDaySlots: JSON.stringify([
          { code: 'FIRST_HALF', displayName: 'First Half (9 AM - 1 PM)', startTime: '09:00', endTime: '13:00' },
          { code: 'SECOND_HALF', displayName: 'Second Half (1 PM - 5 PM)', startTime: '13:00', endTime: '17:00' },
        ]),
        quarterDayEnabled: false,
        hourlyEnabled: false,
        allowMixedDuration: false,
        roundingMethod: 'NEAREST',
        roundingPrecision: 0.5,
      },
      {
        region: 'USA',
        fullDayEnabled: true,
        fullDayHours: 8.0,
        halfDayEnabled: true,
        halfDayHours: 4.0,
        halfDaySlots: JSON.stringify([
          { code: 'FIRST_HALF', displayName: 'First Half (9 AM - 1 PM)', startTime: '09:00', endTime: '13:00' },
          { code: 'SECOND_HALF', displayName: 'Second Half (1 PM - 5 PM)', startTime: '13:00', endTime: '17:00' },
        ]),
        quarterDayEnabled: true,
        quarterDayHours: 2.0,
        quarterDaySlots: JSON.stringify([
          { code: 'MORNING', displayName: 'Morning (9-11 AM)', startTime: '09:00', endTime: '11:00' },
          { code: 'LATE_MORNING', displayName: 'Late Morning (11 AM-1 PM)', startTime: '11:00', endTime: '13:00' },
          { code: 'AFTERNOON', displayName: 'Afternoon (1-3 PM)', startTime: '13:00', endTime: '15:00' },
          { code: 'EVENING', displayName: 'Evening (3-5 PM)', startTime: '15:00', endTime: '17:00' },
        ]),
        hourlyEnabled: true,
        minimumHours: 1.0,
        maximumHours: 8.0,
        allowedLeaveTypes: JSON.stringify(['PTO']),
        allowMixedDuration: true,
        roundingMethod: 'NEAREST',
        roundingPrecision: 0.25,
      },
      {
        region: 'GLOBAL',
        fullDayEnabled: true,
        fullDayHours: 8.0,
        halfDayEnabled: true,
        halfDayHours: 4.0,
        halfDaySlots: JSON.stringify([
          { code: 'FIRST_HALF', displayName: 'First Half', startTime: '09:00', endTime: '13:00' },
          { code: 'SECOND_HALF', displayName: 'Second Half', startTime: '13:00', endTime: '17:00' },
        ]),
        quarterDayEnabled: false,
        hourlyEnabled: false,
        allowMixedDuration: false,
        roundingMethod: 'NEAREST',
        roundingPrecision: 0.5,
      },
    ];

    for (const config of durationConfigs) {
      await prisma.leaveDurationConfiguration.upsert({
        where: { region: config.region },
        update: config,
        create: config,
      });
    }
    console.log(`✅ Created ${durationConfigs.length} duration configurations\n`);

    // 7. TEAM CALENDAR CONFIGURATIONS
    console.log('📅 Seeding Team Calendar Configurations...');

    const calendarConfig = {
      department: null, // Global configuration
      teamDefinitionType: 'REPORTING_HIERARCHY',
      includeSubordinates: true,
      subordinateDepth: 2,
      displayConfig: JSON.stringify({
        defaultView: 'MONTH',
        colorScheme: {
          leaveTypeColors: {
            CASUAL_LEAVE: '#3B82F6',
            PRIVILEGE_LEAVE: '#10B981',
            MATERNITY_LEAVE: '#EC4899',
            PATERNITY_LEAVE: '#8B5CF6',
            PTO: '#06B6D4',
          },
          statusColors: {
            APPROVED: '#10B981',
            PENDING: '#F59E0B',
            REJECTED: '#EF4444',
          },
        },
        showWeekends: true,
        showHolidays: true,
        highlightCurrentDay: true,
      }),
      overlapEnabled: true,
      overlapCalculation: 'PERCENTAGE',
      overlapThreshold: 20.0,
      excludeLeaveTypes: JSON.stringify(['LEAVE_WITHOUT_PAY']),
      minimumTeamSize: 2,
      overlapActions: JSON.stringify({
        showWarning: true,
        blockApplication: false,
        requiresManagerOverride: false,
        notifyManager: true,
        suggestAlternateDates: true,
      }),
      externalCalendarEnabled: false,
      syncProviders: JSON.stringify(['GOOGLE', 'OUTLOOK']),
      syncFrequencyMinutes: 30,
    };

    await prisma.teamCalendarConfiguration.create({
      data: calendarConfig,
    });
    console.log('✅ Created team calendar configuration\n');

    // 8. LEAVE BALANCE VISIBILITY CONFIGURATIONS
    console.log('👁️  Seeding Leave Balance Visibility Configurations...');

    const visibilityConfigs = [
      {
        role: 'EMPLOYEE',
        canViewOwnBalance: true,
        canViewTeamBalance: false,
        canViewDepartmentBalance: false,
        canViewOrganizationBalance: false,
        canViewBalanceHistory: true,
        canViewProjectedBalance: true,
        canExportBalances: false,
        displayOptions: JSON.stringify({
          showInDashboard: true,
          showDuringApplication: true,
          showInReports: false,
          showDetailedBreakdown: true,
          showExpiryInformation: true,
          groupByLeaveType: true,
          includeCompOff: true,
        }),
        alertConfig: JSON.stringify({
          enabled: true,
          lowBalanceThreshold: 2,
          highBalanceThreshold: 20,
          expiryReminderDays: [90, 60, 30, 15, 7],
          negativeBalanceAlert: true,
          notificationChannels: ['EMAIL', 'IN_APP'],
        }),
      },
      {
        role: 'MANAGER',
        canViewOwnBalance: true,
        canViewTeamBalance: true,
        canViewDepartmentBalance: false,
        canViewOrganizationBalance: false,
        canViewBalanceHistory: true,
        canViewProjectedBalance: true,
        canExportBalances: true,
        displayOptions: JSON.stringify({
          showInDashboard: true,
          showDuringApplication: true,
          showInReports: true,
          showDetailedBreakdown: true,
          showExpiryInformation: true,
          groupByLeaveType: true,
          includeCompOff: true,
        }),
        alertConfig: JSON.stringify({
          enabled: true,
          lowBalanceThreshold: 2,
          highBalanceThreshold: 20,
          expiryReminderDays: [90, 60, 30],
          negativeBalanceAlert: true,
          notificationChannels: ['EMAIL', 'IN_APP'],
        }),
      },
      {
        role: 'HR',
        canViewOwnBalance: true,
        canViewTeamBalance: true,
        canViewDepartmentBalance: true,
        canViewOrganizationBalance: true,
        canViewBalanceHistory: true,
        canViewProjectedBalance: true,
        canExportBalances: true,
        displayOptions: JSON.stringify({
          showInDashboard: true,
          showDuringApplication: true,
          showInReports: true,
          showDetailedBreakdown: true,
          showExpiryInformation: true,
          groupByLeaveType: true,
          includeCompOff: true,
        }),
        alertConfig: JSON.stringify({
          enabled: false,
        }),
      },
      {
        role: 'HR_ADMIN',
        canViewOwnBalance: true,
        canViewTeamBalance: true,
        canViewDepartmentBalance: true,
        canViewOrganizationBalance: true,
        canViewBalanceHistory: true,
        canViewProjectedBalance: true,
        canExportBalances: true,
        displayOptions: JSON.stringify({
          showInDashboard: true,
          showDuringApplication: true,
          showInReports: true,
          showDetailedBreakdown: true,
          showExpiryInformation: true,
          groupByLeaveType: true,
          includeCompOff: true,
        }),
        alertConfig: JSON.stringify({
          enabled: false,
        }),
      },
    ];

    for (const config of visibilityConfigs) {
      await prisma.leaveBalanceVisibilityConfig.upsert({
        where: { role: config.role },
        update: config,
        create: config,
      });
    }
    console.log(`✅ Created ${visibilityConfigs.length} visibility configurations\n`);

    console.log('✨ Configuration seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${leaveTypes.length} Leave Type Configurations`);
    console.log(`   - ${widgets.length} Widget Definitions`);
    console.log(`   - ${dashboards.length} Dashboard Configurations`);
    console.log(`   - ${bulkActions.length} Bulk Action Configurations`);
    console.log(`   - ${workflows.length} Workflow Configurations`);
    console.log(`   - ${durationConfigs.length} Duration Configurations`);
    console.log(`   - 1 Team Calendar Configuration`);
    console.log(`   - ${visibilityConfigs.length} Visibility Configurations`);
    console.log('\n🎉 All configurations are ready to use!');

  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedConfigurations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
