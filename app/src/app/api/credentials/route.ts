import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { cryptoService } from "@/lib/services/crypto-service";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const createSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/credentials")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "credential:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;

  const credentials = await prisma.credential.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      lastEditor: { select: { id: true, email: true } },
    },
    orderBy: { title: "asc" },
  });

  type CredentialWithRelations = (typeof credentials)[number];

  const safeCredentials = credentials.map((credentialItem: CredentialWithRelations) => ({
    id: credentialItem.id,
    clientId: credentialItem.clientId,
    siteId: credentialItem.siteId,
    title: credentialItem.title,
    username: credentialItem.username,
    notes: credentialItem.notes,
    keyVersion: credentialItem.keyVersion,
    client: credentialItem.client,
    site: credentialItem.site,
    lastEditor: credentialItem.lastEditor,
  }));

  return NextResponse.json({ credentials: safeCredentials });
}

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/credentials")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "credential:create");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const encrypted = cryptoService.encrypt(parsed.data.password);

  const created = await prisma.credential.create({
    data: {
      clientId: parsed.data.clientId,
      title: parsed.data.title,
      username: parsed.data.username,
      passwordCiphertext: encrypted.ciphertext,
      passwordIv: encrypted.iv,
      passwordAuthTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      notes: parsed.data.notes,
      lastEditorId: auth.session.userId,
    },
  });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CREDENTIAL_CREATE",
    resource: "credential",
    resourceId: created.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    newValue: JSON.stringify({ title: created.title, username: created.username }),
  });

  return NextResponse.json({ credential: { id: created.id } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/credentials")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "credential:update");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id, password, ...rest } = parsed.data;
  const existing = await prisma.credential.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Credential not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    ...rest,
    lastEditorId: auth.session.userId,
  };

  if ("siteId" in parsed.data) updateData.siteId = parsed.data.siteId ?? null;

  if (password) {
    const encrypted = cryptoService.encrypt(password);
    updateData.passwordCiphertext = encrypted.ciphertext;
    updateData.passwordIv = encrypted.iv;
    updateData.passwordAuthTag = encrypted.authTag;
    updateData.keyVersion = encrypted.keyVersion;
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: updateData,
  });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CREDENTIAL_UPDATE",
    resource: "credential",
    resourceId: updated.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ title: existing.title, username: existing.username }),
    newValue: JSON.stringify({ title: updated.title, username: updated.username }),
  });

  return NextResponse.json({ credential: { id: updated.id } });
}

export async function DELETE(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/credentials")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "credential:delete");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.credential.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Credential not found" }, { status: 404 });
  }

  await prisma.credential.delete({ where: { id } });

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CREDENTIAL_DELETE",
    resource: "credential",
    resourceId: id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
    oldValue: JSON.stringify({ title: existing.title, username: existing.username }),
  });

  return NextResponse.json({ success: true });
}
