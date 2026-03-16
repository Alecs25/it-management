import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { checkRateLimit, authRateLimiter } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = authService.verifyToken(token);
  if (!session) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, pinHash: true, mfaEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    hasPIN: !!user.pinHash,
    mfaEnabled: user.mfaEnabled,
  });
}

export async function PUT(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(authRateLimiter, ip, "/api/profile")) {
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

  const body = await req.json().catch(() => null);
  const { firstName, lastName } = body ?? {};

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
    },
  });

  return NextResponse.json({ message: "Profile updated successfully" });
}
