import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/audit")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "audit:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ logs });
}
