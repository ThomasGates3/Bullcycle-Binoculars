export interface LogContext {
    requestId?: string;
    [key: string]: any;
}
declare class Logger {
    private context;
    setContext(ctx: LogContext): void;
    private format;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error | any, data?: any): void;
    debug(message: string, data?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map