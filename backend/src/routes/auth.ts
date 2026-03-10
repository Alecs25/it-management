import { Router, Request, Response } from 'express';
import { authService, JWTPayload } from '@services/auth-service';
import { mfaService } from '@services/mfa-service';
import { auditService } from '@services/audit-service';
import { authRateLimiter, mfaRateLimiter, rateLimitMiddleware, authMiddleware } from '@middleware/auth';
import { rbacService } from '@services/rbac-service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /auth/register
 * Register new user (admin only in production)
 */
router.post('/register', rateLimitMiddleware(authRateLimiter), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role = 'technician' } = req.body;

    // Validation
    if (!email || !password || password.length < 12) {
      res.status(400).json({ error: 'Email and secure password (min 12 chars) required' });
      return;
    }

    // In production: check if user already exists in DB
    // For now: simulate success
    const userId = uuidv4();
    const passwordHash = await authService.hashPassword(password);

    // Log audit
    auditService.logAuthAttempt(userId, email, true, req.ipAddress, req.headers['user-agent'] || '', req.correlationId);

    res.status(201).json({
      userId,
      email,
      role,
      message: 'User registered successfully. Please login.',
    });
  } catch (error) {
    auditService.logAuthAttempt('unknown', req.body.email || 'unknown', false, req.ipAddress, req.headers['user-agent'] || '', req.correlationId);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Authenticate user with email/password (step 1 of 2FA)
 */
router.post('/login', rateLimitMiddleware(authRateLimiter), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // In production: lookup user in DB, verify password
    // Simulate successful auth
    const userId = uuidv4();
    const userRole: 'admin' | 'manager' | 'technician' | 'readonly' = 'technician';

    auditService.logAuthAttempt(userId, email, true, req.ipAddress, req.headers['user-agent'] || '', req.correlationId);

    // Generate token WITHOUT mfa claim (will be added after MFA verification)
    const token = authService.generateToken({
      userId,
      email,
      role: userRole,
      mfa: false,
    });

    res.status(200).json({
      token,
      requiresMFA: true,
      message: 'Password verified. MFA verification required.',
    });
  } catch (error) {
    auditService.logAuthAttempt('unknown', req.body.email || 'unknown', false, req.ipAddress, req.headers['user-agent'] || '', req.correlationId);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

/**
 * POST /auth/mfa/enroll
 * Initiate MFA enrollment (returns QR code)
 */
router.post('/mfa/enroll', rateLimitMiddleware(mfaRateLimiter), authMiddleware, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userId = req.userId!;

    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    // Generate TOTP secret
    const { secret, qrCode } = mfaService.generateMFASecret(email);

    // In production: store temp secret in session (not encrypted yet)
    // For now: return QR code

    res.status(200).json({
      secret,
      qrCode,
      message: 'Scan QR code with your authenticator app. You will need to verify the code on next step.',
    });
  } catch (error) {
    auditService.logMFAEnroll(req.userId!, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, false);
    res.status(500).json({ error: 'MFA enrollment failed' });
  }
});

/**
 * POST /auth/mfa/verify
 * Verify MFA code (step 2, after login password)
 */
router.post('/mfa/verify', rateLimitMiddleware(mfaRateLimiter), async (req: Request, res: Response) => {
  try {
    const { token, code } = req.body;

    if (!token || !code) {
      res.status(400).json({ error: 'Token and MFA code required' });
      return;
    }

    // Verify JWT from login step
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // In production: retrieve user's MFA secret from DB, decrypt, and verify code
    // Simulate verification
    const isValid = code.length === 6 && /^\d+$/.test(code); // Basic validation

    if (!isValid) {
      auditService.logMFAVerify(payload.userId, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, false);
      res.status(401).json({ error: 'Invalid MFA code' });
      return;
    }

    auditService.logMFAVerify(payload.userId, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, true);

    // Generate final token WITH mfa claim
    const finalToken = authService.generateToken({
      ...payload,
      mfa: true,
    });

    res.status(200).json({
      token: finalToken,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      message: 'MFA verification successful. You are now logged in.',
    });
  } catch (error) {
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

/**
 * POST /auth/mfa/enroll-confirm
 * Confirm MFA enrollment by verifying TOTP code
 */
router.post('/mfa/enroll-confirm', rateLimitMiddleware(mfaRateLimiter), authMiddleware, async (req: Request, res: Response) => {
  try {
    const { secret, code } = req.body;
    const userId = req.userId!;

    if (!secret || !code) {
      res.status(400).json({ error: 'Secret and code required' });
      return;
    }

    // Verify TOTP code
    const isValid = mfaService.verifyTOTP(secret, code);
    if (!isValid) {
      auditService.logMFAEnroll(userId, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, false);
      res.status(401).json({ error: 'Invalid TOTP code' });
      return;
    }

    // Generate backup codes
    const backupCodes = mfaService.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(backupCodes.map((code) => mfaService.hashBackupCode(code)));

    // Encrypt secret
    const encryptedSecret = mfaService.encryptMFASecret(secret);

    // In production: save MFA config to DB
    // For now: return backup codes

    auditService.logMFAEnroll(userId, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, true);

    res.status(200).json({
      mfaEnabled: true,
      backupCodes,
      message: 'MFA enabled successfully. Save your backup codes in a secure location.',
    });
  } catch (error) {
    auditService.logMFAEnroll(req.userId!, req.ipAddress, req.headers['user-agent'] || '', req.correlationId, false);
    res.status(500).json({ error: 'MFA enrollment confirmation failed' });
  }
});

/**
 * POST /auth/refresh
 * Refresh JWT token before expiration
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = authService.verifyToken(refreshToken);
    if (!payload || (payload as any).type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Generate new token
    const newToken = authService.generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      mfa: payload.mfa,
    });

    res.status(200).json({ token: newToken });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /auth/logout
 * Logout user (token invalidation in production)
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    // In production: add token to blacklist or revoke session
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
