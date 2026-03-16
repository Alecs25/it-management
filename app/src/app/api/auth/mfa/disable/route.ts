import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";
import { setAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/disable")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = authService.verifyToken(token);
  if (!session) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { mfaEnabled: false },
    }),
    prisma.userMFA.updateMany({
      where: { userId: session.userId, isActive: true },
      data: { isActive: false },
    }),
  ]);

  const downgradedToken = authService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "manager" | "technician" | "readonly",
    mfa: false,
  });

  const response = NextResponse.json({ message: "MFA disabled" });
  setAuthCookie(response, downgradedToken);
  return response;
}
