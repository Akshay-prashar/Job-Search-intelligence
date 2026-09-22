"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Browse Jobs",
  "/saved": "Saved Jobs",
  "/applications": "Applications",
  "/companies": "Companies",
  "/interviews": "Interview Prep",
  "/skills": "Skill Gap Analysis",
  "/profile": "Profile",
  "/resume": "Resume",
  "/settings": "Settings",
};

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUserName(data.user.name);
      })
      .catch(() => {});
  }, []);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || "Dashboard";

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header
      className={`sticky top-0 z-20 flex h-[var(--navbar-height)] items-center justify-between border-b px-6 transition-all duration-200 ${
        scrolled
          ? "border-white/[0.08] bg-[var(--background)]/90 backdrop-blur-xl"
          : "border-white/[0.04] bg-[var(--background)]"
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground-muted)] transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <button className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-[var(--foreground-muted)] transition-all hover:border-white/[0.12] hover:bg-white/[0.05]">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="ml-2 hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--foreground-muted)] transition-colors hover:bg-white/[0.06] hover:text-white">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[var(--background)]" />
        </button>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
