import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const createSchema = z.object({
  clientId: z.string().uuid(),
  siteId: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  type: z.string().min(1),
  brand: z.string().optional(),
  serial: z.string().optional(),
  ipLocal: z.string().optional(),
  ipPublic: z.string().optional(),
  port: z.number().int().optional(),
  dns: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  brand: z.string().optional(),
  serial: z.string().optional(),
  ipLocal: z.string().optional(),
  ipPublic: z.string().optional(),
  port: z.number().int().optional(),
  dns: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/devices")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "device:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const siteId = req.nextUrl.searchParams.get("siteId") ?? undefined;
  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;

  const devices = await prisma.device.findMany({
    where: clientId ? { clientId } : siteId ? { siteId } : undefined,
    include: {
      client: { select: { id: true, name: true } },
      site: { select: { id: true, name: true, clientId: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ devices });
}

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/devices")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "device:create");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.device.create({
    data: {
      clientId: parsed.data.clientId,
      siteId: parsed.data.siteId ?? null,
      name: parsed.data.name,
      type: parsed.data.type,
      brand: parsed.data.brand,
      serial: parsed.data.serial,
      ipLocal: parsed.data.ipLocal,
      ipPublic: parsed.data.ipPublic,
      port: parsed.data.port,
      dns: parsed.data.dns,
      notes: parsed.data.notes,
      positionX: 0,
      positionY: 0,
      rotation: 0,
    },
  });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "DEVICE_CREATE",
    resource: "device",
    resourceId: created.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    newValue: JSON.stringify({ name: created.name, type: created.type }),
  });

  return NextResponse.json({ device: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/devices")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "device:update");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updateData } = parsed.data;
  const safeUpdateData: Record<string, unknown> = { ...updateData };
  if ("siteId" in parsed.data) safeUpdateData.siteId = parsed.data.siteId ?? null;

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Device not found" }, { status: 404 });
  }

  const updated = await prisma.device.update({ where: { id }, data: safeUpdateData });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "DEVICE_UPDATE",
    resource: "device",
    resourceId: updated.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, type: existing.type }),
    newValue: JSON.stringify({ name: updated.name, type: updated.type }),
  });

  return NextResponse.json({ device: updated });
}

export async function DELETE(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/devices")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "device:delete");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Device not found" }, { status: 404 });
  }

  await prisma.device.delete({ where: { id } });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "DEVICE_DELETE",
    resource: "device",
    resourceId: id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, type: existing.type }),
  });

  return NextResponse.json({ success: true });
}
