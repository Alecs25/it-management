import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, authRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(authRateLimiter, meta.ipAddress, "/api/clients/search")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const parsed = querySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query" }, { status: 400 });
  }

  const q = parsed.data.q;
  const clients = await prisma.client.findMany({
    where: { name: { contains: q } },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
    take: 10,
  });

  const exactMatch = clients.some((client) => client.name.toLowerCase() === q.toLowerCase());

  return NextResponse.json({ clients, exactMatch });
}
