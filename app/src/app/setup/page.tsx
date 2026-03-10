import { redirect } from "next/navigation";
import { isAppConfigured } from "@/lib/setup/setup-service";
import { SetupInitializer } from "@/components/features/SetupInitializer";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const configured = await isAppConfigured();

  if (configured) {
    redirect("/auth/login");
  }

  return <SetupInitializer />;
}
