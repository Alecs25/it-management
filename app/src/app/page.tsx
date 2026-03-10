import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session?.mfa) {
    redirect("/dashboard");
  }
  redirect("/auth/login");
}
