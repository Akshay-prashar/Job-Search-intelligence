"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
        <p className="text-[var(--foreground-muted)]">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card-static p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--foreground-secondary)]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                Password
              </label>
              <button
                type="button"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Register link */}
        <div className="text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Create one
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
        By signing in, you agree to our{" "}
        <span className="text-[var(--foreground-secondary)] hover:text-indigo-400 transition-colors cursor-pointer">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="text-[var(--foreground-secondary)] hover:text-indigo-400 transition-colors cursor-pointer">
          Privacy Policy
        </span>
      </p>
    </div>
  );
}
