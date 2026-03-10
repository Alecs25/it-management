import { prisma } from "@/lib/database/prisma";
import { cryptoService } from "@/lib/services/crypto-service";

interface AuditWriteInput {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  status: "success" | "failure";
  ipAddress: string;
  correlationId: string;
  userAgent?: string;
  oldValue?: string;
  newValue?: string;
  errorMessage?: string;
}

export async function writeAuditLog(input: AuditWriteInput) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date();
  const payload = [
    id,
    timestamp.toISOString(),
    input.userId,
    input.action,
    input.resource,
    input.resourceId,
    input.status,
    input.correlationId,
  ].join("|");

  const hmacSignature = cryptoService.generateHmacSignature(payload);

  return prisma.auditLog.create({
    data: {
      id,
      timestamp,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      status: input.status,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
      userAgent: input.userAgent,
      oldValue: input.oldValue,
      newValue: input.newValue,
      errorMessage: input.errorMessage,
      hmacSignature,
    },
  });
}
