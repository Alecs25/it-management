import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/database/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.mfa) {
    redirect("/auth/login");
  }

  const [clientsCount, credentialsCount, devicesCount] = await Promise.all([
    prisma.client.count(),
    prisma.credential.count(),
    prisma.device.count(),
  ]);

  return (
    <>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-base-content/70">Benvenuto, <strong>{session.email}</strong></p>
        </div>

        <div className="alert border border-base-300">
          <span>
            Ruolo: <strong>{session.role}</strong> — Conforme ai requisiti ISO 27001
          </span>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Clienti">
            <p className="text-sm opacity-70">Totale: {clientsCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/map">
                Apri
              </Link>
            </div>
          </Card>
          <Card title="Credenziali">
            <p className="text-sm opacity-70">Totale: {credentialsCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/map">
                Apri
              </Link>
            </div>
          </Card>
          <Card title="Dispositivi">
            <p className="text-sm opacity-70">Totale: {devicesCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/map">
                Apri
              </Link>
            </div>
          </Card>
        </section>

        <section className="alert alert-info">
          <span>Accedi a Clienti, Credenziali e Dispositivi dalla sidebar. Gli amministratori possono consultare l'audit trail.</span>
        </section>
      </div>
    </>
  );
}
