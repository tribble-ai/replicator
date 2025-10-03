/**
 * Simple cron-like scheduler for connector sync operations
 */

export interface SchedulerOptions {
  /** Cron expression (e.g., '0 * * * *' for hourly) */
  schedule: string;

  /** Callback function to execute on schedule */
  onTrigger: () => Promise<void>;

  /** Error handler */
  onError?: (error: Error) => void;

  /** Timezone for schedule (default: UTC) */
  timezone?: string;
}

/**
 * Simple cron-based scheduler
 *
 * Note: For production use, consider using a library like 'node-cron' or 'cron'.
 * This is a basic implementation for demonstration.
 */
export class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private running: boolean = false;

  constructor(private readonly options: SchedulerOptions) {}

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.scheduleNext();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Trigger execution immediately (outside of schedule)
   */
  async trigger(): Promise<void> {
    try {
      await this.options.onTrigger();
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    }
  }

  // ==================== Private Methods ====================

  private scheduleNext(): void {
    if (!this.running) {
      return;
    }

    const nextRun = this.getNextRunTime();
    const delay = nextRun.getTime() - Date.now();

    this.timer = setTimeout(async () => {
      try {
        await this.options.onTrigger();
      } catch (error) {
        if (this.options.onError) {
          this.options.onError(error as Error);
        }
      }

      // Schedule next execution
      this.scheduleNext();
    }, delay);
  }

  private getNextRunTime(): Date {
    // Parse cron expression
    const parts = this.options.schedule.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression. Expected format: "minute hour day month weekday"');
    }

    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();

    // Simple cron parsing - supports specific values and wildcards
    // For production, use a proper cron library

    let nextRun = new Date(now);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    // Parse minute
    if (minute !== '*') {
      const targetMinute = parseInt(minute, 10);
      nextRun.setMinutes(targetMinute);
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 1);
      }
    } else {
      // Every minute
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }

    // Parse hour
    if (hour !== '*') {
      const targetHour = parseInt(hour, 10);
      nextRun.setHours(targetHour);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }

    // Simplified: For day, month, and weekday, we just support '*' (any)
    // Full cron implementation would handle specific days/months

    return nextRun;
  }
}

/**
 * Create a scheduler instance
 */
export function createScheduler(options: SchedulerOptions): Scheduler {
  return new Scheduler(options);
}

/**
 * Parse cron expression to human-readable format
 */
export function describeCronSchedule(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    return 'Invalid cron expression';
  }

  const [minute, hour, day, month, weekday] = parts;

  if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return 'Every minute';
  }

  if (minute === '0' && hour === '*') {
    return 'Every hour';
  }

  if (minute === '0' && hour === '0') {
    return 'Daily at midnight';
  }

  if (minute === '0' && hour !== '*' && day === '*') {
    return `Daily at ${hour}:00`;
  }

  return `At ${minute} ${hour} ${day} ${month} ${weekday}`;
}
