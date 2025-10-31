import * as cron from 'node-cron'
import { indiaAccrualService } from './indiaAccrualService'
import { compOffService } from './compOffService'

export class AccrualScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map()

  // Initialize all scheduled jobs
  init(): void {
    console.log('🕐 Initializing Accrual Scheduler...')

    // Schedule monthly accrual on 1st of every month at 6:00 AM
    this.scheduleMonthlyAccrual()

    // Schedule year-end carry-forward processing on December 31st at 11:59 PM
    this.scheduleYearEndCarryForward()

    // Schedule comp off expiration processing daily at 2:00 AM
    this.scheduleCompOffExpiration()

    console.log('✅ Accrual Scheduler initialized successfully')
  }

  // Schedule monthly accrual processing (1st of every month at 6:00 AM)
  private scheduleMonthlyAccrual(): void {
    const cronExpression = '0 6 1 * *' // At 6:00 AM on the 1st day of every month

    const task = cron.schedule(cronExpression, async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      console.log(`🚀 Starting monthly accrual processing for ${month}/${year}`)

      try {
        await indiaAccrualService.scheduleMonthlyAccrual()
        console.log(`✅ Monthly accrual processing completed for ${month}/${year}`)
      } catch (error) {
        console.error(`❌ Monthly accrual processing failed for ${month}/${year}:`, error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata' // IST timezone for India operations
    })

    this.scheduledJobs.set('monthly-accrual', task)
    task.start()

    console.log('📅 Scheduled monthly accrual: 1st of every month at 6:00 AM IST')
  }

  // Schedule year-end carry-forward processing (December 31st at 11:59 PM)
  private scheduleYearEndCarryForward(): void {
    const cronExpression = '59 23 31 12 *' // At 11:59 PM on December 31st

    const task = cron.schedule(cronExpression, async () => {
      const year = new Date().getFullYear()

      console.log(`🚀 Starting year-end carry-forward processing for ${year}`)

      try {
        await indiaAccrualService.applyYearEndCarryForwardRules(year)
        console.log(`✅ Year-end carry-forward processing completed for ${year}`)
      } catch (error) {
        console.error(`❌ Year-end carry-forward processing failed for ${year}:`, error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    })

    this.scheduledJobs.set('year-end-carryforward', task)
    task.start()

    console.log('📅 Scheduled year-end carry-forward: December 31st at 11:59 PM IST')
  }

  // Schedule comp off expiration processing (daily at 2:00 AM)
  private scheduleCompOffExpiration(): void {
    const cronExpression = '0 2 * * *' // At 2:00 AM every day

    const task = cron.schedule(cronExpression, async () => {
      const today = new Date()
      console.log(`🚀 Starting comp off expiration processing for ${today.toDateString()}`)

      try {
        const result = await compOffService.processCompOffExpiration()
        console.log(`✅ Comp off expiration processing completed: ${result.expired} comp offs expired`)
      } catch (error) {
        console.error(`❌ Comp off expiration processing failed:`, error)
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata' // IST timezone for India operations
    })

    this.scheduledJobs.set('comp-off-expiration', task)
    task.start()

    console.log('📅 Scheduled comp off expiration: Daily at 2:00 AM IST')
  }

  // Manual trigger for monthly accrual (for testing or manual processing)
  async triggerMonthlyAccrual(year?: number, month?: number): Promise<any> {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth() + 1

    console.log(`🔧 Manual trigger: Monthly accrual for ${targetMonth}/${targetYear}`)

    try {
      const results = await indiaAccrualService.processMonthlyAccrualBatch(targetYear, targetMonth)
      console.log(`✅ Manual monthly accrual completed: ${results.length} employees processed`)
      return {
        success: true,
        message: `Processed ${results.length} employees for ${targetMonth}/${targetYear}`,
        results
      }
    } catch (error) {
      console.error(`❌ Manual monthly accrual failed:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      }
    }
  }

  // Manual trigger for year-end carry-forward (for testing or manual processing)
  async triggerYearEndCarryForward(year?: number): Promise<any> {
    const targetYear = year || new Date().getFullYear()

    console.log(`🔧 Manual trigger: Year-end carry-forward for ${targetYear}`)

    try {
      await indiaAccrualService.applyYearEndCarryForwardRules(targetYear)
      console.log(`✅ Manual year-end carry-forward completed for ${targetYear}`)
      return {
        success: true,
        message: `Year-end carry-forward completed for ${targetYear}`
      }
    } catch (error) {
      console.error(`❌ Manual year-end carry-forward failed:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      }
    }
  }

  // Manual trigger for comp off expiration (for testing or manual processing)
  async triggerCompOffExpiration(): Promise<any> {
    console.log(`🔧 Manual trigger: Comp off expiration processing`)

    try {
      const result = await compOffService.processCompOffExpiration()
      console.log(`✅ Manual comp off expiration completed: ${result.expired} comp offs expired`)
      return {
        success: true,
        message: `Processed ${result.expired} expired comp offs`,
        result
      }
    } catch (error) {
      console.error(`❌ Manual comp off expiration failed:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      }
    }
  }

  // Get status of all scheduled jobs
  getSchedulerStatus(): any {
    const status = {
      totalJobs: this.scheduledJobs.size,
      jobs: {} as any
    }

    this.scheduledJobs.forEach((task, name) => {
      status.jobs[name] = {
        name,
        running: task.getStatus() === 'scheduled',
        lastRun: 'N/A', // node-cron doesn't provide last run info
        nextRun: 'Based on cron schedule'
      }
    })

    return status
  }

  // Stop a specific scheduled job
  stopJob(jobName: string): boolean {
    const task = this.scheduledJobs.get(jobName)
    if (task) {
      task.stop()
      console.log(`⏹️ Stopped scheduled job: ${jobName}`)
      return true
    }
    return false
  }

  // Start a specific scheduled job
  startJob(jobName: string): boolean {
    const task = this.scheduledJobs.get(jobName)
    if (task) {
      task.start()
      console.log(`▶️ Started scheduled job: ${jobName}`)
      return true
    }
    return false
  }

  // Stop all scheduled jobs
  stopAll(): void {
    this.scheduledJobs.forEach((task, name) => {
      task.stop()
      console.log(`⏹️ Stopped job: ${name}`)
    })
    console.log('🛑 All accrual scheduler jobs stopped')
  }

  // Restart all scheduled jobs
  restartAll(): void {
    this.scheduledJobs.forEach((task, name) => {
      task.stop()
      task.start()
      console.log(`🔄 Restarted job: ${name}`)
    })
    console.log('🔄 All accrual scheduler jobs restarted')
  }

  // For development: Schedule jobs to run immediately for testing
  enableTestMode(): void {
    console.log('🧪 Enabling test mode - jobs will run every minute for testing')

    // Stop existing jobs
    this.stopAll()
    this.scheduledJobs.clear()

    // Schedule test jobs (every minute)
    const monthlyTask = cron.schedule('*/1 * * * *', async () => {
      console.log('🧪 TEST: Running monthly accrual')
      await this.triggerMonthlyAccrual()
    }, { scheduled: false })

    this.scheduledJobs.set('monthly-accrual-test', monthlyTask)
    monthlyTask.start()

    console.log('🧪 Test mode enabled - monthly accrual will run every minute')
  }

  // Disable test mode and return to normal schedule
  disableTestMode(): void {
    console.log('🔧 Disabling test mode and returning to normal schedule')
    this.stopAll()
    this.scheduledJobs.clear()
    this.init() // Re-initialize with normal schedule
  }
}

export const accrualScheduler = new AccrualScheduler()