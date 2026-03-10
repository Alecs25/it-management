import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/database/prisma";
import Link from "next/link";

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
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="navbar bg-base-100 border border-base-300 rounded-box">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">IT Credential Management</h1>
          </div>
          <div className="flex-none">
            <form action="/api/auth/logout" method="post">
              <button className="btn btn-outline btn-sm" type="submit">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="alert border border-base-300">
          <span>
            Utente: <strong>{session.email}</strong> — Ruolo: <strong>{session.role}</strong>
          </span>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Clienti">
            <p className="text-sm opacity-70">Totale: {clientsCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/clients">
                Apri
              </Link>
            </div>
          </Card>
          <Card title="Credenziali">
            <p className="text-sm opacity-70">Totale: {credentialsCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/credentials">
                Apri
              </Link>
            </div>
          </Card>
          <Card title="Device">
            <p className="text-sm opacity-70">Totale: {devicesCount}</p>
            <div className="card-actions justify-end mt-2">
              <Link className="btn btn-sm btn-outline" href="/devices">
                Apri
              </Link>
            </div>
          </Card>
        </section>

        <section className="alert alert-info justify-between">
          <span>Conforme ai requisiti operativi ISO 27001 (audit trail + MFA + RBAC).</span>
          <div className="flex items-center gap-2">
            <Link className="btn btn-sm btn-ghost" href="/sites">
              Siti
            </Link>
            {session.role === "admin" ? (
              <Link className="btn btn-sm btn-ghost" href="/audit">
                Audit
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
