import { requirePagePermission } from "@/lib/auth/page-guard";
import { ClientsManager } from "@/components/features/ClientsManager";

export default async function ClientsPage() {
  await requirePagePermission("client:read");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Clienti</h1>
      <ClientsManager />
    </div>
  );
}
