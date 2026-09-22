"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Building2, MapPin, Clock, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DEMO_SAVED = [
  { id: "s1", jobId: "d1", savedAt: new Date().toISOString(), job: { id: "d1", jobTitle: "Frontend Engineer — New Grad", location: "San Francisco, CA", remoteType: "hybrid", postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), skillsJson: ["React", "TypeScript", "CSS"], company: { companyName: "Stripe" } } },
  { id: "s2", jobId: "d3", savedAt: new Date().toISOString(), job: { id: "d3", jobTitle: "Full Stack Developer", location: "Bangalore, India", remoteType: "hybrid", postedAt: new Date(Date.now() - 1 * 86400000).toISOString(), skillsJson: ["Next.js", "Node.js", "PostgreSQL"], company: { companyName: "Razorpay" } } },
  { id: "s3", jobId: "d6", savedAt: new Date().toISOString(), job: { id: "d6", jobTitle: "ML Engineer Intern", location: "Hyderabad, India", remoteType: "hybrid", postedAt: new Date(Date.now() - 4 * 86400000).toISOString(), skillsJson: ["Python", "PyTorch", "TensorFlow"], company: { companyName: "Google" } } },
];

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState(DEMO_SAVED);
  const [loading, setLoading] = useState(false);

  const removeSaved = async (jobId: string) => {
    setSavedJobs(prev => prev.filter(s => s.jobId !== jobId));
    try { await fetch(`/api/jobs/${jobId}/save`, { method: "POST" }); } catch {}
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bookmark className="h-5 w-5 text-indigo-400" /> Saved Jobs</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">{savedJobs.length} jobs saved</p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="glass-card-static py-16 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
          <h3 className="mt-4 text-lg font-semibold text-white">No saved jobs yet</h3>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Browse jobs and save the ones you&apos;re interested in.</p>
          <Link href="/jobs"><Button variant="outline" className="mt-4">Browse Jobs</Button></Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-fade-in">
          {savedJobs.map((saved) => (
            <div key={saved.id} className="group rounded-2xl border border-white/[0.06] bg-[var(--surface-glass)] p-5 backdrop-blur-md transition-all hover:border-indigo-500/20">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/jobs/${saved.jobId}`} className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-base font-bold text-indigo-400">
                    {saved.job.company.companyName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">{saved.job.jobTitle}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-secondary)]">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{saved.job.company.companyName}</span>
                      {saved.job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{saved.job.location}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{getTimeAgo(saved.job.postedAt)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(saved.job.skillsJson || []).slice(0, 4).map(skill => (
                        <span key={skill} className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/15">{skill}</span>
                      ))}
                    </div>
                  </div>
                </Link>
                <button onClick={() => removeSaved(saved.jobId)} className="shrink-0 rounded-lg p-2 text-[var(--foreground-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
