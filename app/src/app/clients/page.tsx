import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  redirect("/map");
}
