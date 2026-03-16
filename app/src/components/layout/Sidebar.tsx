"use client";

import { useRouter, usePathname } from "next/navigation";
import { useUI } from "@/lib/context/UIContext";
import {
  Home,
  Map,
  MapPin,
  LogOut,
  Settings,
  Menu,
  X,
  FileText,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: <Home size={20} />, label: "Dashboard" },
  { href: "/map", icon: <Map size={20} />, label: "Mappa" },
  { href: "/sites", icon: <MapPin size={20} />, label: "Siti" },
  { href: "/audit", icon: <FileText size={20} />, label: "Audit", adminOnly: true },
  { href: "/profile", icon: <Settings size={20} />, label: "Profilo" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUI();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-base-100 border-r border-base-300 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-base-300 gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
            IT
          </div>
          {sidebarOpen && <span className="font-bold text-sm">Credential Manager</span>}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-4 top-20 bg-base-100 border border-base-300 rounded-full p-1 hover:bg-base-200 transition hidden md:flex"
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Mobile toggle close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-base-200 rounded transition"
        >
          <X size={20} />
        </button>

        {/* Navigation items */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200 text-base-content"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {item.icon}
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-base-300">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-error/10 text-error transition"
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar spacer */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "md:w-64" : "md:w-20"}`} />
    </>
  );
}
