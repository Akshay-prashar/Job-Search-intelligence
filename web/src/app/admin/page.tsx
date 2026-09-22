"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  KanbanSquare,
  Database,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  expiredJobs: number;
  totalCompanies: number;
  totalApplications: number;
  totalResumes: number;
}

interface RecentJob {
  id: string;
  jobTitle: string;
  source: string;
  createdAt: string;
  company?: { companyName: string };
}

interface SourceCount {
  source: string;
  count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [sourceCounts, setSourceCounts] = useState<SourceCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          if (res.status === 403) {
            setError("Access denied. Admin privileges required.");
          } else {
            setError("Failed to load stats");
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setStats(data.stats);
        setRecentJobs(data.recentJobs || []);
        setSourceCounts(data.sourceCounts || []);
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static p-12 text-center">
        <Activity className="mx-auto h-12 w-12 text-rose-400" />
        <h3 className="mt-4 text-lg font-semibold text-white">{error}</h3>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Make sure you are logged in with an admin account.
        </p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "from-indigo-500 to-violet-500", iconBg: "bg-indigo-500/15" },
    { label: "Active Jobs", value: stats?.activeJobs || 0, icon: Briefcase, color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/15" },
    { label: "Expired Jobs", value: stats?.expiredJobs || 0, icon: Clock, color: "from-amber-500 to-orange-500", iconBg: "bg-amber-500/15" },
    { label: "Companies", value: stats?.totalCompanies || 0, icon: Building2, color: "from-violet-500 to-purple-500", iconBg: "bg-violet-500/15" },
    { label: "Applications", value: stats?.totalApplications || 0, icon: KanbanSquare, color: "from-pink-500 to-rose-500", iconBg: "bg-pink-500/15" },
    { label: "Resumes", value: stats?.totalResumes || 0, icon: FileText, color: "from-teal-500 to-cyan-500", iconBg: "bg-teal-500/15" },
    { label: "Total Jobs", value: stats?.totalJobs || 0, icon: Database, color: "from-slate-500 to-zinc-500", iconBg: "bg-slate-500/15" },
  ];

  const sourceColors: Record<string, string> = {
    greenhouse: "bg-emerald-500/15 text-emerald-400",
    lever: "bg-indigo-500/15 text-indigo-400",
    github: "bg-violet-500/15 text-violet-400",
    manual: "bg-amber-500/15 text-amber-400",
    hn: "bg-orange-500/15 text-orange-400",
    rss: "bg-teal-500/15 text-teal-400",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">
          Real-time metrics for the JobIntel platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl ${stat.iconBg} p-2.5`}>
                <stat.icon className="h-5 w-5 text-[var(--foreground-secondary)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Distribution */}
        <div className="glass-card-static p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Database className="h-4 w-4 text-indigo-400" /> Jobs by Source
          </h3>
          {sourceCounts.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sourceCounts
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const maxCount = Math.max(...sourceCounts.map((x) => x.count));
                  return (
                    <div key={s.source}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceColors[s.source] || "bg-white/5 text-slate-400"}`}>
                          {s.source}
                        </span>
                        <span className="text-sm font-semibold text-white">{s.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${(s.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="glass-card-static p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-400" /> Recently Ingested Jobs
          </h3>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">No jobs ingested yet</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{job.jobTitle}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {job.company?.companyName || "Unknown"} • {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[job.source] || "bg-white/5 text-slate-400"}`}>
                    {job.source}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
