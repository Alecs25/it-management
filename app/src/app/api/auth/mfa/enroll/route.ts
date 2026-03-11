import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { mfaService } from "@/lib/services/mfa-service";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/enroll")) {
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
    return NextResponse.json({ message: "MFA enrollment in progress" }, { status: 409 });
  }

  const result = await mfaService.generateMFASecret(session.email);

  return NextResponse.json({
    secret: result.secret,
    qrCode: result.qrCode,
  });
}
