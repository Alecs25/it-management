import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSetupPrerequisites, isAppConfigured } from "@/lib/setup/setup-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prerequisites = await getSetupPrerequisites();
  if (!prerequisites.ready) {
    redirect("/setup/prerequisites");
  }

  const configured = await isAppConfigured();
  if (!configured) {
    redirect("/setup");
  }

  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/auth/login");
}
