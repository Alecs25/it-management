import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { mfaService } from "@/lib/services/mfa-service";
import { setAuthCookie } from "@/lib/auth/session";
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

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = authService.verifyToken(token);
  if (!session || session.mfa) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json({ message: "MFA already enrolled" }, { status: 409 });
  }

  const existingMFA = await prisma.userMFA.findFirst({
    where: { userId: session.userId, isActive: true },
  });

  if (existingMFA) {
    return NextResponse.json({ message: "Duplicate MFA enrollment" }, { status: 409 });
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

  const fullToken = authService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "manager" | "technician" | "readonly",
    mfa: true,
  });

  const response = NextResponse.json({
    message: "MFA enrolled successfully",
    backupCodes,
  });

  setAuthCookie(response, fullToken);

  return response;
}
