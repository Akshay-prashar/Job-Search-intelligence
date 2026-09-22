"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Send,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  DollarSign,
  GraduationCap,
  Target,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

const DEMO_JOBS: Record<string, any> = {
  d1: {
    jobTitle: "Frontend Engineer — New Grad", roleType: "frontend", location: "San Francisco, CA", remoteType: "hybrid", experienceLevel: "entry", jobType: "full-time", source: "greenhouse", salaryRange: "$80k–$120k", postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: "Join Stripe's frontend team to build beautiful, performant payment UIs used by millions of businesses worldwide. You'll work closely with product designers and backend engineers to create seamless user experiences.\n\nAs a new grad engineer, you'll receive mentorship from senior engineers and have the opportunity to make a meaningful impact on Stripe's products from day one.",
    responsibilities: "• Build and maintain React-based UI components for Stripe Dashboard\n• Collaborate with designers to translate Figma designs into pixel-perfect implementations\n• Write comprehensive unit and integration tests\n• Participate in code reviews and contribute to engineering standards\n• Optimize frontend performance for global scale",
    minimumQualifications: "• BS/MS in Computer Science or equivalent\n• Strong proficiency in JavaScript/TypeScript and React\n• Experience with CSS/Tailwind and responsive design\n• Understanding of web fundamentals (HTTP, browser APIs, accessibility)\n• Graduating in 2025 or 2026",
    preferredQualifications: "• Experience with Next.js or similar SSR frameworks\n• Knowledge of GraphQL and state management libraries\n• Contributions to open-source projects\n• Experience building design systems",
    skillsJson: ["React", "TypeScript", "CSS", "Tailwind", "JavaScript", "Git"],
    company: { companyName: "Stripe", domain: "stripe.com", industry: "Fintech", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-friendly", "engineering-driven", "open-source", "documentation-first"] },
    matchScore: 92, matchedSkills: ["React", "TypeScript", "CSS", "JavaScript", "Git"], missingRequired: ["GraphQL"], missingPreferred: ["Next.js", "Design Systems"],
    matchBreakdown: { exact: 88, semantic: 94, fresherFit: 95, logistics: 80, recency: 90, sourceConfidence: 98, completeness: 85, roleRelevance: 92 },
  },
  d2: {
    jobTitle: "Software Engineer Intern", roleType: "fullstack", location: "Remote", remoteType: "remote", experienceLevel: "intern", jobType: "internship", source: "lever", salaryRange: "$40/hr", postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    description: "Cloudflare's internship program offers a unique opportunity to work on systems that power a significant portion of the internet. You'll join a team of world-class engineers and make contributions that ship to production.",
    responsibilities: "• Work on real projects that impact millions of users\n• Collaborate with your team to design and implement features\n• Learn about distributed systems at massive scale\n• Present your work at the end of the internship",
    minimumQualifications: "• Currently pursuing CS or related degree\n• Proficiency in at least one programming language\n• Understanding of data structures and algorithms\n• Strong problem-solving skills",
    preferredQualifications: "• Experience with Go, Rust, or Python\n• Knowledge of networking concepts\n• Contributions to open-source",
    skillsJson: ["Python", "JavaScript", "SQL", "Go", "Linux"],
    company: { companyName: "Cloudflare", domain: "cloudflare.com", industry: "Infrastructure", companySize: "large", headquartersLocation: "San Francisco, CA", fresherFriendly: true, cultureTagsJson: ["remote-first", "open-source", "fast-paced"] },
    matchScore: 85, matchedSkills: ["Python", "JavaScript", "SQL"], missingRequired: [], missingPreferred: ["Go", "Rust"],
    matchBreakdown: { exact: 75, semantic: 88, fresherFit: 100, logistics: 95, recency: 80, sourceConfidence: 95, completeness: 78, roleRelevance: 85 },
  },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) { setJob(data.job); setLoading(false); return; }
        }
      } catch { /* use demo */ }
      setJob(DEMO_JOBS[jobId] || DEMO_JOBS.d1);
      setLoading(false);
    }
    if (jobId) fetchJob();
  }, [jobId]);

  const handleSave = async () => {
    setSaved(!saved);
    try { await fetch(`/api/jobs/${jobId}/save`, { method: "POST" }); } catch {}
  };

  const handleTrack = async () => {
    try {
      await fetch("/api/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "to_apply" }),
      });
      router.push("/applications");
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!job) return null;

  const scoreColor = (s: number) => s >= 85 ? "success" : s >= 70 ? "primary" : s >= 55 ? "warning" : "danger";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </button>

      {/* Header Card */}
      <div className="glass-card-static overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
                {job.company?.companyName?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{job.jobTitle}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--foreground-secondary)]">
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.company?.companyName}</span>
                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
                  <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 capitalize" />{job.jobType || job.experienceLevel}</span>
                  {job.salaryRange && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salaryRange}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    job.remoteType === "remote" ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" :
                    job.remoteType === "hybrid" ? "bg-indigo-500/12 text-indigo-400 border-indigo-500/20" :
                    "bg-amber-500/12 text-amber-400 border-amber-500/20"
                  }`}>{job.remoteType}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--foreground-secondary)] capitalize">{job.experienceLevel}</span>
                  {job.source && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--foreground-secondary)]">via {job.source}</span>}
                </div>
              </div>
            </div>

            {/* Match Score */}
            {job.matchScore && (
              <div className="flex flex-col items-center">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold ${
                  job.matchScore >= 85 ? "bg-emerald-500/15 text-emerald-400" :
                  job.matchScore >= 70 ? "bg-indigo-500/15 text-indigo-400" :
                  "bg-violet-500/15 text-violet-400"
                }`}>{job.matchScore}%</div>
                <span className="mt-1 text-xs text-[var(--foreground-muted)]">Match Score</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {job.applyUrl ? (
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" /> Apply Now
                </Button>
              </a>
            ) : (
              <Button variant="primary" size="lg" disabled>
                <Send className="mr-2 h-4 w-4" /> Apply Now
              </Button>
            )}
            <Button variant={saved ? "secondary" : "outline"} size="lg" onClick={handleSave}>
              {saved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
              {saved ? "Saved" : "Save Job"}
            </Button>
            <Button variant="outline" size="lg" onClick={handleTrack}>
              <Target className="mr-2 h-4 w-4" /> Track Application
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {job.description && (
            <div className="glass-card-static p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">About the Role</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-secondary)]">{job.description}</div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="glass-card-static p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Responsibilities</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-secondary)]">{job.responsibilities}</div>
            </div>
          )}

          {/* Qualifications */}
          {(job.minimumQualifications || job.preferredQualifications) && (
            <div className="glass-card-static p-6">
              {job.minimumQualifications && (
                <>
                  <h2 className="mb-3 text-lg font-semibold text-white">Minimum Qualifications</h2>
                  <div className="mb-6 whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-secondary)]">{job.minimumQualifications}</div>
                </>
              )}
              {job.preferredQualifications && (
                <>
                  <h2 className="mb-3 text-lg font-semibold text-white">Preferred Qualifications</h2>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-secondary)]">{job.preferredQualifications}</div>
                </>
              )}
            </div>
          )}

          {/* Skills */}
          {job.skillsJson?.length > 0 && (
            <div className="glass-card-static p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skillsJson.map((skill: string) => {
                  const isMatched = job.matchedSkills?.includes(skill);
                  return (
                    <span key={skill} className={`rounded-full border px-3 py-1 text-sm font-medium ${
                      isMatched ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-[var(--foreground-secondary)] border-white/10"
                    }`}>
                      {isMatched && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}{skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Research-Enhanced Two-Stage Explanation Panel */}
          {job.matchScore && (
            <div className="glass-card-static border-indigo-500/30 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> Research Explanation
                </h3>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  Two-Stage Match
                </span>
              </div>

              {/* Two-stage Score breakdown pill grid */}
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <p className="text-[var(--foreground-muted)]">Stage A (Hybrid)</p>
                  <p className="text-base font-bold text-white">{job.baseScore || Math.round(job.matchScore * 0.95)}%</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <p className="text-[var(--foreground-muted)]">ESCO Taxonomy</p>
                  <p className="text-base font-bold text-indigo-300">{job.taxonomyScore ?? 80}%</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <p className="text-[var(--foreground-muted)]">Stage B (LLM Rerank)</p>
                  <p className="text-base font-bold text-violet-300">{job.rerankScore || job.matchScore}%</p>
                </div>
                <div className="rounded-xl bg-indigo-500/15 border border-indigo-500/30 p-2.5">
                  <p className="text-indigo-200 font-medium">Final Combined</p>
                  <p className="text-base font-bold text-emerald-400">{job.matchScore}%</p>
                </div>
              </div>

              {/* Justification */}
              {job.whyRankedHere && (
                <div className="mb-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 p-3">
                  <p className="text-xs font-medium text-indigo-300 mb-1">Decision Justification</p>
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{job.whyRankedHere}</p>
                </div>
              )}

              {/* Grounded Strengths with Evidence */}
              {job.strengths && job.strengths.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Evidence-Backed Strengths
                  </p>
                  {job.strengths.map((st: any, idx: number) => (
                    <div key={idx} className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-2.5 text-xs">
                      <p className="font-medium text-emerald-300">✓ {st.claim}</p>
                      {st.evidence && (
                        <p className="mt-1 text-[11px] text-[var(--foreground-secondary)] italic">
                          "{st.evidence}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Gaps */}
              {job.gaps && job.gaps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    Identified Skill Gaps
                  </p>
                  {job.gaps.map((gp: any, idx: number) => (
                    <div key={idx} className="rounded-xl bg-rose-500/[0.06] border border-rose-500/20 p-2 text-xs">
                      <p className="font-medium text-rose-300">✗ {gp.claim}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Match Breakdown */}
          {job.matchBreakdown && (
            <div className="glass-card-static p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Zap className="h-4 w-4 text-indigo-400" /> Match Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Exact Skill Match", value: job.matchBreakdown.exact, icon: CheckCircle2 },
                  { label: "Semantic Similarity", value: job.matchBreakdown.semantic, icon: TrendingUp },
                  { label: "Fresher Fit", value: job.matchBreakdown.fresherFit, icon: GraduationCap },
                  { label: "Role Relevance", value: job.matchBreakdown.roleRelevance, icon: Target },
                  { label: "Logistics", value: job.matchBreakdown.logistics, icon: MapPin },
                  { label: "Recency", value: job.matchBreakdown.recency, icon: Clock },
                  { label: "Source Confidence", value: job.matchBreakdown.sourceConfidence, icon: Shield },
                  { label: "Completeness", value: job.matchBreakdown.completeness, icon: Globe },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)]">
                        <Icon className="h-3 w-3" /> {label}
                      </span>
                      <span className="text-xs font-semibold text-white">{value}%</span>
                    </div>
                    <ProgressBar value={value} color={scoreColor(value)} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Match */}
          {(job.matchedSkills || job.missingRequired || job.missingPreferred) && (
            <div className="glass-card-static p-6">
              <h3 className="mb-4 text-base font-semibold text-white">Skill Match</h3>
              {job.matchedSkills?.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-emerald-400">✓ Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.matchedSkills.map((s: string) => (
                      <span key={s} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.missingRequired?.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-rose-400">✗ Missing (Required)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missingRequired.map((s: string) => (
                      <span key={s} className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs text-rose-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.missingPreferred?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-amber-400">○ Missing (Preferred)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missingPreferred.map((s: string) => (
                      <span key={s} className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company Info */}
          {job.company && (
            <div className="glass-card-static p-6">
              <h3 className="mb-4 text-base font-semibold text-white">Company</h3>
              <div className="space-y-2 text-sm">
                <p className="text-[var(--foreground-secondary)]"><span className="text-white font-medium">{job.company.companyName}</span></p>
                {job.company.industry && <p className="text-[var(--foreground-muted)]">Industry: {job.company.industry}</p>}
                {job.company.companySize && <p className="text-[var(--foreground-muted)]">Size: {job.company.companySize}</p>}
                {job.company.headquartersLocation && <p className="text-[var(--foreground-muted)]">HQ: {job.company.headquartersLocation}</p>}
                {job.company.fresherFriendly && (
                  <p className="flex items-center gap-1 text-emerald-400"><GraduationCap className="h-4 w-4" /> Fresher Friendly</p>
                )}
              </div>
              {job.company.cultureTagsJson?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.company.cultureTagsJson.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs text-violet-400">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
