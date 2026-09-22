"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  BookmarkCheck,
  KanbanSquare,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  ChevronRight,
  Target,
  Zap,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

interface DashboardStats {
  totalJobs: number;
  savedJobs: number;
  applications: number;
  matchedJobs: number;
}

interface RecommendedJob {
  id: string;
  jobTitle: string;
  company: { companyName: string; logoUrl?: string };
  location?: string;
  remoteType: string;
  postedAt?: string;
  matchScore: number;
  baseScore?: number;
  taxonomyScore?: number;
  rerankScore?: number;
  matchedSkills: string[];
  missingSkills: string[];
  taxonomyMatches?: string[];
  fresherFit?: string;
  sourceLabel?: string;
  whyRankedHere?: string;
  fallbackUsed?: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 5,
    savedJobs: 2,
    applications: 1,
    matchedJobs: 4,
  });
  const [userName, setUserName] = useState("");
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [jobsList, setJobsList] = useState<RecommendedJob[]>([]);

  // Demo recommendations for fallback
  const demoJobs: RecommendedJob[] = [
    {
      id: "1",
      jobTitle: "Frontend Engineer — New Grad",
      company: { companyName: "Stripe" },
      location: "San Francisco, CA",
      remoteType: "hybrid",
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      matchScore: 92,
      matchedSkills: ["React", "TypeScript", "CSS", "Git"],
      missingSkills: ["GraphQL"],
    },
    {
      id: "2",
      jobTitle: "Software Engineer Intern",
      company: { companyName: "Cloudflare" },
      location: "Remote",
      remoteType: "remote",
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      matchScore: 85,
      matchedSkills: ["Python", "JavaScript", "Linux"],
      missingSkills: ["Go", "Rust"],
    },
    {
      id: "3",
      jobTitle: "Full Stack Developer",
      company: { companyName: "Razorpay" },
      location: "Bangalore, India",
      remoteType: "hybrid",
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      matchScore: 78,
      matchedSkills: ["Next.js", "Node.js", "PostgreSQL"],
      missingSkills: ["Docker", "Kubernetes"],
    },
    {
      id: "4",
      jobTitle: "Backend Engineer",
      company: { companyName: "Postman" },
      location: "Bangalore, India",
      remoteType: "onsite",
      postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      matchScore: 74,
      matchedSkills: ["Python", "SQL", "REST API"],
      missingSkills: ["Go", "Redis"],
    },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        let extractedSkills: string[] = [];
        let roles: string[] = [];

        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserName(data.user.name);
            setHasResume(Boolean(data.user.resumeId || data.user.currentResume));
            roles = data.user.targetRoles || [];
            setTargetRoles(roles);

            if (data.user.profile?.skillsJson) {
              extractedSkills = data.user.profile.skillsJson.map((s: any) =>
                typeof s === "string" ? s.toLowerCase() : (s.name || "").toLowerCase()
              );
              setUserSkills(extractedSkills);
            }
          }
        }

        // Fetch research-enhanced recommendations
        const recRes = await fetch("/api/jobs/recommendations");
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.jobs && recData.jobs.length > 0) {
            setStats(s => ({
              ...s,
              totalJobs: recData.pagination?.total || recData.jobs.length,
              matchedJobs: recData.jobs.length
            }));

            const mappedJobs: RecommendedJob[] = recData.jobs.map((job: any) => ({
              id: job.id,
              jobTitle: job.job_title,
              company: job.company || { companyName: job.company_name || "Tech Organization" },
              location: job.location,
              remoteType: job.remote_type,
              postedAt: job.posted_at,
              matchScore: Math.round(job.match?.score || 75),
              baseScore: job.match?.base_score,
              taxonomyScore: job.match?.taxonomy_score,
              rerankScore: job.match?.rerank_score,
              matchedSkills: (job.match?.matched_skills || []).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
              missingSkills: (job.match?.missing_skills || []).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
              taxonomyMatches: job.match?.taxonomy_matches || [],
              fresherFit: job.match?.fresher_fit,
              sourceLabel: job.match?.source_label,
              whyRankedHere: job.match?.why_ranked_here,
              fallbackUsed: job.match?.fallback_used
            }));

            setJobsList(mappedJobs);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to /api/jobs
        const jobsRes = await fetch("/api/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.jobs && jobsData.jobs.length > 0) {
            setStats(s => ({ ...s, totalJobs: jobsData.total || jobsData.jobs.length }));

            const scoredJobs: RecommendedJob[] = jobsData.jobs.map((job: any) => {
              const jobSkills: string[] = (job.skillsJson || []).map((s: string) => s.toLowerCase());
              const matched = jobSkills.filter((s: string) => extractedSkills.includes(s));
              const missing = jobSkills.filter((s: string) => !extractedSkills.includes(s));

              let score = 70;
              if (jobSkills.length > 0) {
                const ratio = matched.length / jobSkills.length;
                score = Math.round(50 + ratio * 42);
              }
              if (roles.includes(job.roleType)) {
                score = Math.min(score + 6, 98);
              }

              return {
                id: job.id,
                jobTitle: job.jobTitle,
                company: job.company || { companyName: "Tech Organization" },
                location: job.location,
                remoteType: job.remoteType,
                postedAt: job.postedAt,
                matchScore: score,
                matchedSkills: matched.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
                missingSkills: missing.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
              };
            });

            scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
            setJobsList(scoredJobs);
            setStats(s => ({ ...s, matchedJobs: scoredJobs.length }));
          } else {
            setJobsList(demoJobs);
          }
        } else {
          setJobsList(demoJobs);
        }
      } catch (err) {
        console.warn("Dashboard load fallback:", err);
        setJobsList(demoJobs);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/15";
    if (score >= 80) return "text-indigo-400 bg-indigo-500/15";
    if (score >= 70) return "text-violet-400 bg-violet-500/15";
    return "text-amber-400 bg-amber-500/15";
  };

  const getScoreBorder = (score: number) => {
    if (score >= 90) return "border-emerald-500/20";
    if (score >= 80) return "border-indigo-500/20";
    if (score >= 70) return "border-violet-500/20";
    return "border-amber-500/20";
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const getRemoteBadge = (type: string) => {
    const map: Record<string, { label: string; class: string }> = {
      remote: { label: "Remote", class: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
      hybrid: { label: "Hybrid", class: "bg-indigo-500/12 text-indigo-400 border-indigo-500/20" },
      onsite: { label: "On-site", class: "bg-amber-500/12 text-amber-400 border-amber-500/20" },
    };
    return map[type] || { label: type, class: "bg-white/5 text-slate-400 border-white/10" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-white">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
        </h2>
        <p className="mt-1 text-[var(--foreground-secondary)]">
          Here&apos;s what&apos;s happening with your job search today.
        </p>

        {targetRoles.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">Verified Tech Stack:</span>
            {targetRoles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 uppercase tracking-wider"
              >
                {role}
              </span>
            ))}
            {userSkills.length > 0 && (
              <span className="text-xs text-[var(--foreground-muted)]">
                • {userSkills.length} skills parsed from resume
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
        {[
          {
            label: "Active Jobs",
            value: stats.totalJobs.toString(),
            change: "+5 active in feed",
            icon: Briefcase,
            color: "from-indigo-500 to-violet-500",
            iconBg: "bg-indigo-500/15",
          },
          {
            label: "Top Match",
            value: jobsList[0]?.matchScore ? `${jobsList[0].matchScore}%` : "88%",
            change: jobsList[0]?.company?.companyName || "Top Match",
            icon: Target,
            color: "from-emerald-500 to-teal-500",
            iconBg: "bg-emerald-500/15",
          },
          {
            label: "Saved Jobs",
            value: stats.savedJobs.toString(),
            change: "Bookmarked",
            icon: BookmarkCheck,
            color: "from-violet-500 to-purple-500",
            iconBg: "bg-violet-500/15",
          },
          {
            label: "Applications",
            value: stats.applications.toString(),
            change: "In progress",
            icon: KanbanSquare,
            color: "from-amber-500 to-orange-500",
            iconBg: "bg-amber-500/15",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card animate-fade-in-up p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                  {stat.change}
                </p>
              </div>
              <div className={`rounded-xl ${stat.iconBg} p-2.5`}>
                <stat.icon className="h-5 w-5 text-[var(--foreground-secondary)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resume CTA (if no resume uploaded) */}
      {!hasResume && (
        <div className="animate-fade-in-up glass-card-static overflow-hidden border-indigo-500/20 p-0">
          <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white">
                Upload Your Resume for Better Matches
              </h3>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                Our AI will parse your skills, projects, and experience to
                generate personalized job matches with explainable scores.
              </p>
            </div>
            <Link
              href="/resume"
              className="btn-gradient flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              <span className="relative z-10">Upload Resume</span>
              <ArrowRight className="relative z-10 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Top Recommendations */}
      <div className="animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">
              Top Recommendations
            </h3>
          </div>
          <Link
            href="/jobs"
            className="flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3 stagger-fade-in">
          {jobsList.map((job) => {
            const remote = getRemoteBadge(job.remoteType);
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className={`group block rounded-2xl border bg-[var(--surface-glass)] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${getScoreBorder(
                  job.matchScore
                )} hover:border-indigo-500/30`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Company Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-lg font-bold text-indigo-400">
                      {job.company.companyName.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {job.jobTitle}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-secondary)]">
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

                      {/* Skills & Research Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {job.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/15"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                        {job.missingSkills.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)] border border-white/[0.06]"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.taxonomyScore !== undefined && (
                          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/20">
                            ESCO Taxonomy: {job.taxonomyScore}%
                          </span>
                        )}
                        {job.sourceLabel && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-500/20">
                            {job.sourceLabel}
                          </span>
                        )}
                      </div>

                      {/* Evidence Grounded Justification */}
                      {job.whyRankedHere && (
                        <p className="mt-2 text-xs text-[var(--foreground-secondary)] line-clamp-1 italic">
                          💡 {job.whyRankedHere}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score + Badge */}
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <div
                      className={`rounded-full px-4 py-1.5 text-lg font-bold ${getScoreColor(
                        job.matchScore
                      )}`}
                    >
                      {job.matchScore}%
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${remote.class}`}
                    >
                      {remote.label}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      Stage B Final Score
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up">
        {[
          {
            title: "Browse All Jobs",
            description: "Search and filter through all available positions",
            icon: Briefcase,
            href: "/jobs",
            gradient: "from-indigo-500/20 to-violet-500/20",
          },
          {
            title: "Track Applications",
            description: "Manage your applications with a Kanban board",
            icon: KanbanSquare,
            href: "/applications",
            gradient: "from-violet-500/20 to-purple-500/20",
          },
          {
            title: "Analyze Skill Gaps",
            description: "See which skills appear most in matched jobs",
            icon: TrendingUp,
            href: "/skills",
            gradient: "from-emerald-500/20 to-teal-500/20",
          },
        ].map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="group h-full cursor-pointer">
              <div
                className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${action.gradient} p-3`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {action.title}
              </h4>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                {action.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-400">
                Go <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
