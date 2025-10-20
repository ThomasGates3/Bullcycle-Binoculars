"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exponentialBackoff = exponentialBackoff;
async function exponentialBackoff(fn, maxRetries = 5, initialDelayMs = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const is429 = error instanceof Error && error.message.includes('429');
            const shouldRetry = is429 || (attempt < maxRetries - 1 && isRetryableError(error));
            if (!shouldRetry) {
                throw error;
            }
            const delayMs = initialDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    throw lastError || new Error('Max retries exceeded');
}
function isRetryableError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('econnrefused') || message.includes('timeout') || message.includes('429');
    }
    return false;
}
//# sourceMappingURL=backoff.js.map