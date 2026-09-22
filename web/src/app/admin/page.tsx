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
  Sliders,
  Sparkles,
  Network,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  expiredJobs: number;
  totalCompanies: number;
  totalApplications: number;
  totalResumes: number;
  totalTaxonomyTerms?: number;
  totalJobTaxonomyLinks?: number;
  totalResumeTaxonomyLinks?: number;
  totalMatchesComputed?: number;
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
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [rerankEnabled, setRerankEnabled] = useState(true);
  const [topK, setTopK] = useState(10);

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

  const handleTriggerIngestion = async () => {
    setIngesting(true);
    setIngestStatus("Triggering multi-source job ingestion pipeline...");
    try {
      const res = await fetch("/api/admin/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "all" }),
      });
      const data = await res.json();
      if (res.ok) {
        setIngestStatus(data.message || `Ingestion scheduled successfully (${data.sourcesTriggered?.length || 0} sources).`);
      } else {
        setIngestStatus(data.error || "Failed to trigger ingestion.");
      }
    } catch {
      setIngestStatus("Network error triggering ingestion.");
    } finally {
      setIngesting(false);
    }
  };

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "from-indigo-500 to-violet-500", iconBg: "bg-indigo-500/15" },
    { label: "Active Jobs", value: stats?.activeJobs || 0, icon: Briefcase, color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/15" },
    { label: "Companies", value: stats?.totalCompanies || 0, icon: Building2, color: "from-violet-500 to-purple-500", iconBg: "bg-violet-500/15" },
    { label: "Applications", value: stats?.totalApplications || 0, icon: KanbanSquare, color: "from-pink-500 to-rose-500", iconBg: "bg-pink-500/15" },
    { label: "Resumes", value: stats?.totalResumes || 0, icon: FileText, color: "from-teal-500 to-cyan-500", iconBg: "bg-teal-500/15" },
    { label: "ESCO Taxonomy Terms", value: stats?.totalTaxonomyTerms || 0, icon: Network, color: "from-amber-500 to-yellow-500", iconBg: "bg-amber-500/15" },
    { label: "Job Taxonomy Links", value: stats?.totalJobTaxonomyLinks || 0, icon: Sparkles, color: "from-cyan-500 to-blue-500", iconBg: "bg-cyan-500/15" },
    { label: "Matches Evaluated", value: stats?.totalMatchesComputed || 0, icon: Zap, color: "from-purple-500 to-indigo-500", iconBg: "bg-purple-500/15" },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Overview & Research Controls</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Two-stage research matching architecture, ESCO taxonomy stats, and real-time metrics
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleTriggerIngestion}
            disabled={ingesting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${ingesting ? "animate-spin" : ""}`} />
            {ingesting ? "Ingesting..." : "Trigger Ingestion"}
          </button>
        </div>
      </div>

      {ingestStatus && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-200 animate-fade-in">
          {ingestStatus}
        </div>
      )}

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

      {/* Research Controls Panel */}
      <div className="glass-card-static p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2.5 text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Research Architecture Controls</h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Stage A (ESCO Taxonomy + 8-Factor Hybrid) & Stage B (Selective LLM Reranker with Evidence Grounding)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Deterministic Fallback Active
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Stage B: LLM Reranking</span>
              <button
                type="button"
                onClick={() => setRerankEnabled(!rerankEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  rerankEnabled ? "bg-indigo-600" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rerankEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              When enabled, top-{topK} candidates undergo structured JSON evaluation with strict evidence validation. If disabled, system falls back to Stage A retrieval score.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Top-K Reranking Depth</span>
              <div className="flex gap-1.5">
                {[5, 10, 20].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTopK(k)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      topK === k
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-white/5 text-[var(--foreground-muted)] hover:text-white"
                    }`}
                  >
                    K={k}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Limits LLM evaluation to the highest-scoring Stage A candidates, minimizing token usage and latency.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="text-sm font-semibold text-white">Mathematical Scoring Pipeline</span>
            <div className="mt-2 space-y-1.5 font-mono text-[11px] text-indigo-300">
              <div className="rounded bg-black/30 px-2 py-1">
                Stage A: 0.90 × Base + 0.10 × ESCO
              </div>
              <div className="rounded bg-black/30 px-2 py-1">
                Stage B: 0.80 × StageA + 0.20 × Rerank
              </div>
            </div>
          </div>
        </div>
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
