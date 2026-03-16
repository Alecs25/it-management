"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Inline SVG icons to avoid external dependencies
function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconKey() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
    </svg>
  );
}
function IconMonitor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}
function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/clients", label: "Clienti", icon: <IconUsers /> },
  { href: "/credentials", label: "Credenziali", icon: <IconKey /> },
  { href: "/devices", label: "Device", icon: <IconMonitor /> },
  { href: "/audit", label: "Audit", icon: <IconClipboard /> },
];

export function Sidebar({ userEmail, userRole }: { userEmail: string; userRole: string }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col h-screen bg-base-100 border-r border-base-300 transition-all duration-200 shrink-0 ${open ? "w-56" : "w-16"}`}
    >
      {/* Logo / Title */}
      <div className={`flex items-center gap-2 p-4 border-b border-base-300 overflow-hidden ${open ? "" : "justify-center"}`}>
        <IconShield />
        {open && <span className="font-semibold text-sm truncate">IT Credential Mgmt</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-content font-medium"
                  : "hover:bg-base-200 text-base-content"
              } ${!open ? "justify-center px-0" : ""}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-base-300 p-3 space-y-2 overflow-hidden">
        {open && (
          <div className="px-1">
            <p className="text-xs font-medium truncate">{userEmail}</p>
            <p className="text-xs opacity-60 capitalize">{userRole}</p>
          </div>
        )}
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title={!open ? "Logout" : undefined}
            className={`btn btn-ghost btn-sm w-full gap-2 ${!open ? "justify-center px-0" : "justify-start"}`}
          >
            <IconLogout />
            {open && <span>Logout</span>}
          </button>
        </form>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center h-9 border-t border-base-300 hover:bg-base-200 transition-colors text-base-content/60 hover:text-base-content"
        title={open ? "Comprimi" : "Espandi"}
      >
        {open ? <IconChevronLeft /> : <IconChevronRight />}
      </button>
    </aside>
  );
}
