import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authService, JWTPayload } from '@services/auth-service';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: JWTPayload;
      correlationId: string;
      ipAddress: string;
    }
  }
}

/**
 * Middleware to extract correlation ID (per request tracing)
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

/**
 * Middleware to extract IP address (accounting for proxies)
 */
export function ipAddressMiddleware(req: Request, res: Response, next: NextFunction): void {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  req.ipAddress = ip;
  next();
}

/**
 * Middleware to verify JWT token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  req.userId = payload.userId;

  // Check if MFA is required but not completed
  if (!payload.mfa) {
    res.status(403).json({ error: 'MFA verification required' });
    return;
  }

  next();
}

/**
 * Rate limiter (simple in-memory implementation)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxAttempts: number;

  constructor(windowMs: number = 900000, maxAttempts: number = 100) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  public isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Filter out old attempts
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }
  }
}

export const globalRateLimiter = new RateLimiter();
export const authRateLimiter = new RateLimiter(900000, 5); // 5 attempts per 15 min
export const mfaRateLimiter = new RateLimiter(900000, 10); // 10 attempts per 15 min

/**
 * Middleware to apply rate limiting
 */
export function rateLimitMiddleware(limiter: RateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ipAddress}:${req.path}`;
    if (!limiter.isAllowed(key)) {
      res.status(429).json({ error: 'Too many requests, please try again later' });
      return;
    }
    next();
  };
}
