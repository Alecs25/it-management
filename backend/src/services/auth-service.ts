import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { appConfig } from '@config/config';
import { v4 as uuidv4 } from 'uuid';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'readonly';
  mfa: boolean;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly passwordHashOptions = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  };

  /**
   * Hash password using Argon2id
   */
  public async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.passwordHashOptions);
  }

  /**
   * Verify password against hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Generate JWT token with claims
   */
  public generateToken(payload: JWTPayload): string {
    const expiresIn = appConfig.jwt.expiresIn;
    return jwt.sign(payload, appConfig.jwt.secret, { expiresIn });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    const expiresIn = appConfig.jwt.refreshExpiresIn;
    return jwt.sign({ userId, type: 'refresh' }, appConfig.jwt.secret, { expiresIn });
  }

  /**
   * Verify and decode JWT
   */
  public verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, appConfig.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Generate session ID for tracking
   */
  public generateSessionId(): string {
    return uuidv4();
  }
}

export const authService = new AuthService();
