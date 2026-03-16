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
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sedi</h1>
      <SitesManager clients={clients} />
    </div>
  );
}
