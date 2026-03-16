import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit, globalRateLimiter } from "@/lib/middleware/rate-limit";
import { getRequestMeta, requireSessionAndPermission } from "@/lib/auth/route-auth";
import { rbacService, Role } from "@/lib/services/rbac-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const meta = getRequestMeta(req);
  if (!checkRateLimit(globalRateLimiter, meta.ipAddress, "/api/map/overview")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const auth = requireSessionAndPermission(req, "client:read");
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const role = auth.role as Role;
  const canReadAll = rbacService.hasAllPermissions(role, ["site:read", "device:read", "credential:read"]);
  if (!canReadAll) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const siteFilter = req.nextUrl.searchParams.get("siteId") ?? undefined;

  const clients = await prisma.client.findMany({
    include: {
      sites: {
        include: {
          devices: {
            select: {
              id: true,
              siteId: true,
              name: true,
              type: true,
              ipLocal: true,
              ipPublic: true,
              credentialId: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      credentials: {
        select: {
          id: true,
          title: true,
          username: true,
        },
        orderBy: { title: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const response = clients
    .map((client) => {
      const credentialsById = new Map(client.credentials.map((c) => [c.id, c]));
      const usedCredentialIds = new Set<string>();

      const filteredSites = (siteFilter
        ? client.sites.filter((site) => site.id === siteFilter)
        : client.sites
      ).map((site) => {
        const siteCredentialIds = Array.from(
          new Set(site.devices.map((d) => d.credentialId).filter((id): id is string => Boolean(id))),
        );
        const siteCredentials = siteCredentialIds
          .map((id) => credentialsById.get(id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));

        siteCredentialIds.forEach((id) => usedCredentialIds.add(id));

        return {
          id: site.id,
          name: site.name,
          city: site.city,
          devices: site.devices,
          credentials: siteCredentials,
        };
      });

      const unassignedCredentials = client.credentials.filter((credential) => !usedCredentialIds.has(credential.id));

      return {
        id: client.id,
        name: client.name,
        status: client.status,
        sites: filteredSites,
        unassignedCredentials: siteFilter ? [] : unassignedCredentials,
      };
    })
    .filter((client) => client.sites.length > 0 || !siteFilter);

  return NextResponse.json({ clients: response });
}
