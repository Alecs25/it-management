import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { ClientsManager } from "@/components/features/ClientsManager";

export default async function ClientsPage() {
  await requirePagePermission("client:read");

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clienti</h1>
          <Link className="btn btn-outline btn-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>

        <ClientsManager />
      </div>
    </main>
  );
}
