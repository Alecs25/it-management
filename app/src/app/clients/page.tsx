<<<<<<< HEAD
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  redirect("/map");
=======
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
>>>>>>> eee3f55028114f1a61b6e8511c9f4588418af0d4
}
