import { prisma } from '../config/database';
import { LeavePolicy, LeaveType, Region, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateLeavePolicyData {
  name: string;
  leaveType: LeaveType;
  entitlementDays: number;
  accrualRate?: number;
  maxCarryForward?: number;
  minimumGap?: number;
  maxConsecutiveDays?: number;
  requiresDocumentation?: boolean;
  documentationThreshold?: number;
  location: string;
  region: Region;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export interface UpdateLeavePolicyData extends Partial<CreateLeavePolicyData> {
  id: string;
}

export interface LeavePolicyFilters {
  leaveType?: LeaveType;
  region?: Region;
  location?: string;
  isActive?: boolean;
  effectiveDate?: Date;
}

export class LeavePolicyService {
  /**
   * Create a new leave policy
   */
  static async createPolicy(data: CreateLeavePolicyData): Promise<LeavePolicy> {
    try {
      logger.info('Creating new leave policy:', { name: data.name, leaveType: data.leaveType });

      const policy = await prisma.leavePolicy.create({
        data: {
          name: data.name,
          leaveType: data.leaveType,
          entitlementDays: new Prisma.Decimal(data.entitlementDays),
          accrualRate: new Prisma.Decimal(data.accrualRate || 1.0),
          maxCarryForward: new Prisma.Decimal(data.maxCarryForward || 0),
          minimumGap: data.minimumGap || 0,
          maxConsecutiveDays: data.maxConsecutiveDays || 365,
          requiresDocumentation: data.requiresDocumentation || false,
          documentationThreshold: data.documentationThreshold || 0,
          location: data.location,
          region: data.region,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      logger.info('Leave policy created successfully:', { id: policy.id, name: policy.name });
      return policy;
    } catch (error) {
      logger.error('Error creating leave policy:', error);
      throw new Error('Failed to create leave policy');
    }
  }

  /**
   * Get all leave policies with optional filters
   */
  static async getAllPolicies(filters: LeavePolicyFilters = {}): Promise<LeavePolicy[]> {
    try {
      const where: Prisma.LeavePolicyWhereInput = {};

      if (filters.leaveType) {
        where.leaveType = filters.leaveType;
      }
      if (filters.region) {
        where.region = filters.region;
      }
      if (filters.location) {
        where.location = filters.location;
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      if (filters.effectiveDate) {
        where.effectiveFrom = {
          lte: filters.effectiveDate,
        };
        where.OR = [
          { effectiveTo: null },
          { effectiveTo: { gte: filters.effectiveDate } },
        ];
      }

      const policies = await prisma.leavePolicy.findMany({
        where,
        orderBy: [
          { isActive: 'desc' },
          { leaveType: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      logger.info(`Retrieved ${policies.length} leave policies`);
      return policies;
    } catch (error) {
      logger.error('Error fetching leave policies:', error);
      throw new Error('Failed to fetch leave policies');
    }
  }

  /**
   * Get a leave policy by ID
   */
  static async getPolicyById(id: string): Promise<LeavePolicy | null> {
    try {
      const policy = await prisma.leavePolicy.findUnique({
        where: { id },
      });

      if (!policy) {
        logger.warn('Leave policy not found:', { id });
        return null;
      }

      return policy;
    } catch (error) {
      logger.error('Error fetching leave policy by ID:', error);
      throw new Error('Failed to fetch leave policy');
    }
  }

  /**
   * Update a leave policy
   */
  static async updatePolicy(data: UpdateLeavePolicyData): Promise<LeavePolicy> {
    try {
      const { id, ...updateData } = data;

      // Check if policy exists
      const existingPolicy = await this.getPolicyById(id);
      if (!existingPolicy) {
        throw new Error('Leave policy not found');
      }

      const updatedPolicy = await prisma.leavePolicy.update({
        where: { id },
        data: {
          ...updateData,
          entitlementDays: updateData.entitlementDays
            ? new Prisma.Decimal(updateData.entitlementDays)
            : undefined,
          accrualRate: updateData.accrualRate
            ? new Prisma.Decimal(updateData.accrualRate)
            : undefined,
          maxCarryForward: updateData.maxCarryForward !== undefined
            ? new Prisma.Decimal(updateData.maxCarryForward)
            : undefined,
        },
      });

      logger.info('Leave policy updated successfully:', { id, name: updatedPolicy.name });
      return updatedPolicy;
    } catch (error) {
      logger.error('Error updating leave policy:', error);
      throw new Error('Failed to update leave policy');
    }
  }

  /**
   * Delete a leave policy (soft delete by setting isActive to false)
   */
  static async deletePolicy(id: string): Promise<void> {
    try {
      // Check if policy exists
      const existingPolicy = await this.getPolicyById(id);
      if (!existingPolicy) {
        throw new Error('Leave policy not found');
      }

      await prisma.leavePolicy.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info('Leave policy soft deleted:', { id });
    } catch (error) {
      logger.error('Error deleting leave policy:', error);
      throw new Error('Failed to delete leave policy');
    }
  }

  /**
   * Get active policies for a specific leave type and region
   */
  static async getActivePoliciesForLeaveType(
    leaveType: LeaveType,
    region: Region,
    location?: string
  ): Promise<LeavePolicy[]> {
    try {
      const where: Prisma.LeavePolicyWhereInput = {
        leaveType,
        region,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      };

      if (location) {
        where.location = location;
      }

      const policies = await prisma.leavePolicy.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
      });

      return policies;
    } catch (error) {
      logger.error('Error fetching active policies for leave type:', error);
      throw new Error('Failed to fetch active policies');
    }
  }

  /**
   * Get policy statistics
   */
  static async getPolicyStatistics(): Promise<{
    total: number;
    active: number;
    byLeaveType: Record<string, number>;
    byRegion: Record<string, number>;
  }> {
    try {
      const [total, active, byLeaveType, byRegion] = await Promise.all([
        prisma.leavePolicy.count(),
        prisma.leavePolicy.count({ where: { isActive: true } }),
        prisma.leavePolicy.groupBy({
          by: ['leaveType'],
          _count: { id: true },
        }),
        prisma.leavePolicy.groupBy({
          by: ['region'],
          _count: { id: true },
        }),
      ]);

      const leaveTypeStats = byLeaveType.reduce((acc, item) => {
        acc[item.leaveType] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      const regionStats = byRegion.reduce((acc, item) => {
        acc[item.region] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        active,
        byLeaveType: leaveTypeStats,
        byRegion: regionStats,
      };
    } catch (error) {
      logger.error('Error fetching policy statistics:', error);
      throw new Error('Failed to fetch policy statistics');
    }
  }
}

export default LeavePolicyService;