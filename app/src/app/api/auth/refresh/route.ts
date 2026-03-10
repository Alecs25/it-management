import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { getRefreshTokenFromRequest, setAuthCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    return NextResponse.json({ message: "Missing refresh token" }, { status: 401 });
  }

  const payload = authService.verifyToken(refreshToken) as { userId?: string } | null;
  if (!payload?.userId) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    return NextResponse.json({ message: "User not found" }, { status: 401 });
  }

  const newToken = authService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "manager" | "technician" | "readonly",
    mfa: user.mfaEnabled,
  });

  const response = NextResponse.json({ message: "Token refreshed" });
  setAuthCookie(response, newToken);
  return response;
}
