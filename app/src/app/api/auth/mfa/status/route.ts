import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/status")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const partial = authService.verifyToken(token);
  if (!partial || partial.mfa) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: partial.userId },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const enrolled = user.mfaEnabled;
  const action = enrolled ? "verify" : "enroll";

  return NextResponse.json({
    enrolled,
    action,
    email: user.email,
  });
}
