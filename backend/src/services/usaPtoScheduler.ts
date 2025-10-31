import cron from 'node-cron';
import { usaPtoAutomationService } from './usaPtoAutomationService';
import { logger } from '../utils/logger';

/**
 * USA PTO Automation Scheduler
 *
 * Schedules:
 * - Annual PTO accrual: January 1st at 12:00 AM
 * - Year-end carry-forward: December 31st at 11:59 PM
 * - Q1 expiry check: April 1st at 12:00 AM
 */
class UsaPtoScheduler {
  private annualAccrualJob: cron.ScheduledTask | null = null;
  private carryForwardJob: cron.ScheduledTask | null = null;
  private expiryCheckJob: cron.ScheduledTask | null = null;

  constructor() {
    this.setupScheduledJobs();
  }

  private setupScheduledJobs() {
    // Annual PTO Accrual - January 1st at 12:00 AM (0 0 1 1 *)
    this.annualAccrualJob = cron.schedule('0 0 1 1 *', async () => {
      logger.info('🗓️  USA PTO Annual Accrual Job triggered');
      await this.runAnnualAccrual();
    });

    // Year-end Carry-Forward - December 31st at 11:59 PM (59 23 31 12 *)
    this.carryForwardJob = cron.schedule('59 23 31 12 *', async () => {
      logger.info('🗓️  USA PTO Year-End Carry-Forward Job triggered');
      await this.runCarryForward();
    });

    // Q1 Carry-Forward Expiry - April 1st at 12:00 AM (0 0 1 4 *)
    this.expiryCheckJob = cron.schedule('0 0 1 4 *', async () => {
      logger.info('🗓️  USA PTO Q1 Expiry Check Job triggered');
      await this.runExpiryCheck();
    });

    logger.info('✅ USA PTO Scheduler initialized successfully');
    logger.info('📅 Scheduled jobs:');
    logger.info('   - Annual Accrual: January 1st at 12:00 AM');
    logger.info('   - Year-End Carry-Forward: December 31st at 11:59 PM');
    logger.info('   - Q1 Expiry Check: April 1st at 12:00 AM');
  }

  private async runAnnualAccrual() {
    try {
      const currentYear = new Date().getFullYear();
      logger.info(`🇺🇸 Running annual PTO accrual for year ${currentYear}`);

      const result = await usaPtoAutomationService.processAnnualPtoAccrual(currentYear);

      logger.info(`✅ Annual PTO accrual completed:`);
      logger.info(`   - Processed: ${result.processedCount} employees`);
      logger.info(`   - Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        logger.warn(`⚠️  Errors during accrual:`, result.errors);
      }

    } catch (error) {
      logger.error('❌ Failed to run annual PTO accrual:', error);
    }
  }

  private async runCarryForward() {
    try {
      const currentYear = new Date().getFullYear();
      logger.info(`🇺🇸 Running year-end carry-forward for year ${currentYear} → ${currentYear + 1}`);

      const result = await usaPtoAutomationService.processYearEndCarryForward(currentYear);

      logger.info(`✅ Year-end carry-forward completed:`);
      logger.info(`   - Processed: ${result.processedCount} employees`);
      logger.info(`   - Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        logger.warn(`⚠️  Errors during carry-forward:`, result.errors);
      }

    } catch (error) {
      logger.error('❌ Failed to run year-end carry-forward:', error);
    }
  }

  private async runExpiryCheck() {
    try {
      const currentYear = new Date().getFullYear();
      logger.info(`🇺🇸 Running Q1 carry-forward expiry check for year ${currentYear}`);

      const result = await usaPtoAutomationService.expireCarryForwardBalances(currentYear);

      logger.info(`✅ Expiry check completed:`);
      logger.info(`   - Expired: ${result.expiredCount} carry-forwards`);
      logger.info(`   - Total Days Expired: ${result.totalExpiredDays}`);

    } catch (error) {
      logger.error('❌ Failed to run expiry check:', error);
    }
  }

  /**
   * Stop all scheduled jobs (for testing/shutdown)
   */
  public stopAll() {
    if (this.annualAccrualJob) this.annualAccrualJob.stop();
    if (this.carryForwardJob) this.carryForwardJob.stop();
    if (this.expiryCheckJob) this.expiryCheckJob.stop();

    logger.info('🛑 USA PTO Scheduler stopped');
  }

  /**
   * Manual trigger for testing
   */
  public async triggerAnnualAccrual(year: number) {
    logger.info(`🔧 Manual trigger: Annual PTO accrual for year ${year}`);
    return await usaPtoAutomationService.processAnnualPtoAccrual(year);
  }

  public async triggerCarryForward(year: number) {
    logger.info(`🔧 Manual trigger: Year-end carry-forward for year ${year}`);
    return await usaPtoAutomationService.processYearEndCarryForward(year);
  }

  public async triggerExpiryCheck(year: number) {
    logger.info(`🔧 Manual trigger: Q1 expiry check for year ${year}`);
    return await usaPtoAutomationService.expireCarryForwardBalances(year);
  }
}

export const usaPtoScheduler = new UsaPtoScheduler();
