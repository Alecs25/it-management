interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxAttempts: number;

  constructor(windowMs = 900_000, maxAttempts = 100) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;

    // Clean up stale entries every 60s
    setInterval(() => this.cleanup(), 60_000);
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.maxAttempts) return false;

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now - entry.windowStart > this.windowMs) {
        this.store.delete(key);
      }
    });
  }
}

// Singleton instances
export const globalRateLimiter = new RateLimiter(900_000, 100);
export const authRateLimiter = new RateLimiter(900_000, 5);
export const mfaRateLimiter = new RateLimiter(900_000, 10);

export function checkRateLimit(
  limiter: RateLimiter,
  ip: string,
  path: string
): boolean {
  return limiter.isAllowed(`${ip}:${path}`);
}
