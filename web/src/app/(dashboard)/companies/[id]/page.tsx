"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Globe, MapPin, Users, GraduationCap, ExternalLink, MessageSquare, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

const COMPANY_DATA: Record<string, any> = {
  c1: {
    companyName: "Stripe", domain: "stripe.com", industry: "Fintech", companySize: "large",
    headquartersLocation: "San Francisco, CA", fresherFriendly: true,
    cultureTagsJson: ["remote-friendly", "engineering-driven", "open-source", "documentation-first"],
    interviewStyleJson: { rounds: 4, types: ["coding", "system-design", "behavioral"], difficulty: "hard", notes: "Known for challenging coding rounds and strong emphasis on code quality" },
    engineeringBlogsJson: [{ url: "https://stripe.com/blog/engineering", title: "Stripe Engineering Blog" }],
    insights: [
      { type: "culture", text: "Strong writing culture — all decisions are documented in RFCs. Engineers are expected to write clearly." },
      { type: "hiring", text: "Typically hires new grads in Fall recruiting cycle. Strong focus on CS fundamentals." },
      { type: "engineering", text: "Uses Ruby, Java, and React internally. Strong microservices architecture." },
    ],
    interviewQuestions: [
      { text: "Design a rate limiter for API requests", type: "system-design", difficulty: "medium" },
      { text: "Implement a function to merge overlapping intervals", type: "coding", difficulty: "medium" },
      { text: "Tell me about a time you dealt with ambiguity", type: "behavioral", difficulty: "easy" },
      { text: "Build a URL shortener with analytics", type: "coding", difficulty: "hard" },
      { text: "How would you design Stripe's payment processing pipeline?", type: "system-design", difficulty: "hard" },
    ],
    hiringNotes: [
      { type: "process", text: "Typically 4 rounds: phone screen, 2 coding interviews, 1 system design + behavioral" },
      { type: "timeline", text: "Process usually takes 3-4 weeks from application to offer" },
      { type: "tip", text: "Practice clean code writing — they evaluate code quality heavily, not just correctness" },
    ],
  },
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;
  const company = COMPANY_DATA[companyId] || COMPANY_DATA.c1;
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "insights">("overview");

  const difficultyColor = (d: string) => d === "hard" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : d === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  const typeColor = (t: string) => t === "coding" ? "text-indigo-400 bg-indigo-500/10" : t === "system-design" ? "text-violet-400 bg-violet-500/10" : "text-emerald-400 bg-emerald-500/10";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="glass-card-static overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg">
              {company.companyName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{company.companyName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--foreground-secondary)]">
                <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{company.domain}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{company.industry}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{company.headquartersLocation}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4 capitalize" />{company.companySize}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {company.fresherFriendly && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                    <GraduationCap className="h-3 w-3" /> Fresher Friendly
                  </span>
                )}
                {company.cultureTagsJson.map((tag: string) => (
                  <span key={tag} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(["overview", "interviews", "insights"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${
              activeTab === tab ? "bg-indigo-500/15 text-indigo-300" : "text-[var(--foreground-muted)] hover:text-white"
            }`}>{tab}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Interview Style */}
          {company.interviewStyleJson && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 font-semibold text-white">Interview Process</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <p className="text-2xl font-bold text-white">{company.interviewStyleJson.rounds}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">Rounds</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <p className={`text-2xl font-bold capitalize ${company.interviewStyleJson.difficulty === "hard" ? "text-rose-400" : "text-amber-400"}`}>{company.interviewStyleJson.difficulty}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">Difficulty</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {company.interviewStyleJson.types.map((t: string) => (
                      <span key={t} className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(t)}`}>{t}</span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">Types</p>
                </div>
              </div>
              {company.interviewStyleJson.notes && (
                <p className="mt-3 text-sm text-[var(--foreground-secondary)]">{company.interviewStyleJson.notes}</p>
              )}
            </div>
          )}

          {/* Hiring Notes */}
          {company.hiringNotes?.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 font-semibold text-white">Hiring Notes</h3>
              <div className="space-y-2">
                {company.hiringNotes.map((note: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      note.type === "tip" ? "bg-emerald-500/10 text-emerald-400" : note.type === "warning" ? "bg-rose-500/10 text-rose-400" : "bg-indigo-500/10 text-indigo-400"
                    }`}>{note.type}</span>
                    <p className="text-sm text-[var(--foreground-secondary)]">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interviews Tab */}
      {activeTab === "interviews" && (
        <div className="space-y-3">
          {company.interviewQuestions?.map((q: any, i: number) => (
            <div key={i} className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{q.text}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(q.type)}`}>{q.type}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                  </div>
                </div>
                <MessageSquare className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <div className="space-y-3">
          {company.insights?.map((insight: any, i: number) => (
            <div key={i} className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                insight.type === "culture" ? "bg-violet-500/10 text-violet-400" : insight.type === "hiring" ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
              }`}>{insight.type}</span>
              <p className="text-sm text-[var(--foreground-secondary)]">{insight.text}</p>
            </div>
          ))}

          {company.engineeringBlogsJson?.length > 0 && (
            <div className="glass-card-static p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><BookOpen className="h-4 w-4 text-indigo-400" /> Engineering Blog</h3>
              {company.engineeringBlogsJson.map((blog: any, i: number) => (
                <a key={i} href={blog.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> {blog.title || blog.url}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
