import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { mfaService } from "@/lib/services/mfa-service";
import { verifyTokenFromRequest } from "@/lib/auth/session";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  secret: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/enroll-confirm")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const session = verifyTokenFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const isValid = mfaService.verifyTOTP(parsed.data.secret, parsed.data.code);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid MFA code" }, { status: 401 });
  }

  const encrypted = mfaService.encryptMFASecret(parsed.data.secret);
  const backupCodes = mfaService.generateBackupCodes(10);
  const backupCodeHashes = await Promise.all(
    backupCodes.map((code) => mfaService.hashBackupCode(code))
  );

  await prisma.userMFA.create({
    data: {
      userId: session.userId,
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretAuthTag: encrypted.authTag,
      backupCodeHashes: JSON.stringify(backupCodeHashes),
      keyVersion: 1,
      isActive: true,
    },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { mfaEnabled: true },
  });

  return NextResponse.json({
    message: "MFA enrolled successfully",
    backupCodes,
  });
}
