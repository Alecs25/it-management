import { NextRequest } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth/session";
import { rbacService, Role } from "@/lib/services/rbac-service";

export function getRequestMeta(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  return { ipAddress, correlationId, userAgent };
}

export function requireSessionAndPermission(req: NextRequest, action: string) {
  const session = verifyTokenFromRequest(req);
  if (!session) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const role = session.role as Role;
  if (!rbacService.hasPermission(role, action)) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, session, role };
}
