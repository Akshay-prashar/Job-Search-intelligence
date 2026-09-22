"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
  CalendarDays,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  college: string;
  branch: string;
  graduationYear: string;
}

interface FieldError {
  field: string;
  message: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    graduationYear: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    setFieldErrors((prev) => prev.filter((e) => e.field !== field));
  }

  function getFieldError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function validate(): boolean {
    const errors: FieldError[] = [];

    if (!formData.name.trim()) {
      errors.push({ field: "name", message: "Name is required" });
    }

    if (!formData.email.trim()) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push({ field: "email", message: "Enter a valid email address" });
    }

    if (!formData.password) {
      errors.push({ field: "password", message: "Password is required" });
    } else if (formData.password.length < 6) {
      errors.push({
        field: "password",
        message: "Password must be at least 6 characters",
      });
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    if (
      formData.graduationYear &&
      (isNaN(Number(formData.graduationYear)) ||
        Number(formData.graduationYear) < 2020 ||
        Number(formData.graduationYear) > 2035)
    ) {
      errors.push({
        field: "graduationYear",
        message: "Enter a year between 2020 and 2035",
      });
    }

    setFieldErrors(errors);
    return errors.length === 0;
  }

  // Password strength indicator
  function getPasswordStrength(): {
    label: string;
    color: string;
    width: string;
  } {
    const pw = formData.password;
    if (!pw) return { label: "", color: "", width: "0%" };
    if (pw.length < 6)
      return { label: "Weak", color: "bg-red-500", width: "25%" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [pw.length >= 8, hasUpper, hasNumber, hasSpecial].filter(
      Boolean
    ).length;
    if (score <= 1) return { label: "Fair", color: "bg-amber-500", width: "50%" };
    if (score <= 2)
      return { label: "Good", color: "bg-indigo-500", width: "75%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          college: formData.college.trim() || undefined,
          branch: formData.branch.trim() || undefined,
          graduationYear:"2025"
          // graduationYear: formData.graduationYear
          //   ? Number(formData.graduationYear)
          //   : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = getPasswordStrength();

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white mb-2">
          Create your account
        </h2>
        <p className="text-[var(--foreground-muted)]">
          Start your AI-powered job search journey
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card-static p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* ─── Section: Account Info ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">
                Account Details
              </h3>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Akshat Sharma"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={`input-base pl-10 ${getFieldError("name") ? "!border-red-500/50" : ""}`}
                />
              </div>
              {getFieldError("name") && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError("name")}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`input-base pl-10 ${getFieldError("email") ? "!border-red-500/50" : ""}`}
                />
              </div>
              {getFieldError("email") && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={`input-base pl-10 ${getFieldError("password") ? "!border-red-500/50" : ""}`}
                />
              </div>
              {/* Password strength bar */}
              {formData.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: pwStrength.width }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      pwStrength.label === "Strong"
                        ? "text-emerald-400"
                        : pwStrength.label === "Good"
                          ? "text-indigo-400"
                          : pwStrength.label === "Fair"
                            ? "text-amber-400"
                            : "text-red-400"
                    }`}
                  >
                    {pwStrength.label}
                  </span>
                </div>
              )}
              {getFieldError("password") && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError("password")}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  className={`input-base pl-10 ${getFieldError("confirmPassword") ? "!border-red-500/50" : ""}`}
                />
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
              </div>
              {getFieldError("confirmPassword") && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError("confirmPassword")}
                </p>
              )}
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="h-px bg-[var(--border)]" />

          {/* ─── Section: Academic Info ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">
                Academic Info
              </h3>
              <span className="text-xs text-[var(--foreground-muted)] ml-auto">
                Optional
              </span>
            </div>

            {/* College */}
            <div className="space-y-1.5">
              <label
                htmlFor="college"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                College / University
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                <input
                  id="college"
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. IIT Delhi"
                  value={formData.college}
                  onChange={(e) => updateField("college", e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>

            {/* Branch & Year row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div className="space-y-1.5">
                <label
                  htmlFor="branch"
                  className="block text-sm font-medium text-[var(--foreground-secondary)]"
                >
                  Branch / Major
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                  <input
                    id="branch"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.branch}
                    onChange={(e) => updateField("branch", e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Graduation Year */}
              <div className="space-y-1.5">
                <label
                  htmlFor="graduationYear"
                  className="block text-sm font-medium text-[var(--foreground-secondary)]"
                >
                  Graduation Year
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--foreground-muted)]" />
                  <input
                    id="graduationYear"
                    type="number"
                    min="2020"
                    max="2035"
                    placeholder="e.g. 2026"
                    value={formData.graduationYear}
                    onChange={(e) =>
                      updateField("graduationYear", e.target.value)
                    }
                    className={`input-base pl-10 ${getFieldError("graduationYear") ? "!border-red-500/50" : ""}`}
                  />
                </div>
                {getFieldError("graduationYear") && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {getFieldError("graduationYear")}
                  </p>
                )}
              </div>
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
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
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

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
        By creating an account, you agree to our{" "}
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
