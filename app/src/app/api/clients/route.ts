import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["onboarding", "operativo", "review", "rischio"]).default("onboarding"),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["onboarding", "operativo", "review", "rischio"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { sites: true, credentials: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:create");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.client.create({ data: parsed.data });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CLIENT_CREATE",
    resource: "client",
    resourceId: created.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    newValue: JSON.stringify({ name: created.name, status: created.status }),
  });

  return NextResponse.json({ client: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:update");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updateData } = parsed.data;
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Client not found" }, { status: 404 });
  }

  const updated = await prisma.client.update({ where: { id }, data: updateData });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CLIENT_UPDATE",
    resource: "client",
    resourceId: updated.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, status: existing.status }),
    newValue: JSON.stringify({ name: updated.name, status: updated.status }),
  });

  return NextResponse.json({ client: updated });
}

export async function DELETE(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/clients")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:delete");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Client not found" }, { status: 404 });
  }

  await prisma.client.delete({ where: { id } });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CLIENT_DELETE",
    resource: "client",
    resourceId: id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ name: existing.name, status: existing.status }),
  });

  return NextResponse.json({ success: true });
}
