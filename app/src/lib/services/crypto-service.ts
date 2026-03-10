import crypto from "crypto";
import { appConfig } from "@/lib/config/config";

interface EncryptResult {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

const KEY_VERSION = 1;

class CryptoService {
  private getKey(): Buffer {
    const raw = appConfig.crypto.kmsStubKey;
    return Buffer.from(raw.padEnd(32, "0").slice(0, 32), "utf8");
  }

  encrypt(plaintext: string): EncryptResult {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.getKey(), iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      ciphertext,
      iv: iv.toString("hex"),
      authTag,
      keyVersion: KEY_VERSION,
    };
  }

  decrypt(ciphertext: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.getKey(),
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  }

  generateHmacSignature(data: string, secret?: string): string {
    const key = secret ?? appConfig.crypto.kmsStubKey;
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }

  verifyHmacSignature(data: string, signature: string, secret?: string): boolean {
    const expected = this.generateHmacSignature(data, secret);
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(signature);
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  }

  generateRandomSecret(length = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }
}

export const cryptoService = new CryptoService();
