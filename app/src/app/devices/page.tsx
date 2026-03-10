import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { DevicesManager } from "@/components/features/DevicesManager";

export default async function DevicesPage() {
  await requirePagePermission("device:read");

  const sites = await prisma.site.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Device</h1>
          <Link className="btn btn-outline btn-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>

        <DevicesManager sites={sites} />
      </div>
    </main>
  );
}
