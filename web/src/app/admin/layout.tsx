"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Building2,
  Users,
  Zap,
  ChevronLeft,
  LogOut,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Sources", href: "/admin/sources", icon: Database },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-full w-[250px] flex-col border-r border-white/[0.06] bg-[var(--background-secondary)]">
        {/* Logo */}
        <div className="flex h-[var(--navbar-height)] items-center gap-2.5 border-b border-white/[0.06] px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 shadow-lg shadow-rose-500/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              Admin
            </span>
            <p className="text-[10px] text-[var(--foreground-muted)]">
              JobIntel Control Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-3 space-y-1">
          <Link
            href="/dashboard"
            className="sidebar-link text-indigo-400 hover:bg-indigo-500/10"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
            <span>Back to App</span>
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "DELETE" });
              window.location.href = "/login";
            }}
            className="sidebar-link w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[250px]">
        <header className="sticky top-0 z-20 flex h-[var(--navbar-height)] items-center border-b border-white/[0.04] bg-[var(--background)] px-6">
          <h1 className="text-lg font-semibold text-white">
            {NAV_ITEMS.find(
              (i) =>
                i.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(i.href)
            )?.label || "Admin"}
          </h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
