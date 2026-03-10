import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { mfaService } from "@/lib/services/mfa-service";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";
import { setAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/verify")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const partial = authService.verifyToken(token);
  if (!partial) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid code" }, { status: 400 });
  }

  const mfaConfig = await prisma.userMFA.findFirst({
    where: { userId: partial.userId, isActive: true },
    orderBy: { id: "desc" },
  });

  if (!mfaConfig) {
    return NextResponse.json({ message: "MFA not enrolled" }, { status: 400 });
  }

  const secret = mfaService.decryptMFASecret(
    mfaConfig.secretCiphertext,
    mfaConfig.secretIv,
    mfaConfig.secretAuthTag
  );

  const isValid = mfaService.verifyTOTP(secret, parsed.data.code);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid MFA code" }, { status: 401 });
  }

  const fullToken = authService.generateToken({
    userId: partial.userId,
    email: partial.email,
    role: partial.role,
    mfa: true,
  });

  const response = NextResponse.json({ message: "MFA verified" });
  setAuthCookie(response, fullToken);

  return response;
}
