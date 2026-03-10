import { redirect } from "next/navigation";
import { getSetupPrerequisites, isAppConfigured } from "@/lib/setup/setup-service";
import { SetupInitializer } from "@/components/features/SetupInitializer";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const prerequisites = await getSetupPrerequisites();
  if (!prerequisites.ready) {
    redirect("/setup/prerequisites");
  }

  const configured = await isAppConfigured();

  if (configured) {
    redirect("/auth/login");
  }

  return <SetupInitializer />;
}
