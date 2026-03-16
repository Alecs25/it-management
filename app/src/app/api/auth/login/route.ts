import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { authRateLimiter, checkRateLimit } from "@/lib/middleware/rate-limit";
import { setAuthCookie, setRefreshCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(authRateLimiter, ip, "/api/auth/login")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const validPassword = await authService.verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = authService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as "admin" | "manager" | "technician" | "readonly",
    mfa: false,
  });
  const refreshToken = authService.generateRefreshToken(user.id);

  const response = NextResponse.json({
    message: "Login successful",
    requiresMFA: false,
    mfaEnrolled: user.mfaEnabled,
    userId: user.id,
    email: user.email,
  });

  setAuthCookie(response, token);
  setRefreshCookie(response, refreshToken);

  return response;
}
