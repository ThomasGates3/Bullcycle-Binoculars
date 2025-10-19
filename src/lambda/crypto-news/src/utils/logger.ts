export interface LogContext {
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};

  setContext(ctx: LogContext) {
    this.context = ctx;
  }

  private format(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const log = { timestamp, level, message, ...this.context, ...(data || {}) };
    return JSON.stringify(log);
  }

  info(message: string, data?: any) {
    console.log(this.format('INFO', message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.format('WARN', message, data));
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorData = error instanceof Error ? { errorMessage: error.message, stack: error.stack } : error;
    console.error(this.format('ERROR', message, { ...errorData, ...data }));
  }

  debug(message: string, data?: any) {
    if (process.env.DEBUG) {
      console.log(this.format('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();
