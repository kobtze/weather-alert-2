const cron = require('node-cron');
const alertEvaluator = require('./alertEvaluator');

class Scheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.cronExpression = process.env.CRON_EXPRESSION || '*/5 * * * *'; // every 5 minutes
  }

  /**
   * Start the alert evaluation scheduler
   */
  startScheduler() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }

    console.log('⏰ Starting alert evaluation scheduler...');

    // Schedule alert evaluation every 5 minutes
    this.cronJob = cron.schedule(this.cronExpression, async () => {
      await this.runAlertEvaluation();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start the cron job
    this.cronJob.start();
    this.isRunning = true;

    console.log(`✅ Alert evaluation scheduler started (runs every ${this.cronExpression})`);
    
    // Run initial evaluation after 10 seconds
    setTimeout(async () => {
      console.log('🚀 Running initial alert evaluation...');
      await this.runAlertEvaluation();
    }, 10000);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('⏹️  Alert evaluation scheduler stopped');
    }
  }

  /**
   * Run alert evaluation manually
   */
  async runAlertEvaluation() {
    try {
      console.log('🔄 Running scheduled alert evaluation...');
      const startTime = Date.now();
      
      const results = await alertEvaluator.evaluateAllAlerts();
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  Alert evaluation completed in ${duration}ms`);
      
      if (results) {
        const triggeredCount = results.filter(r => r.success && r.isTriggered).length;
        console.log(`📊 Evaluation summary: ${triggeredCount} alert(s) triggered`);
      }
      
    } catch (error) {
      console.error('❌ Scheduled alert evaluation failed:', error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDate().toISOString() : null,
      lastRun: this.lastRunTime || null
    };
  }
}

module.exports = new Scheduler();
