"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  Filter,
  LayoutGrid,
  List,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { Pagination } from "@/components/ui/Pagination";

const ROLE_TYPES = ["frontend", "backend", "fullstack", "devops", "data", "ml", "mobile"];
const EXP_LEVELS = ["intern", "entry", "junior"];
const REMOTE_TYPES = ["remote", "hybrid", "onsite"];

const DEMO_JOBS = [
  { id: "d1", jobTitle: "Frontend Engineer — New Grad", roleType: "frontend", location: "San Francisco, CA", remoteType: "hybrid", experienceLevel: "entry", source: "greenhouse", postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), skillsJson: ["React", "TypeScript", "CSS", "Tailwind"], company: { companyName: "Stripe", domain: "stripe.com" }, confidenceScore: 0.95 },
  { id: "d2", jobTitle: "Software Engineer Intern", roleType: "fullstack", location: "Remote", remoteType: "remote", experienceLevel: "intern", source: "lever", postedAt: new Date(Date.now() - 5 * 86400000).toISOString(), skillsJson: ["Python", "JavaScript", "SQL"], company: { companyName: "Cloudflare", domain: "cloudflare.com" }, confidenceScore: 0.9 },
  { id: "d3", jobTitle: "Full Stack Developer", roleType: "fullstack", location: "Bangalore, India", remoteType: "hybrid", experienceLevel: "entry", source: "greenhouse", postedAt: new Date(Date.now() - 1 * 86400000).toISOString(), skillsJson: ["Next.js", "Node.js", "PostgreSQL", "Docker"], company: { companyName: "Razorpay", domain: "razorpay.com" }, confidenceScore: 0.85 },
  { id: "d4", jobTitle: "Backend Engineer", roleType: "backend", location: "Bangalore, India", remoteType: "onsite", experienceLevel: "entry", source: "manual", postedAt: new Date(Date.now() - 3 * 86400000).toISOString(), skillsJson: ["Python", "Go", "Redis", "PostgreSQL"], company: { companyName: "Zerodha", domain: "zerodha.com" }, confidenceScore: 0.8 },
  { id: "d5", jobTitle: "DevOps Engineer — Junior", roleType: "devops", location: "Remote (India)", remoteType: "remote", experienceLevel: "junior", source: "greenhouse", postedAt: new Date(Date.now() - 7 * 86400000).toISOString(), skillsJson: ["Docker", "Kubernetes", "Terraform", "AWS"], company: { companyName: "Postman", domain: "postman.com" }, confidenceScore: 0.75 },
  { id: "d6", jobTitle: "ML Engineer Intern", roleType: "ml", location: "Hyderabad, India", remoteType: "hybrid", experienceLevel: "intern", source: "lever", postedAt: new Date(Date.now() - 4 * 86400000).toISOString(), skillsJson: ["Python", "PyTorch", "TensorFlow", "NumPy"], company: { companyName: "Google", domain: "google.com" }, confidenceScore: 0.92 },
  { id: "d7", jobTitle: "Mobile Developer — React Native", roleType: "mobile", location: "Mumbai, India", remoteType: "remote", experienceLevel: "entry", source: "github", postedAt: new Date(Date.now() - 6 * 86400000).toISOString(), skillsJson: ["React Native", "TypeScript", "Redux"], company: { companyName: "Cred", domain: "cred.club" }, confidenceScore: 0.7 },
  { id: "d8", jobTitle: "Data Engineer — Fresher", roleType: "data", location: "Pune, India", remoteType: "onsite", experienceLevel: "entry", source: "manual", postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), skillsJson: ["Python", "SQL", "Spark", "Airflow"], company: { companyName: "Flipkart", domain: "flipkart.com" }, confidenceScore: 0.82 },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedExp, setSelectedExp] = useState<string[]>([]);
  const [selectedRemote, setSelectedRemote] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Try fetching real data, fall back to demo
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (selectedRoles.length) params.set("roleType", selectedRoles.join(","));
        if (selectedExp.length) params.set("experienceLevel", selectedExp.join(","));
        if (selectedRemote.length) params.set("remoteType", selectedRemote.join(","));
        params.set("page", page.toString());

        const res = await fetch(`/api/jobs?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.jobs?.length > 0) {
            setJobs(data.jobs);
            setLoading(false);
            return;
          }
        }
      } catch { /* use demo data */ }
      // Filter demo data client-side
      let filtered = DEMO_JOBS;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(j =>
          j.jobTitle.toLowerCase().includes(q) ||
          j.company.companyName.toLowerCase().includes(q) ||
          j.skillsJson.some(s => s.toLowerCase().includes(q))
        );
      }
      if (selectedRoles.length) filtered = filtered.filter(j => selectedRoles.includes(j.roleType));
      if (selectedExp.length) filtered = filtered.filter(j => selectedExp.includes(j.experienceLevel));
      if (selectedRemote.length) filtered = filtered.filter(j => selectedRemote.includes(j.remoteType));
      setJobs(filtered);
      setLoading(false);
    }
    fetchJobs();
  }, [searchQuery, selectedRoles, selectedExp, selectedRemote, page]);

  const toggleFilter = (arr: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearFilters = () => {
    setSelectedRoles([]);
    setSelectedExp([]);
    setSelectedRemote([]);
    setSearchQuery("");
  };

  const activeFilterCount = selectedRoles.length + selectedExp.length + selectedRemote.length;

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const getRemoteStyle = (type: string) => {
    const map: Record<string, string> = {
      remote: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
      hybrid: "bg-indigo-500/12 text-indigo-400 border-indigo-500/20",
      onsite: "bg-amber-500/12 text-amber-400 border-amber-500/20",
    };
    return map[type] || "bg-white/5 text-slate-400 border-white/10";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Search Bar */}
      <div className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                : "border-white/[0.08] bg-white/[0.03] text-[var(--foreground-secondary)] hover:bg-white/[0.06]"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-[var(--foreground-muted)] hover:text-white"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-[var(--foreground-muted)] hover:text-white"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="animate-fade-in-down glass-card-static space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Filter Jobs</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Role Type</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_TYPES.map(role => (
                <FilterChip key={role} label={role} active={selectedRoles.includes(role)} onClick={() => toggleFilter(selectedRoles, setSelectedRoles, role)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Experience</p>
            <div className="flex flex-wrap gap-2">
              {EXP_LEVELS.map(exp => (
                <FilterChip key={exp} label={exp} active={selectedExp.includes(exp)} onClick={() => toggleFilter(selectedExp, setSelectedExp, exp)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Work Mode</p>
            <div className="flex flex-wrap gap-2">
              {REMOTE_TYPES.map(rt => (
                <FilterChip key={rt} label={rt} active={selectedRemote.includes(rt)} onClick={() => toggleFilter(selectedRemote, setSelectedRemote, rt)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-muted)]">
          <span className="font-semibold text-white">{jobs.length}</span> jobs found
        </p>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card-static py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
          <h3 className="mt-4 text-lg font-semibold text-white">No jobs found</h3>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Try adjusting your filters or search query.</p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2" : "space-y-3"}>
          {jobs.map((job, i) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group block animate-fade-in-up rounded-2xl border border-white/[0.06] bg-[var(--surface-glass)] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-base font-bold text-indigo-400">
                    {job.company.companyName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {job.jobTitle}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--foreground-secondary)]">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company.companyName}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {getTimeAgo(job.postedAt)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {(job.skillsJson || []).slice(0, 4).map(skill => (
                        <span key={skill} className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/15">
                          {skill}
                        </span>
                      ))}
                      {(job.skillsJson || []).length > 4 && (
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
                          +{job.skillsJson.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRemoteStyle(job.remoteType)}`}>
                    {job.remoteType}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-[var(--foreground-muted)] capitalize">
                    {job.experienceLevel}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {jobs.length > 0 && (
        <div className="flex justify-center pt-4">
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(jobs.length / 20))} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
