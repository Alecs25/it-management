import { prisma } from "@/lib/database/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { DevicesManager } from "@/components/features/DevicesManager";

export default async function DevicesPage() {
  await requirePagePermission("device:read");

  const [clients, sites] = await Promise.all([
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.site.findMany({
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Device</h1>
      <DevicesManager clients={clients} sites={sites} />
    </div>
  );
}
