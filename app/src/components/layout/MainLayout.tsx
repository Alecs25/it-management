"use client";

import { Sidebar } from "./Sidebar";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-base-100 border-b border-base-300 px-6 flex items-center justify-between shadow-sm">
          <div className="flex-1"></div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="dropdown dropdown-end">
              <button className="btn btn-circle btn-ghost">
                <User size={20} />
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <a href="/profile">Profilo</a>
                </li>
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
