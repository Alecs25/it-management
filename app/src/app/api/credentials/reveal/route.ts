import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { cryptoService } from "@/lib/services/crypto-service";
import { authService } from "@/lib/services/auth-service";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const schema = z.object({
  credentialId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/credentials/reveal")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "credential:reveal");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { pinHash: true },
  });

  if (!user?.pinHash) {
    return NextResponse.json({ message: "PIN not configured" }, { status: 400 });
  }

  const validPin = await authService.verifyPassword(parsed.data.pin, user.pinHash);
  if (!validPin) {
    return NextResponse.json({ message: "Invalid PIN" }, { status: 401 });
  }

  const credential = await prisma.credential.findUnique({ where: { id: parsed.data.credentialId } });
  if (!credential) {
    return NextResponse.json({ message: "Credential not found" }, { status: 404 });
  }

  const password = cryptoService.decrypt(
    credential.passwordCiphertext,
    credential.passwordIv,
    credential.passwordAuthTag
  );

  await writeAuditLog({
    userId: auth.session.userId,
    action: "CREDENTIAL_REVEAL",
    resource: "credential",
    resourceId: credential.id,
    status: "success",
    ipAddress: meta.ipAddress,
    correlationId: meta.correlationId,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ password });
}
