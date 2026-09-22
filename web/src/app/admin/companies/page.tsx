"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Globe,
  GraduationCap,
  Users,
  Edit,
  Briefcase,
} from "lucide-react";

interface Company {
  id: string;
  companyName: string;
  domain: string | null;
  industry: string | null;
  companySize: string | null;
  headquartersLocation: string | null;
  fresherFriendly: boolean;
  cultureTagsJson: any;
  _count?: { jobs: number };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        // For now we don't have a dedicated companies list endpoint,
        // so we use a demo list. In production this would be a separate API.
        setCompanies([
          { id: "c1", companyName: "Stripe", domain: "stripe.com", industry: "Fintech", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["engineering-driven", "remote-friendly"], _count: { jobs: 12 } },
          { id: "c2", companyName: "Cloudflare", domain: "cloudflare.com", industry: "Infrastructure", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-first", "open-source"], _count: { jobs: 8 } },
          { id: "c3", companyName: "Razorpay", domain: "razorpay.com", industry: "Fintech", companySize: "mid", headquartersLocation: "Bangalore, India", fresherFriendly: true, cultureTagsJson: ["startup-culture", "fast-growing"], _count: { jobs: 15 } },
          { id: "c4", companyName: "Google", domain: "google.com", industry: "Big Tech", companySize: "enterprise", headquartersLocation: "Mountain View, CA", fresherFriendly: true, cultureTagsJson: ["innovative", "research-driven"], _count: { jobs: 45 } },
          { id: "c5", companyName: "Postman", domain: "postman.com", industry: "Dev Tools", companySize: "mid", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-first", "api-first"], _count: { jobs: 10 } },
        ]);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-400" /> Company Management
        </h2>
        <p className="text-sm text-[var(--foreground-secondary)]">
          {companies.length} companies in database
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((company) => (
          <div
            key={company.id}
            className="glass-card-static flex items-center justify-between gap-4 p-5"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-base font-bold text-indigo-400">
                {company.companyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">{company.companyName}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
                  {company.industry && <span>{company.industry}</span>}
                  {company.companySize && <span className="capitalize">{company.companySize}</span>}
                  {company.headquartersLocation && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {company.headquartersLocation}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {company._count?.jobs || 0} jobs
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {company.fresherFriendly && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  <GraduationCap className="h-3 w-3" /> Fresher
                </span>
              )}
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(company.cultureTagsJson) ? company.cultureTagsJson : [])
                  .slice(0, 2)
                  .map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
