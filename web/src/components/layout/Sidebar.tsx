"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  BookmarkCheck,
  KanbanSquare,
  Building2,
  GraduationCap,
  BarChart3,
  User,
  FileText,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse Jobs", href: "/jobs", icon: Search },
  { label: "Saved Jobs", href: "/saved", icon: BookmarkCheck },
  { label: "Applications", href: "/applications", icon: KanbanSquare },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Interviews", href: "/interviews", icon: GraduationCap },
  { label: "Skill Gap", href: "/skills", icon: BarChart3 },
];

const PROFILE_ITEMS = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r border-white/[0.06] bg-[var(--background-secondary)] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
      }`}
    >
      {/* Logo */}
      <div className="flex h-[var(--navbar-height)] items-center justify-between border-b border-white/[0.06] px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white">
              Job<span className="gradient-text">Intel</span>
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-muted)] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
              Main
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""} ${
                  collapsed ? "justify-center px-0" : ""
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 space-y-1">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
              Account
            </p>
          )}
          {PROFILE_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""} ${
                  collapsed ? "justify-center px-0" : ""
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "DELETE" });
            window.location.href = "/login";
          }}
          className={`sidebar-link w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
