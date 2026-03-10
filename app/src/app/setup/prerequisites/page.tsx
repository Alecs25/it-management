import { redirect } from "next/navigation";
import { SetupPrerequisites } from "@/components/features/SetupPrerequisites";
import { getSetupPrerequisites, isAppConfigured } from "@/lib/setup/setup-service";

export const dynamic = "force-dynamic";

export default async function SetupPrerequisitesPage() {
  const configured = await isAppConfigured();
  if (configured) {
    redirect("/auth/login");
  }

  const prerequisites = await getSetupPrerequisites();
  if (prerequisites.ready) {
    redirect("/setup");
  }

  return <SetupPrerequisites />;
}
