import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
<<<<<<< HEAD
import { Providers } from "./Providers";
=======
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/ui/Sidebar";
>>>>>>> eee3f55028114f1a61b6e8511c9f4588418af0d4

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "IT Credential Management",
  description: "ISO 27001 credential management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
<<<<<<< HEAD
        <Providers>{children}</Providers>
=======
        <AppShell>{children}</AppShell>
>>>>>>> eee3f55028114f1a61b6e8511c9f4588418af0d4
      </body>
    </html>
  );
}

async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.mfa) {
    return <>{children}</>;
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={session.email} userRole={session.role} />
      <main className="flex-1 overflow-auto bg-base-200">
        {children}
      </main>
    </div>
  );
}
