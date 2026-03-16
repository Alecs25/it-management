import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { rbacService, Role } from "@/lib/services/rbac-service";
import { UnifiedManagementView } from "@/components/features/UnifiedManagementView";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const session = await requirePagePermission("client:read");
  const role = session.role as Role;
  const canReadMap = rbacService.hasAllPermissions(role, ["site:read", "device:read", "credential:read"]);

  if (!canReadMap) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mappa clienti unificata</h1>
        </div>

        <UnifiedManagementView />
      </div>
    </main>
  );
}
