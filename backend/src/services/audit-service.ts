import { cryptoService } from './crypto-service';

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
  userAgent: string;
  correlationId: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  hmacSignature: string;
}

export class AuditService {
  private auditLogs: AuditLogEntry[] = [];

  /**
   * Log audit entry with HMAC signature for non-repudiation
   */
  public createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'hmacSignature'>): AuditLogEntry {
    const id = this.generateAuditId();
    
    // Create audit record without signature
    const auditRecord = {
      ...entry,
      id,
    };

    // Generate HMAC signature for non-repudiation
    const dataToSign = JSON.stringify({
      id,
      timestamp: entry.timestamp.toISOString(),
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      status: entry.status,
    });

    const hmacSignature = cryptoService.generateHmacSignature(dataToSign);

    const finalEntry: AuditLogEntry = {
      ...auditRecord,
      hmacSignature,
    };

    // Store in-memory (in production, persist to append-only log in DB)
    this.auditLogs.push(finalEntry);

    return finalEntry;
  }

  /**
   * Log authentication attempt
   */
  public logAuthAttempt(
    userId: string,
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    correlationId: string
  ): AuditLogEntry {
    return this.createAuditLog({
      timestamp: new Date(),
      userId: userId || 'unknown',
      action: 'AUTH_ATTEMPT',
      resource: 'user',
      resourceId: email,
      status: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      correlationId,
      errorMessage: success ? undefined : 'Authentication failed',
    });
  }

  /**
   * Log MFA enrollment
   */
  public logMFAEnroll(
    userId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
    success: boolean
  ): AuditLogEntry {
    return this.createAuditLog({
      timestamp: new Date(),
      userId,
      action: 'MFA_ENROLL',
      resource: 'mfa',
      resourceId: userId,
      status: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      correlationId,
      errorMessage: success ? undefined : 'MFA enrollment failed',
    });
  }

  /**
   * Log MFA verification
   */
  public logMFAVerify(
    userId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
    success: boolean
  ): AuditLogEntry {
    return this.createAuditLog({
      timestamp: new Date(),
      userId,
      action: 'MFA_VERIFY',
      resource: 'mfa',
      resourceId: userId,
      status: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      correlationId,
      errorMessage: success ? undefined : 'MFA verification failed',
    });
  }

  /**
   * Log credential reveal access
   */
  public logCredentialReveal(
    userId: string,
    credentialId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
    success: boolean
  ): AuditLogEntry {
    return this.createAuditLog({
      timestamp: new Date(),
      userId,
      action: 'CREDENTIAL_REVEAL',
      resource: 'credential',
      resourceId: credentialId,
      status: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      correlationId,
      errorMessage: success ? undefined : 'Credential reveal failed (invalid PIN or permissions)',
    });
  }

  /**
   * Log generic resource change (credential update, delete, etc.)
   */
  public logResourceChange(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValue: string | undefined,
    newValue: string | undefined,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
    success: boolean
  ): AuditLogEntry {
    return this.createAuditLog({
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      status: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      correlationId,
    });
  }

  /**
   * Verify audit log integrity (HMAC signature)
   */
  public verifyAuditIntegrity(entry: AuditLogEntry): boolean {
    const { hmacSignature, ...entryWithoutSignature } = entry;
    
    const dataToVerify = JSON.stringify({
      id: entryWithoutSignature.id,
      timestamp: entryWithoutSignature.timestamp,
      userId: entryWithoutSignature.userId,
      action: entryWithoutSignature.action,
      resource: entryWithoutSignature.resource,
      resourceId: entryWithoutSignature.resourceId,
      status: entryWithoutSignature.status,
    });

    try {
      return cryptoService.verifyHmacSignature(dataToVerify, hmacSignature);
    } catch {
      return false;
    }
  }

  /**
   * Get all audit logs (for admin querying)
   */
  public getAllLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Get audit logs filtered by userId
   */
  public getLogsByUser(userId: string): AuditLogEntry[] {
    return this.auditLogs.filter((log) => log.userId === userId);
  }

  /**
   * Get audit logs filtered by resource
   */
  public getLogsByResource(resource: string, resourceId?: string): AuditLogEntry[] {
    return this.auditLogs.filter((log) => 
      log.resource === resource && (!resourceId || log.resourceId === resourceId)
    );
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const auditService = new AuditService();
