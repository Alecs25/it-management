"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that don't use MainLayout (auth, setup, special pages)
  const excludedRoutes = ["/auth/", "/setup/", "/_not-found"];
  const shouldUseLayout = !excludedRoutes.some((route) => pathname.startsWith(route) || pathname === route);

  if (!shouldUseLayout) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
