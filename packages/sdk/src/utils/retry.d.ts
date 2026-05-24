/**
 * Run a promise-returning function with exponential backoff retries.
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts?: number, initialDelayMs?: number, maxDelayMs?: number): Promise<T>;
