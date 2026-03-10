import { cryptoService } from "./crypto-service";
import { appConfig } from "@/lib/config/config";

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent?: string;
  correlationId: string;
  status: "success" | "failure";
  errorMessage?: string;
  hmacSignature: string;
}

type AuditLogInput = Omit<AuditLogEntry, "id" | "timestamp" | "hmacSignature">;

class AuditService {
  private logs: AuditLogEntry[] = [];

  private buildPayload(entry: Omit<AuditLogEntry, "hmacSignature">): string {
    return [
      entry.id,
      entry.timestamp.toISOString(),
      entry.userId,
      entry.action,
      entry.resource,
      entry.resourceId,
      entry.status,
      entry.correlationId,
    ].join("|");
  }

  createAuditLog(input: AuditLogInput): AuditLogEntry {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date();

    const partial: Omit<AuditLogEntry, "hmacSignature"> = { id, timestamp, ...input };
    const hmacSignature = appConfig.audit.enableHmacSigning
      ? cryptoService.generateHmacSignature(this.buildPayload(partial))
      : "";

    const entry: AuditLogEntry = { ...partial, hmacSignature };

    if (appConfig.audit.enableAppendOnly) {
      this.logs.push(entry);
    }

    return entry;
  }

  logAuthAttempt(
    userId: string,
    email: string,
    status: "success" | "failure",
    ipAddress: string,
    correlationId: string,
    errorMessage?: string
  ): AuditLogEntry {
    return this.createAuditLog({
      userId,
      action: "AUTH_ATTEMPT",
      resource: "user",
      resourceId: userId,
      newValue: email,
      ipAddress,
      correlationId,
      status,
      errorMessage,
    });
  }

  logMFAEnroll(
    userId: string,
    status: "success" | "failure",
    ipAddress: string,
    correlationId: string
  ): AuditLogEntry {
    return this.createAuditLog({
      userId,
      action: "MFA_ENROLL",
      resource: "mfa",
      resourceId: userId,
      ipAddress,
      correlationId,
      status,
    });
  }

  logMFAVerify(
    userId: string,
    status: "success" | "failure",
    ipAddress: string,
    correlationId: string
  ): AuditLogEntry {
    return this.createAuditLog({
      userId,
      action: "MFA_VERIFY",
      resource: "mfa",
      resourceId: userId,
      ipAddress,
      correlationId,
      status,
    });
  }

  logCredentialReveal(
    userId: string,
    credentialId: string,
    status: "success" | "failure",
    ipAddress: string,
    correlationId: string
  ): AuditLogEntry {
    return this.createAuditLog({
      userId,
      action: "CREDENTIAL_REVEAL",
      resource: "credential",
      resourceId: credentialId,
      ipAddress,
      correlationId,
      status,
    });
  }

  logResourceChange(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValue: string | undefined,
    newValue: string | undefined,
    status: "success" | "failure",
    ipAddress: string,
    correlationId: string
  ): AuditLogEntry {
    return this.createAuditLog({
      userId,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      ipAddress,
      correlationId,
      status,
    });
  }

  verifyAuditIntegrity(entry: AuditLogEntry): boolean {
    const payload = this.buildPayload(entry);
    return cryptoService.verifyHmacSignature(payload, entry.hmacSignature);
  }

  getAllLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter((l) => l.userId === userId);
  }

  getLogsByResource(resource: string, resourceId?: string): AuditLogEntry[] {
    return this.logs.filter(
      (l) => l.resource === resource && (!resourceId || l.resourceId === resourceId)
    );
  }
}

export const auditService = new AuditService();
