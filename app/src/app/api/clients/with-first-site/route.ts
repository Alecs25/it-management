import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";
import { rbacService, Role } from "@/lib/services/rbac-service";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1),
  firstSite: z
    .object({
      name: z.string().trim().min(1),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients/with-first-site")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:create");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.firstSite && !rbacService.hasPermission(auth.role as Role, "site:create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: parsed.data.name,
        status: "onboarding",
      },
    });

    const site = parsed.data.firstSite
      ? await tx.site.create({
          data: {
            clientId: client.id,
            name: parsed.data.firstSite.name,
          },
        })
      : null;

    return { client, site };
  });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CLIENT_CREATE",
    resource: "client",
    resourceId: result.client.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    newValue: JSON.stringify({
      name: result.client.name,
      firstSite: result.site ? { id: result.site.id, name: result.site.name } : null,
    }),
  });

  if (result.site) {
    await writeAuditLog({
      userId: auth.session.userId,
      action: "SITE_CREATE",
      resource: "site",
      resourceId: result.site.id,
      status: "success",
      ipAddress: meta.ipAddress,
      correlationId: meta.correlationId,
      userAgent: meta.userAgent,
      newValue: JSON.stringify({ name: result.site.name, clientId: result.client.id }),
    });
  }

  return NextResponse.json({ client: result.client, site: result.site }, { status: 201 });
}
