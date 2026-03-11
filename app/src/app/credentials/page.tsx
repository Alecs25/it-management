import { prisma } from "@/lib/database/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { CredentialsManager } from "@/components/features/CredentialsManager";

export default async function CredentialsPage() {
  await requirePagePermission("credential:read");

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Credenziali</h1>
      <CredentialsManager clients={clients} />
    </div>
  );
}
