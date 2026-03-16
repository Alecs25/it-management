import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients/[id]")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const { id } = params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      sites: {
        orderBy: { name: "asc" },
        include: {
          devices: {
            orderBy: { name: "asc" },
          },
          credentials: {
            select: {
              id: true,
              title: true,
              username: true,
              siteId: true,
              notes: true,
              lastEditor: { select: { email: true } },
            },
            orderBy: { title: "asc" },
          },
        },
      },
      devices: {
        where: { siteId: null },
        orderBy: { name: "asc" },
      },
      credentials: {
        where: { siteId: null },
        select: {
          id: true,
          title: true,
          username: true,
          siteId: true,
          notes: true,
          lastEditor: { select: { email: true } },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ message: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}
