"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Search, Globe, Users, GraduationCap, ExternalLink } from "lucide-react";

const DEMO_COMPANIES = [
  { id: "c1", companyName: "Stripe", domain: "stripe.com", industry: "Fintech", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-friendly", "engineering-driven", "open-source"], jobCount: 12 },
  { id: "c2", companyName: "Cloudflare", domain: "cloudflare.com", industry: "Infrastructure", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-first", "open-source", "fast-paced"], jobCount: 8 },
  { id: "c3", companyName: "Razorpay", domain: "razorpay.com", industry: "Fintech", companySize: "mid", headquartersLocation: "Bangalore, India", fresherFriendly: true, cultureTagsJson: ["startup-culture", "fast-growing", "engineering-first"], jobCount: 15 },
  { id: "c4", companyName: "Google", domain: "google.com", industry: "Big Tech", companySize: "enterprise", headquartersLocation: "Mountain View, CA", fresherFriendly: true, cultureTagsJson: ["innovative", "research-driven", "perks-heavy"], jobCount: 45 },
  { id: "c5", companyName: "Zerodha", domain: "zerodha.com", industry: "Fintech", companySize: "mid", headquartersLocation: "Bangalore, India", fresherFriendly: true, cultureTagsJson: ["bootstrapped", "lean-team", "product-first"], jobCount: 5 },
  { id: "c6", companyName: "Postman", domain: "postman.com", industry: "Dev Tools", companySize: "mid", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-first", "developer-community", "api-first"], jobCount: 10 },
  { id: "c7", companyName: "Flipkart", domain: "flipkart.com", industry: "E-Commerce", companySize: "large", headquartersLocation: "Bangalore, India", fresherFriendly: true, cultureTagsJson: ["scale", "fast-paced", "data-driven"], jobCount: 22 },
  { id: "c8", companyName: "Cred", domain: "cred.club", industry: "Fintech", companySize: "mid", headquartersLocation: "Bangalore, India", fresherFriendly: false, cultureTagsJson: ["design-first", "premium", "startup"], jobCount: 7 },
];

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const filtered = DEMO_COMPANIES.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-400" /> Companies</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">Explore company profiles, culture, and interview insights</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input type="text" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
        {filtered.map(company => (
          <Link key={company.id} href={`/companies/${company.id}`} className="glass-card group block p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-lg font-bold text-indigo-400">
                {company.companyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{company.companyName}</h3>
                <p className="text-xs text-[var(--foreground-muted)]">{company.industry} • {company.companySize}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{company.headquartersLocation}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{company.jobCount} jobs</span>
            </div>
            {company.fresherFriendly && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                <GraduationCap className="h-3 w-3" /> Fresher Friendly
              </span>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {company.cultureTagsJson.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
