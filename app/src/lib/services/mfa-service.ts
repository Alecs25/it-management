import speakeasy from "speakeasy";
import QRCode from "qrcode";
import * as argon2 from "argon2";
import crypto from "crypto";
import { appConfig } from "@/lib/config/config";
import { cryptoService } from "./crypto-service";

interface MFASecret {
  secret: string;
  qrCode: string;
}

interface EncryptedMFASecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

class MFAService {
  async generateMFASecret(email: string): Promise<MFASecret> {
    const secretObj = speakeasy.generateSecret({
      name: `${appConfig.mfa.appName}:${email}`,
      issuer: appConfig.mfa.issuer,
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secretObj.otpauth_url!);

    return {
      secret: secretObj.base32,
      qrCode,
    };
  }

  verifyTOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: appConfig.mfa.window,
    });
  }

  generateBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );
  }

  async hashBackupCode(code: string): Promise<string> {
    return argon2.hash(code, { type: argon2.argon2id });
  }

  async verifyBackupCode(code: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, code);
  }

  encryptMFASecret(secret: string): EncryptedMFASecret {
    const result = cryptoService.encrypt(secret);
    return {
      ciphertext: result.ciphertext,
      iv: result.iv,
      authTag: result.authTag,
    };
  }

  decryptMFASecret(ciphertext: string, iv: string, authTag: string): string {
    return cryptoService.decrypt(ciphertext, iv, authTag);
  }
}

export const mfaService = new MFAService();
