import { prisma } from '../index';
import { logger } from '../utils/logger';

export interface ForecastParameters {
  startDate: Date;
  endDate: Date;
  departments?: string[];
  includeHistoricalData: boolean;
  forecastPeriodMonths: number;
  confidenceLevel: number; // 0.8 = 80% confidence
}

export interface LeaveForecast {
  period: string; // YYYY-MM format
  department: string;
  predictedRequests: number;
  predictedDays: number;
  seasonalityFactor: number;
  trendFactor: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export interface TeamCapacityForecast {
  date: string;
  department: string;
  totalEmployees: number;
  forecastedAbsent: number;
  availableCapacity: number;
  capacityUtilization: number;
  criticalPeriods: {
    start: string;
    end: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  }[];
}

export interface SeasonalPattern {
  month: number;
  monthName: string;
  averageRequests: number;
  averageDays: number;
  volatility: number;
  leaveTypeDistribution: {
    type: string;
    percentage: number;
  }[];
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  prediction3Months: number;
  prediction6Months: number;
  prediction12Months: number;
}

class ForecastingService {

  async generateLeaveForecast(params: ForecastParameters): Promise<LeaveForecast[]> {
    try {
      logger.info('Generating leave forecast with parameters:', params);

      // Get historical data
      const historicalData = await this.getHistoricalLeaveData(params);

      // Calculate seasonal patterns
      const seasonalPatterns = await this.calculateSeasonalPatterns(historicalData);

      // Calculate trend factors
      const trendFactors = await this.calculateTrendFactors(historicalData);

      // Generate forecasts for each period
      const forecasts: LeaveForecast[] = [];
      const startForecast = new Date(params.startDate);

      for (let i = 0; i < params.forecastPeriodMonths; i++) {
        const forecastDate = new Date(startForecast);
        forecastDate.setMonth(forecastDate.getMonth() + i);

        const month = forecastDate.getMonth() + 1;
        const year = forecastDate.getFullYear();
        const period = `${year}-${month.toString().padStart(2, '0')}`;

        // Get departments to forecast
        const departments = params.departments || await this.getAllDepartments();

        for (const department of departments) {
          const forecast = await this.generateDepartmentForecast(
            department,
            period,
            month,
            seasonalPatterns,
            trendFactors,
            historicalData,
            params.confidenceLevel
          );

          forecasts.push(forecast);
        }
      }

      return forecasts;
    } catch (error) {
      logger.error('Error generating leave forecast:', error);
      throw new Error('Failed to generate leave forecast');
    }
  }

  async generateCapacityForecast(params: ForecastParameters): Promise<TeamCapacityForecast[]> {
    try {
      const forecasts: TeamCapacityForecast[] = [];
      const departments = params.departments || await this.getAllDepartments();

      for (const department of departments) {
        // Get department employee count
        const employeeCount = await prisma.user.count({
          where: { department }
        });

        // Get historical absence patterns
        const historicalAbsences = await this.getHistoricalAbsenceData(department, params);

        // Generate daily capacity forecasts
        const currentDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);

        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const month = currentDate.getMonth() + 1;
          const dayOfWeek = currentDate.getDay();

          // Calculate forecasted absences based on historical patterns
          const baseAbsenceRate = this.calculateBaseAbsenceRate(historicalAbsences, month, dayOfWeek);
          const seasonalMultiplier = this.getSeasonalMultiplier(month);
          const weekdayMultiplier = this.getWeekdayMultiplier(dayOfWeek);

          const forecastedAbsent = Math.round(
            employeeCount * baseAbsenceRate * seasonalMultiplier * weekdayMultiplier
          );

          const availableCapacity = employeeCount - forecastedAbsent;
          const capacityUtilization = (forecastedAbsent / employeeCount) * 100;

          // Identify critical periods
          const criticalPeriods = await this.identifyCriticalPeriods(
            currentDate,
            department,
            capacityUtilization
          );

          forecasts.push({
            date: dateStr,
            department,
            totalEmployees: employeeCount,
            forecastedAbsent,
            availableCapacity,
            capacityUtilization,
            criticalPeriods
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return forecasts;
    } catch (error) {
      logger.error('Error generating capacity forecast:', error);
      throw new Error('Failed to generate capacity forecast');
    }
  }

  async getSeasonalPatterns(): Promise<SeasonalPattern[]> {
    try {
      const patterns: SeasonalPattern[] = [];

      for (let month = 1; month <= 12; month++) {
        const monthData = await prisma.leaveRequest.findMany({
          where: {
            status: 'APPROVED',
            startDate: {
              gte: new Date(new Date().getFullYear() - 2, month - 1, 1),
              lt: new Date(new Date().getFullYear(), month - 1, 1)
            }
          }
        });

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Group data by year to calculate volatility
        const yearlyData: { [year: number]: { requests: number; days: number } } = {};

        monthData.forEach(leave => {
          const year = leave.startDate.getFullYear();
          if (!yearlyData[year]) {
            yearlyData[year] = { requests: 0, days: 0 };
          }
          yearlyData[year].requests++;
          yearlyData[year].days += leave.totalDays;
        });

        const yearlyRequests = Object.values(yearlyData).map(d => d.requests);
        const yearlyDays = Object.values(yearlyData).map(d => d.days);

        const averageRequests = yearlyRequests.length > 0
          ? yearlyRequests.reduce((a, b) => a + b, 0) / yearlyRequests.length
          : 0;

        const averageDays = yearlyDays.length > 0
          ? yearlyDays.reduce((a, b) => a + b, 0) / yearlyDays.length
          : 0;

        // Calculate volatility (standard deviation)
        const requestsVariance = yearlyRequests.length > 1
          ? yearlyRequests.reduce((acc, val) => acc + Math.pow(val - averageRequests, 2), 0) / (yearlyRequests.length - 1)
          : 0;
        const volatility = Math.sqrt(requestsVariance);

        // Calculate leave type distribution
        const leaveTypeCounts: { [type: string]: number } = {};
        monthData.forEach(leave => {
          leaveTypeCounts[leave.leaveType] = (leaveTypeCounts[leave.leaveType] || 0) + 1;
        });

        const totalRequests = monthData.length;
        const leaveTypeDistribution = Object.entries(leaveTypeCounts).map(([type, count]) => ({
          type,
          percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
        }));

        patterns.push({
          month,
          monthName: monthNames[month - 1],
          averageRequests,
          averageDays,
          volatility,
          leaveTypeDistribution
        });
      }

      return patterns;
    } catch (error) {
      logger.error('Error calculating seasonal patterns:', error);
      throw new Error('Failed to calculate seasonal patterns');
    }
  }

  async getTrendAnalysis(): Promise<TrendAnalysis[]> {
    try {
      const analyses: TrendAnalysis[] = [];
      const currentDate = new Date();
      const threeMonthsAgo = new Date(currentDate);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const sixMonthsAgo = new Date(currentDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Analyze various metrics
      const metrics = [
        'totalRequests',
        'averageDuration',
        'approvalRate',
        'rejectionRate'
      ];

      for (const metric of metrics) {
        const currentValue = await this.calculateMetricValue(metric, threeMonthsAgo, currentDate);
        const previousValue = await this.calculateMetricValue(metric, sixMonthsAgo, threeMonthsAgo);

        const changePercentage = previousValue !== 0
          ? ((currentValue - previousValue) / previousValue) * 100
          : 0;

        let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
        if (Math.abs(changePercentage) > 5) {
          trend = changePercentage > 0 ? 'INCREASING' : 'DECREASING';
        }

        // Simple linear projection for predictions
        const monthlyGrowthRate = changePercentage / 3; // 3 months
        const prediction3Months = currentValue * (1 + (monthlyGrowthRate * 3) / 100);
        const prediction6Months = currentValue * (1 + (monthlyGrowthRate * 6) / 100);
        const prediction12Months = currentValue * (1 + (monthlyGrowthRate * 12) / 100);

        analyses.push({
          metric,
          currentValue,
          previousValue,
          changePercentage,
          trend,
          prediction3Months,
          prediction6Months,
          prediction12Months
        });
      }

      return analyses;
    } catch (error) {
      logger.error('Error calculating trend analysis:', error);
      throw new Error('Failed to calculate trend analysis');
    }
  }

  async getLeaveBalancePredictions(userId: string): Promise<{
    currentBalances: { [leaveType: string]: number };
    projectedBalances: { [leaveType: string]: number };
    recommendedActions: string[];
    expiringLeaves: { leaveType: string; amount: number; expiryDate: Date }[];
  }> {
    try {
      // Get current leave balances
      const currentBalances = await prisma.leaveBalance.findMany({
        where: { userId }
      });

      const balanceMap: { [leaveType: string]: number } = {};
      currentBalances.forEach(balance => {
        balanceMap[balance.leaveType] = balance.balance;
      });

      // Get user's historical leave usage patterns
      const historicalUsage = await prisma.leaveRequest.findMany({
        where: {
          employeeId: userId,
          status: 'APPROVED',
          startDate: {
            gte: new Date(new Date().getFullYear() - 1, 0, 1)
          }
        }
      });

      // Calculate monthly usage patterns
      const monthlyUsage: { [month: number]: { [leaveType: string]: number } } = {};
      historicalUsage.forEach(leave => {
        const month = leave.startDate.getMonth();
        if (!monthlyUsage[month]) {
          monthlyUsage[month] = {};
        }
        monthlyUsage[month][leave.leaveType] =
          (monthlyUsage[month][leave.leaveType] || 0) + leave.totalDays;
      });

      // Project future usage and balances
      const projectedBalances: { [leaveType: string]: number } = { ...balanceMap };
      const currentMonth = new Date().getMonth();

      Object.keys(balanceMap).forEach(leaveType => {
        let projectedUsage = 0;

        // Project usage for remaining months of the year
        for (let month = currentMonth; month < 12; month++) {
          const historicalMonthlyUsage = monthlyUsage[month]?.[leaveType] || 0;
          projectedUsage += historicalMonthlyUsage;
        }

        projectedBalances[leaveType] = Math.max(0, balanceMap[leaveType] - projectedUsage);
      });

      // Generate recommendations
      const recommendedActions: string[] = [];
      Object.entries(projectedBalances).forEach(([leaveType, balance]) => {
        const currentBalance = balanceMap[leaveType];
        if (balance < currentBalance * 0.2) {
          recommendedActions.push(`Consider planning ${leaveType.replace('_', ' ')} soon - low projected balance`);
        }
        if (currentBalance > 20) {
          recommendedActions.push(`High ${leaveType.replace('_', ' ')} balance - consider using some days`);
        }
      });

      // Identify expiring leaves (mock data for now)
      const expiringLeaves = currentBalances
        .filter(balance => balance.balance > 0)
        .map(balance => ({
          leaveType: balance.leaveType,
          amount: Math.floor(balance.balance * 0.3), // Assume 30% expires
          expiryDate: new Date(new Date().getFullYear(), 11, 31) // End of year
        }))
        .filter(item => item.amount > 0);

      return {
        currentBalances: balanceMap,
        projectedBalances,
        recommendedActions,
        expiringLeaves
      };
    } catch (error) {
      logger.error('Error generating leave balance predictions:', error);
      throw new Error('Failed to generate leave balance predictions');
    }
  }

  private async getHistoricalLeaveData(params: ForecastParameters): Promise<any[]> {
    const historicalStartDate = new Date(params.startDate);
    historicalStartDate.setFullYear(historicalStartDate.getFullYear() - 2);

    return await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: historicalStartDate,
          lt: params.startDate
        },
        ...(params.departments && {
          employee: {
            department: { in: params.departments }
          }
        })
      },
      include: {
        employee: {
          select: {
            department: true
          }
        }
      }
    });
  }

  private async calculateSeasonalPatterns(historicalData: any[]): Promise<{ [month: number]: number }> {
    const monthlyAverages: { [month: number]: number } = {};

    for (let month = 1; month <= 12; month++) {
      const monthData = historicalData.filter(
        leave => leave.startDate.getMonth() + 1 === month
      );

      const yearlyTotals: { [year: number]: number } = {};
      monthData.forEach(leave => {
        const year = leave.startDate.getFullYear();
        yearlyTotals[year] = (yearlyTotals[year] || 0) + 1;
      });

      const values = Object.values(yearlyTotals);
      monthlyAverages[month] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    }

    return monthlyAverages;
  }

  private async calculateTrendFactors(historicalData: any[]): Promise<number> {
    // Simple linear trend calculation
    const monthlyData: { [period: string]: number } = {};

    historicalData.forEach(leave => {
      const period = `${leave.startDate.getFullYear()}-${leave.startDate.getMonth() + 1}`;
      monthlyData[period] = (monthlyData[period] || 0) + 1;
    });

    const periods = Object.keys(monthlyData).sort();
    const values = periods.map(period => monthlyData[period]);

    if (values.length < 2) return 1;

    // Calculate simple moving average trend
    const recentAvg = values.slice(-6).reduce((a, b) => a + b, 0) / Math.min(6, values.length);
    const olderAvg = values.slice(0, -6).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 6);

    return olderAvg !== 0 ? recentAvg / olderAvg : 1;
  }

  private async generateDepartmentForecast(
    department: string,
    period: string,
    month: number,
    seasonalPatterns: { [month: number]: number },
    trendFactors: number,
    historicalData: any[],
    confidenceLevel: number
  ): Promise<LeaveForecast> {
    const baseRate = seasonalPatterns[month] || 0;
    const seasonalityFactor = baseRate;
    const trendFactor = trendFactors;

    const predictedRequests = Math.round(baseRate * trendFactor);
    const predictedDays = predictedRequests * 3.5; // Average 3.5 days per request

    // Calculate confidence interval
    const variance = Math.max(1, baseRate * 0.2); // 20% variance
    const confidenceMultiplier = confidenceLevel === 0.95 ? 1.96 : 1.645; // 95% vs 90%
    const marginOfError = confidenceMultiplier * Math.sqrt(variance);

    const confidenceInterval = {
      lower: Math.max(0, Math.round(predictedRequests - marginOfError)),
      upper: Math.round(predictedRequests + marginOfError)
    };

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (predictedRequests > baseRate * 1.5) riskLevel = 'HIGH';
    else if (predictedRequests > baseRate * 1.2) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'HIGH') {
      recommendations.push('High leave volume expected - consider additional staffing');
      recommendations.push('Review and expedite leave approval processes');
    }
    if (month === 12 || month === 1) {
      recommendations.push('Holiday season - plan for extended leave requests');
    }
    if (predictedDays > 100) {
      recommendations.push('Consider leave staggering policies for this period');
    }

    return {
      period,
      department,
      predictedRequests,
      predictedDays,
      seasonalityFactor,
      trendFactor,
      confidenceInterval,
      riskLevel,
      recommendations
    };
  }

  private async getAllDepartments(): Promise<string[]> {
    const departments = await prisma.user.findMany({
      select: { department: true },
      distinct: ['department']
    });
    return departments.map(d => d.department);
  }

  private async getHistoricalAbsenceData(department: string, params: ForecastParameters): Promise<any[]> {
    // Implementation would get historical absence data
    return [];
  }

  private calculateBaseAbsenceRate(historicalData: any[], month: number, dayOfWeek: number): number {
    // Simple calculation - in reality would be more sophisticated
    const baseRate = 0.05; // 5% base absence rate
    return baseRate;
  }

  private getSeasonalMultiplier(month: number): number {
    // Higher multipliers for vacation months
    const multipliers: { [month: number]: number } = {
      1: 1.2, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.2, 6: 1.3,
      7: 1.4, 8: 1.3, 9: 1.0, 10: 1.0, 11: 1.1, 12: 1.5
    };
    return multipliers[month] || 1.0;
  }

  private getWeekdayMultiplier(dayOfWeek: number): number {
    // Lower absence rates on weekends
    return dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.0;
  }

  private async identifyCriticalPeriods(date: Date, department: string, utilization: number): Promise<any[]> {
    const criticalPeriods = [];

    if (utilization > 30) {
      criticalPeriods.push({
        start: date.toISOString().split('T')[0],
        end: date.toISOString().split('T')[0],
        severity: 'HIGH' as const,
        reason: 'High absence rate forecasted'
      });
    }

    return criticalPeriods;
  }

  private async calculateMetricValue(metric: string, startDate: Date, endDate: Date): Promise<number> {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        appliedDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    switch (metric) {
      case 'totalRequests':
        return leaves.length;
      case 'averageDuration':
        return leaves.length > 0
          ? leaves.reduce((sum, leave) => sum + leave.totalDays, 0) / leaves.length
          : 0;
      case 'approvalRate':
        const approved = leaves.filter(l => l.status === 'APPROVED').length;
        return leaves.length > 0 ? (approved / leaves.length) * 100 : 0;
      case 'rejectionRate':
        const rejected = leaves.filter(l => l.status === 'REJECTED').length;
        return leaves.length > 0 ? (rejected / leaves.length) * 100 : 0;
      default:
        return 0;
    }
  }
}

export const forecastingService = new ForecastingService();