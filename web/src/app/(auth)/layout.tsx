import type { Metadata } from "next";
import { Briefcase, Sparkles, Target, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "JobIntel — Sign In or Create Account",
  description:
    "Access your Job Intelligence Platform account. AI-powered job matching, resume parsing, and smart recommendations for CS freshers.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--background)]">
      {/* ─── Left Panel: Branding & Mesh Background ─── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col items-center justify-center overflow-hidden">
        {/* Mesh background blobs */}
        <div className="mesh-bg">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
        </div>

        {/* Animated grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center max-w-lg">
          {/* Logo mark */}
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Brand name */}
          <h1
            className="text-5xl font-bold tracking-tight mb-4 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <span className="gradient-text">JobIntel</span>
          </h1>

          {/* Tagline */}
          <p
            className="text-lg text-[var(--foreground-secondary)] leading-relaxed mb-12 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            AI-powered job intelligence for CS freshers.
            <br />
            <span className="text-[var(--foreground-muted)]">
              Discover, match, and land your dream role.
            </span>
          </p>

          {/* Feature pills */}
          <div
            className="flex flex-col gap-3 w-full max-w-sm animate-fade-in-up"
            style={{ animationDelay: "350ms" }}
          >
            {[
              {
                icon: Sparkles,
                text: "Smart Resume Parsing",
                color: "indigo",
              },
              {
                icon: Target,
                text: "AI-Matched Job Recommendations",
                color: "violet",
              },
              {
                icon: TrendingUp,
                text: "Explainable Match Scores",
                color: "purple",
              },
            ].map(({ icon: Icon, text, color }) => (
              <div
                key={text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface-glass)] border border-[var(--border)] backdrop-blur-sm"
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${color}-500/10`}
                >
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <span className="text-sm text-[var(--foreground-secondary)]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <p className="absolute bottom-6 text-xs text-[var(--foreground-muted)]">
          © {new Date().getFullYear()} JobIntel — Built for ambitious freshers
        </p>
      </div>

      {/* ─── Mobile Branding (shown only on small screens) ─── */}
      <div className="lg:hidden flex flex-col items-center pt-10 pb-4 px-6">
        <div className="mesh-bg">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">JobIntel</span>
          </h1>
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          AI-powered job intelligence for CS freshers
        </p>
      </div>

      {/* ─── Right Panel: Form Area ─── */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-8 lg:px-12 lg:py-12">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
