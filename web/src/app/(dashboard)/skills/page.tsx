"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Upload } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

interface SkillGapItem {
  skill: string;
  frequency: number;
  count?: number;
  level: string;
  category?: string;
  tip?: string;
}

export default function SkillGapPage() {
  const [yourSkills, setYourSkills] = useState<string[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGaps() {
      try {
        const res = await fetch("/api/skills/gap");
        if (res.ok) {
          const data = await res.json();
          if (data.userSkills) setYourSkills(data.userSkills);
          if (data.gaps) setSkillGaps(data.gaps);
        }
      } catch (err) {
        console.error("Failed to fetch skills gap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGaps();
  }, []);
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-400" /> Skill Gap Analysis</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">Skills that appear most in your matched jobs compared against your verified skills</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card-static p-5 text-center">
          <p className="text-3xl font-bold text-white">{yourSkills.length}</p>
          <p className="text-sm text-[var(--foreground-muted)]">Your Skills</p>
        </div>
        <div className="glass-card-static p-5 text-center">
          <p className="text-3xl font-bold gradient-text">{skillGaps.length}</p>
          <p className="text-sm text-[var(--foreground-muted)]">Skill Gaps Found</p>
        </div>
        <div className="glass-card-static p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{skillGaps.filter(s => s.level === "high").length}</p>
          <p className="text-sm text-[var(--foreground-muted)]">High Priority</p>
        </div>
      </div>

      {/* Your Skills */}
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Your Current Skills</h3>
          <Link href="/resume" className="text-xs text-indigo-400 hover:text-indigo-300">
            Upload new resume →
          </Link>
        </div>
        {yourSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {yourSkills.map(skill => (
              <span key={skill} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">✓ {skill}</span>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">No skills detected yet. Upload your resume or add skills in your profile.</p>
            <Link href="/resume" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition">
              <Upload className="h-3.5 w-3.5" /> Upload Resume
            </Link>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-white"><TrendingUp className="h-4 w-4 text-amber-400" /> Skills to Learn for Target Roles</h3>
        {skillGaps.length > 0 ? (
          skillGaps.map((gap, i) => (
            <div key={gap.skill} className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-white">{gap.skill}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      gap.level === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      gap.level === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-white/5 text-[var(--foreground-muted)] border border-white/10"
                    }`}>{gap.level} priority</span>
                    {gap.category && <span className="text-xs text-[var(--foreground-muted)]">{gap.category}</span>}
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[var(--foreground-muted)]">Appears in active jobs</span>
                      <span className="font-semibold text-white">{gap.frequency}%</span>
                    </div>
                    <ProgressBar value={gap.frequency} color={gap.level === "high" ? "danger" : gap.level === "medium" ? "warning" : "primary"} size="sm" />
                  </div>
                  {gap.tip && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--foreground-secondary)]">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-[var(--foreground-muted)]" />{gap.tip}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card-static p-8 text-center text-[var(--foreground-muted)]">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            <p className="font-semibold text-white">No skill gaps found!</p>
            <p className="text-xs mt-1">Your skills match all requirements for currently listed jobs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
