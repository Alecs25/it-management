import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAppConfigured } from "@/lib/setup/setup-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = await isAppConfigured();
  if (!configured) {
    redirect("/setup");
  }

  const session = await getSession();
  if (session?.mfa) {
    redirect("/dashboard");
  }
  redirect("/auth/login");
}
