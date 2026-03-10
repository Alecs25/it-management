import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { appConfig } from '@config/config';
import { cryptoService } from './crypto-service';

export interface MFASecret {
  secret: string;
  qrCode: string;
}

export class MFAService {
  /**
   * Generate TOTP secret and QR code
   */
  public generateMFASecret(email: string): MFASecret {
    const secret = speakeasy.generateSecret({
      name: `${appConfig.mfa.appName} (${email})`,
      issuer: appConfig.mfa.issuer,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    };
  }

  /**
   * Verify TOTP code
   */
  public verifyTOTP(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: appConfig.mfa.window,
      });
    } catch {
      return false;
    }
  }

  /**
   * Generate backup codes (monouso recovery codes)
   */
  public generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  public async hashBackupCode(code: string): Promise<string> {
    return argon2.hash(code, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verify backup code
   */
  public async verifyBackupCode(code: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, code);
    } catch {
      return false;
    }
  }

  /**
   * Encrypt MFA secret for storage in DB
   */
  public encryptMFASecret(secret: string): { ciphertext: string; iv: string; authTag: string } {
    const encrypted = cryptoService.encrypt(secret);
    return {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    };
  }

  /**
   * Decrypt MFA secret from DB
   */
  public decryptMFASecret(ciphertext: string, iv: string, authTag: string): string {
    return cryptoService.decrypt(ciphertext, iv, authTag);
  }
}

export const mfaService = new MFAService();
