"use client";

import React, { useState, useEffect } from "react";
import { KanbanSquare, Plus, ChevronRight, ChevronLeft, Building2, Calendar, StickyNote, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ApplicationStatus } from "@/types/application";

const COLUMNS: { status: ApplicationStatus; label: string; color: string; bgColor: string }[] = [
  { status: "to_apply", label: "To Apply", color: "text-slate-400", bgColor: "bg-slate-500/15" },
  { status: "applied", label: "Applied", color: "text-indigo-400", bgColor: "bg-indigo-500/15" },
  { status: "interviewing", label: "Interviewing", color: "text-violet-400", bgColor: "bg-violet-500/15" },
  { status: "offer", label: "Offer", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  { status: "rejected", label: "Rejected", color: "text-rose-400", bgColor: "bg-rose-500/15" },
  { status: "withdrawn", label: "Withdrawn", color: "text-amber-400", bgColor: "bg-amber-500/15" },
];

const DEMO_APPS = [
  { id: "a1", status: "to_apply" as ApplicationStatus, notes: "Need to prepare cover letter", job: { jobTitle: "Frontend Engineer — New Grad", company: { companyName: "Stripe" } }, createdAt: new Date().toISOString() },
  { id: "a2", status: "applied" as ApplicationStatus, notes: "Applied via Greenhouse", appliedAt: new Date(Date.now() - 3 * 86400000).toISOString(), job: { jobTitle: "Software Engineer Intern", company: { companyName: "Cloudflare" } }, createdAt: new Date().toISOString() },
  { id: "a3", status: "interviewing" as ApplicationStatus, notes: "Round 2 coding scheduled", interviewStage: "Technical Round 2", job: { jobTitle: "Full Stack Developer", company: { companyName: "Razorpay" } }, createdAt: new Date().toISOString() },
  { id: "a4", status: "offer" as ApplicationStatus, notes: "₹12 LPA offered!", job: { jobTitle: "Backend Engineer", company: { companyName: "Postman" } }, createdAt: new Date().toISOString() },
  { id: "a5", status: "rejected" as ApplicationStatus, notes: "After final round", job: { jobTitle: "ML Engineer Intern", company: { companyName: "Google" } }, createdAt: new Date().toISOString() },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState(DEMO_APPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          if (data.applications?.length > 0) { setApps(data.applications); setLoading(false); return; }
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const moveApp = async (appId: string, newStatus: ApplicationStatus) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
  };

  const deleteApp = async (appId: string) => {
    setApps(prev => prev.filter(a => a.id !== appId));
    try { await fetch(`/api/applications/${appId}`, { method: "DELETE" }); } catch {}
  };

  const getColumnApps = (status: ApplicationStatus) => apps.filter(a => a.status === status);
  const statusIndex = (status: ApplicationStatus) => COLUMNS.findIndex(c => c.status === status);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><KanbanSquare className="h-5 w-5 text-indigo-400" /> Application Tracker</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">{apps.length} applications tracked</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
        {COLUMNS.map(col => {
          const colApps = getColumnApps(col.status);
          return (
            <div key={col.status} className="kanban-column min-w-[280px] flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.bgColor}`} />
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">{colApps.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colApps.map(app => (
                  <div key={app.id} className="kanban-card group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{app.job?.jobTitle || "Unknown Job"}</p>
                        <p className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] mt-0.5">
                          <Building2 className="h-3 w-3" />{app.job?.company?.companyName || "Unknown"}
                        </p>
                      </div>
                      <button onClick={() => deleteApp(app.id)} className="opacity-0 group-hover:opacity-100 text-[var(--foreground-muted)] hover:text-rose-400 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {app.notes && (
                      <p className="mt-2 flex items-start gap-1 text-xs text-[var(--foreground-secondary)]">
                        <StickyNote className="h-3 w-3 mt-0.5 shrink-0" /> {app.notes}
                      </p>
                    )}

                    {(app as any).interviewStage && (
                      <p className="mt-1 text-xs text-violet-400">Stage: {(app as any).interviewStage}</p>
                    )}

                    {/* Move Buttons */}
                    <div className="mt-3 flex justify-between">
                      {statusIndex(app.status) > 0 && (
                        <button onClick={() => moveApp(app.id, COLUMNS[statusIndex(app.status) - 1].status)}
                          className="flex items-center gap-0.5 text-xs text-[var(--foreground-muted)] hover:text-white transition-colors">
                          <ChevronLeft className="h-3 w-3" /> {COLUMNS[statusIndex(app.status) - 1].label}
                        </button>
                      )}
                      <div />
                      {statusIndex(app.status) < COLUMNS.length - 1 && (
                        <button onClick={() => moveApp(app.id, COLUMNS[statusIndex(app.status) + 1].status)}
                          className="flex items-center gap-0.5 text-xs text-[var(--foreground-muted)] hover:text-white transition-colors">
                          {COLUMNS[statusIndex(app.status) + 1].label} <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/[0.06] p-6 text-center">
                    <p className="text-xs text-[var(--foreground-muted)]">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
