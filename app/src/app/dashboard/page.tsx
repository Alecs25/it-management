import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.mfa) {
    redirect("/auth/login");
  }

  const [clientsCount, credentialsCount, devicesCount, sitesCount] =
    await Promise.all([
      prisma.client.count(),
      prisma.credential.count(),
      prisma.device.count(),
      prisma.site.count(),
    ]);

  const dashCards = [
    {
      href: "/clients",
      label: "Clienti",
      count: clientsCount,
      description: "Gestisci i tuoi clienti",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      href: "/credentials",
      label: "Credenziali",
      count: credentialsCount,
      description: "Credenziali cifrate AES-256",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      href: "/devices",
      label: "Device",
      count: devicesCount,
      description: "Dispositivi monitorati",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      href: "/sites",
      label: "Sedi",
      count: sitesCount,
      description: "Sedi dei clienti",
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
<<<<<<< HEAD
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
=======
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm opacity-60 mt-1">
          Benvenuto, <strong>{session.email}</strong> — Ruolo:{" "}
          <strong className="capitalize">{session.role}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dashCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="card-body">
              <div
                className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-2`}
              >
                <span className={`text-lg font-bold ${card.color}`}>
                  {card.count}
                </span>
              </div>
              <h2 className="card-title text-base">{card.label}</h2>
              <p className="text-sm opacity-60">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {session.role === "admin" && (
        <div className="alert border border-base-300">
          <span className="text-sm opacity-70">
            Conforme ISO 27001 — audit trail + MFA + RBAC.
          </span>
          <Link className="btn btn-xs btn-ghost ml-auto" href="/audit">
            Vai all&#39;Audit Log
          </Link>
        </div>
      )}
    </div>
>>>>>>> eee3f55028114f1a61b6e8511c9f4588418af0d4
  );
}
