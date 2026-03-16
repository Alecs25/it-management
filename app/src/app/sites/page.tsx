import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { SitesManager } from "@/components/features/SitesManager";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  await requirePagePermission("site:read");

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Siti</h1>
          <Link className="btn btn-outline btn-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>

        <SitesManager clients={clients} />
      </div>
    </main>
  );
}
