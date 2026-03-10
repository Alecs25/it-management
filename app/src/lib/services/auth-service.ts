import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { appConfig } from "@/lib/config/config";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "manager" | "technician" | "readonly";
  mfa: boolean;
  iat?: number;
  exp?: number;
}

class AuthService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, appConfig.jwt.secret, {
      expiresIn: appConfig.jwt.expiresIn as never,
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, appConfig.jwt.secret, {
      expiresIn: appConfig.jwt.refreshExpiresIn as never,
    });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, appConfig.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  generateSessionId(): string {
    return uuidv4();
  }
}

export const authService = new AuthService();
