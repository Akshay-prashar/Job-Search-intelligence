"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  FileText,
  BarChart3,
  Building2,
  Shield,
  ArrowRight,
  Zap,
  Brain,
  Search,
  ChevronRight,
  GitFork,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Users,
  Code2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description:
      "Hybrid scoring engine combines skill matching, semantic similarity, and fresher-fit analysis for accurate recommendations.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: FileText,
    title: "Smart Resume Parsing",
    description:
      "Upload your PDF and watch AI extract skills, projects, education, and experience — instantly building your profile.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Target,
    title: "Explainable Scores",
    description:
      "Every match score comes with a full breakdown: matched skills, missing gaps, fresher fit, location, and recency.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Building2,
    title: "Company Intelligence",
    description:
      "Culture tags, interview styles, engineering blogs, and hiring notes — know every company before you apply.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Skill Gap Analysis",
    description:
      "See which skills appear most in your matched jobs and identify exactly what to learn next for maximum impact.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data stays private. Explicit consent for parsing, full deletion anytime, and complete transparency on what we store.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "Sign up, add your skills, preferences, and target roles.",
    icon: Users,
  },
  {
    step: "02",
    title: "Upload Your Resume",
    description: "Our AI parses it instantly — extracting skills, projects, and more.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Get Matched",
    description: "Browse personalized job recommendations with explainable match scores.",
    icon: Sparkles,
  },
  {
    step: "04",
    title: "Track & Apply",
    description: "Save jobs, track applications with a Kanban board, and land your dream role.",
    icon: TrendingUp,
  },
];

const STATS = [
  { value: "500+", label: "Active Jobs" },
  { value: "50+", label: "Companies" },
  { value: "8", label: "Match Factors" },
  { value: "100%", label: "Free" },
];

const DATA_SOURCES = [
  "Greenhouse ATS",
  "Lever Postings",
  "GitHub Repos",
  "HackerNews",
  "RSS Feeds",
  "Manual Curation",
];

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Mesh background blobs */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Job<span className="gradient-text">Intel</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#sources"
              className="text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:text-white"
            >
              Data Sources
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-white/[0.06] hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-32">
        <div
          className={`mx-auto max-w-4xl text-center transition-all duration-1000 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-indigo-300">
              AI-Powered Job Matching for CS Freshers
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl">
            Find Your Perfect
            <br />
            <span className="gradient-text">First Tech Job</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[var(--foreground-secondary)] md:text-xl">
            Upload your resume, get AI-matched to entry-level roles, and
            understand exactly why each job fits you — with transparent scoring
            and skill gap insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="btn-gradient group flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold"
            >
              <span className="relative z-10">Start Free — No Credit Card</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              See How It Works
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Illustration — Match Score Preview */}
        <div
          className={`mx-auto mt-20 max-w-3xl transition-all delay-300 duration-1000 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-12 opacity-0"
          }`}
        >
          <div className="glass-card-static overflow-hidden rounded-2xl p-1">
            <div className="rounded-xl bg-[var(--surface)] p-6">
              {/* Mock Dashboard Preview */}
              <div className="mb-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div className="ml-4 flex-1 rounded-full bg-white/[0.05] py-1 text-center text-xs text-[var(--foreground-muted)]">
                  jobintel.app/dashboard
                </div>
              </div>

              {/* Mock Job Cards */}
              <div className="space-y-3">
                {[
                  {
                    title: "Frontend Engineer — New Grad",
                    company: "Stripe",
                    score: 92,
                    skills: ["React", "TypeScript", "CSS"],
                    badge: "🎯 Top Match",
                  },
                  {
                    title: "Software Engineer Intern",
                    company: "Cloudflare",
                    score: 85,
                    skills: ["Python", "Go", "Linux"],
                    badge: "🚀 Great Fit",
                  },
                  {
                    title: "Full Stack Developer",
                    company: "Razorpay",
                    score: 78,
                    skills: ["Next.js", "Node.js", "SQL"],
                    badge: "⭐ Recommended",
                  },
                ].map((job) => (
                  <div
                    key={job.title}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-indigo-500/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                        <Building2 className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {job.title}
                        </div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                          {job.company}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden gap-1.5 sm:flex">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-bold ${
                          job.score >= 90
                            ? "bg-emerald-500/15 text-emerald-400"
                            : job.score >= 80
                            ? "bg-indigo-500/15 text-indigo-400"
                            : "bg-violet-500/15 text-violet-400"
                        }`}
                      >
                        {job.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 border-t border-white/[0.04] py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5">
              <Code2 className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold tracking-wide text-violet-300">
                Platform Capabilities
              </span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              Everything You Need to{" "}
              <span className="gradient-text">Land Your First Role</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[var(--foreground-secondary)]">
              From intelligent matching to company insights, we give you an
              unfair advantage in your job search.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card group p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-secondary)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-white/[0.04] py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[var(--foreground-secondary)]">
              Get started in minutes. Our AI does the heavy lifting.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-[calc(50%+40px)] top-10 hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-indigo-500/30 to-transparent lg:block" />
                )}
                <div className="mb-4 inline-flex items-center justify-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                      <step.icon className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                      {step.step}
                    </div>
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section
        id="sources"
        className="relative z-10 border-t border-white/[0.04] py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="glass-card-static mx-auto max-w-4xl overflow-hidden p-10">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
                <Search className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide text-emerald-300">
                  Multi-Source Aggregation
                </span>
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Jobs From <span className="gradient-text">Trusted Sources</span>
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-[var(--foreground-secondary)]">
                We aggregate listings from official job boards and curated
                sources — no scraped or unreliable data.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {DATA_SOURCES.map((source) => (
                  <div
                    key={source}
                    className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-white/[0.04] py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Ready to Find Your{" "}
            <span className="gradient-text">Dream Role</span>?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-[var(--foreground-secondary)]">
            Join thousands of CS freshers who are getting smarter job
            recommendations.
          </p>
          <Link
            href="/register"
            className="btn-gradient group inline-flex items-center gap-2 rounded-2xl px-10 py-4 text-lg font-semibold"
          >
            <span className="relative z-10">Get Started for Free</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">
              Job<span className="gradient-text">Intel</span>
            </span>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Built with ❤️ for CS freshers. Open source project.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[var(--foreground-muted)] transition-colors hover:text-white"
            >
              <GitFork className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-[var(--foreground-muted)] transition-colors hover:text-white"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
