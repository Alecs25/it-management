import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { prisma } from "@/lib/database/prisma";
import { ClientDetail, type Client } from "@/components/features/ClientDetail";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  await requirePagePermission("client:read");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      sites: {
        orderBy: { name: "asc" },
        include: {
          devices: {
            orderBy: { name: "asc" },
          },
          credentials: {
            select: {
              id: true,
              title: true,
              username: true,
              siteId: true,
              notes: true,
              lastEditor: { select: { email: true } },
            },
            orderBy: { title: "asc" },
          },
        },
      },
      devices: {
        where: { siteId: null },
        orderBy: { name: "asc" },
      },
      credentials: {
        where: { siteId: null },
        select: {
          id: true,
          title: true,
          username: true,
          siteId: true,
          notes: true,
          lastEditor: { select: { email: true } },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!client) {
    redirect("/clients");
  }

  return (
    <div className="p-6">
      <ClientDetail client={client as Client} />
    </div>
  );
}
