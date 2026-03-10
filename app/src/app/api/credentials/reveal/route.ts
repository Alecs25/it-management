import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { cryptoService } from "@/lib/services/crypto-service";
import { mfaService } from "@/lib/services/mfa-service";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { writeAuditLog } from "@/lib/services/audit-db";

export const runtime = "nodejs";

const schema = z.object({
  credentialId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
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

  const mfaConfig = await prisma.userMFA.findFirst({
    where: { userId: auth.session.userId, isActive: true },
    orderBy: { id: "desc" },
  });
  if (!mfaConfig) {
    return NextResponse.json({ message: "MFA not enrolled" }, { status: 400 });
  }

  const secret = mfaService.decryptMFASecret(
    mfaConfig.secretCiphertext,
    mfaConfig.secretIv,
    mfaConfig.secretAuthTag
  );
  const validCode = mfaService.verifyTOTP(secret, parsed.data.code);
  if (!validCode) {
    return NextResponse.json({ message: "Invalid MFA code" }, { status: 401 });
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
