import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { rbacService, Role } from "@/lib/services/rbac-service";

export async function requirePagePermission(action: string) {
  const session = await getSession();
  if (!session?.mfa) {
    redirect("/auth/login");
  }

  const role = session.role as Role;
  if (!rbacService.hasPermission(role, action)) {
    redirect("/dashboard");
  }

  return session;
}
