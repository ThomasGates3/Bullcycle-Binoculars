"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.context = {};
    }
    setContext(ctx) {
        this.context = ctx;
    }
    format(level, message, data) {
        const timestamp = new Date().toISOString();
        const log = { timestamp, level, message, ...this.context, ...(data || {}) };
        return JSON.stringify(log);
    }
    info(message, data) {
        console.log(this.format('INFO', message, data));
    }
    warn(message, data) {
        console.warn(this.format('WARN', message, data));
    }
    error(message, error, data) {
        const errorData = error instanceof Error ? { errorMessage: error.message, stack: error.stack } : error;
        console.error(this.format('ERROR', message, { ...errorData, ...data }));
    }
    debug(message, data) {
        if (process.env.DEBUG) {
            console.log(this.format('DEBUG', message, data));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map