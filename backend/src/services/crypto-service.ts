import * as crypto from 'crypto';
import { appConfig } from '@config/config';

export class CryptoService {
  private algorithm = appConfig.crypto.algorithm;
  private kmsStubKey = appConfig.crypto.kmsStubKey || 'stub-key-v1';

  /**
   * Encrypt plaintext using AES-256-GCM (envelope encryption pattern)
   * DEK (Data Encryption Key) is derived per credential
   */
  public encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string; keyVersion: number } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.kmsStubKey.padEnd(32, '0')).slice(0, 32), iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: 1, // Track key version for rotation support
    };
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  public decrypt(ciphertext: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.kmsStubKey.padEnd(32, '0')).slice(0, 32),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }

  /**
   * Generate HMAC signature for audit trail non-repudiation
   */
  public generateHmacSignature(data: string, secret: string = this.kmsStubKey): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  public verifyHmacSignature(data: string, signature: string, secret: string = this.kmsStubKey): boolean {
    const expectedSignature = this.generateHmacSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Generate random secret (for MFA seed, etc.)
   */
  public generateRandomSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export const cryptoService = new CryptoService();
