import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requirePagePermission("audit:read");

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  type AuditRow = (typeof logs)[number];

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <Link className="btn btn-outline btn-sm" href="/dashboard">
            Dashboard
          </Link>
        </div>

        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((logItem: AuditRow) => (
                <tr key={logItem.id}>
                  <td>{logItem.timestamp.toISOString()}</td>
                  <td>{logItem.user.email}</td>
                  <td>{logItem.action}</td>
                  <td>{logItem.resource}</td>
                  <td>{logItem.status}</td>
                  <td>{logItem.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
