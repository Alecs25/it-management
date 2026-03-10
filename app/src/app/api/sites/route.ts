import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const createSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  floorplanUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  floorplanUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/sites")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "site:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;
  const sites = await prisma.site.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: { select: { id: true, name: true } }, _count: { select: { devices: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ sites });
}

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/sites")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "site:create");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.site.create({ data: parsed.data });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "SITE_CREATE",
    resource: "site",
    resourceId: created.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    newValue: JSON.stringify({ name: created.name, clientId: created.clientId }),
  });

  return NextResponse.json({ site: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/sites")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "site:update");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updateData } = parsed.data;
  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Site not found" }, { status: 404 });
  }

  const updated = await prisma.site.update({ where: { id }, data: updateData });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "SITE_UPDATE",
    resource: "site",
    resourceId: updated.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, city: existing.city }),
    newValue: JSON.stringify({ name: updated.name, city: updated.city }),
  });

  return NextResponse.json({ site: updated });
}

export async function DELETE(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/sites")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "site:delete");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Site not found" }, { status: 404 });
  }

  await prisma.site.delete({ where: { id } });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "SITE_DELETE",
    resource: "site",
    resourceId: id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, city: existing.city }),
  });

  return NextResponse.json({ success: true });
}
