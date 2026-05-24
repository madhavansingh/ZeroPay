"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = retryWithBackoff;
/**
 * Run a promise-returning function with exponential backoff retries.
 */
async function retryWithBackoff(fn, maxAttempts = 5, initialDelayMs = 1000, maxDelayMs = 15000) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            attempt++;
            if (attempt >= maxAttempts) {
                throw error;
            }
            const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
            console.warn(`[SDK Retry] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}
