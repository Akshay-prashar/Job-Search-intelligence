"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Building, GraduationCap, Hash, Globe, GitFork, Link2, Save, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SKILL_CATEGORIES, WORK_MODES } from "@/lib/constants";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", college: "", branch: "", graduationYear: 2025, cgpa: 0,
    targetRoles: [] as string[], preferredLocations: [] as string[], preferredWorkMode: "any",
    headline: "", bio: "", githubUrl: "", linkedinUrl: "", portfolioUrl: "",
    skillsJson: [] as { name: string; level: string; category: string }[],
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data.user) {
          setForm({
            name: data.user.name || "", email: data.user.email || "",
            college: data.user.college || "", branch: data.user.branch || "",
            graduationYear: data.user.graduationYear || 2025, cgpa: data.user.cgpa || 0,
            targetRoles: data.user.targetRoles || [], preferredLocations: data.user.preferredLocations || [],
            preferredWorkMode: data.user.preferredWorkMode || "any",
            headline: data.user.profile?.headline || "", bio: data.user.profile?.bio || "",
            githubUrl: data.user.profile?.githubUrl || "", linkedinUrl: data.user.profile?.linkedinUrl || "",
            portfolioUrl: data.user.profile?.portfolioUrl || "",
            skillsJson: data.user.profile?.skillsJson || [],
          });
          setSelectedSkills((data.user.profile?.skillsJson || []).map((s: any) => s.name || s));
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const skillsPayload = selectedSkills.map(name => {
      const category = Object.entries(SKILL_CATEGORIES).find(([, skills]) => skills.includes(name.toLowerCase()))?.[0] || "Other";
      return { name, level: "intermediate", category };
    });
    try {
      await fetch("/api/users/me", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skillsJson: skillsPayload }),
      });
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const addLocation = () => {
    if (locationInput.trim() && !form.preferredLocations.includes(locationInput.trim())) {
      setForm(f => ({ ...f, preferredLocations: [...f.preferredLocations, locationInput.trim()] }));
      setLocationInput("");
    }
  };

  const roleOptions = ["frontend", "backend", "fullstack", "devops", "data", "ml", "mobile"];

  if (loading) return <div className="mx-auto max-w-3xl space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">Manage your information for better job matches</p>
        </div>
        <div className="flex gap-2">
          {saved && <span className="flex items-center gap-1 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Saved!</span>}
          {editing ? (
            <Button variant="primary" loading={saving} onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><User className="h-4 w-4 text-indigo-400" /> Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Full Name</label>
            <input className="input-base" value={form.name} disabled={!editing} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Email</label>
            <input className="input-base opacity-60" value={form.email} disabled /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">College</label>
            <input className="input-base" value={form.college} disabled={!editing} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Branch</label>
            <input className="input-base" value={form.branch} disabled={!editing} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Graduation Year</label>
            <input type="number" className="input-base" value={form.graduationYear} disabled={!editing} onChange={e => setForm(f => ({ ...f, graduationYear: parseInt(e.target.value) }))} /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">CGPA</label>
            <input type="number" step="0.1" className="input-base" value={form.cgpa || ""} disabled={!editing} onChange={e => setForm(f => ({ ...f, cgpa: parseFloat(e.target.value) }))} /></div>
        </div>
      </div>

      {/* Bio & Links */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Globe className="h-4 w-4 text-violet-400" /> Bio & Links</h3>
        <div className="space-y-4">
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Headline</label>
            <input className="input-base" placeholder="e.g. Aspiring Full Stack Developer" value={form.headline} disabled={!editing} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Bio</label>
            <textarea className="input-base min-h-[80px] resize-y" placeholder="Tell us about yourself..." value={form.bio} disabled={!editing} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">GitHub</label>
              <input className="input-base" placeholder="https://github.com/..." value={form.githubUrl} disabled={!editing} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">LinkedIn</label>
              <input className="input-base" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} disabled={!editing} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs text-[var(--foreground-muted)]">Portfolio</label>
              <input className="input-base" placeholder="https://..." value={form.portfolioUrl} disabled={!editing} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))} /></div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Hash className="h-4 w-4 text-emerald-400" /> Skills</h3>
        <p className="mb-4 text-xs text-[var(--foreground-muted)]">Select skills you&apos;re proficient in ({selectedSkills.length} selected)</p>
        <div className="space-y-4">
          {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{category}</p>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => {
                  const isSelected = selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                  return (
                    <button key={skill} disabled={!editing} onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        isSelected ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300" : "border-white/[0.08] bg-white/[0.03] text-[var(--foreground-muted)] hover:border-white/[0.15]"
                      } ${!editing ? "cursor-default opacity-60" : "cursor-pointer"}`}
                    >{skill}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><GraduationCap className="h-4 w-4 text-amber-400" /> Job Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-[var(--foreground-muted)]">Target Roles</label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map(role => (
                <button key={role} disabled={!editing} onClick={() => setForm(f => ({ ...f, targetRoles: f.targetRoles.includes(role) ? f.targetRoles.filter(r => r !== role) : [...f.targetRoles, role] }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                    form.targetRoles.includes(role) ? "border-violet-500/30 bg-violet-500/15 text-violet-300" : "border-white/[0.08] bg-white/[0.03] text-[var(--foreground-muted)]"
                  } ${!editing ? "cursor-default" : "cursor-pointer"}`}
                >{role}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs text-[var(--foreground-muted)]">Preferred Locations</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.preferredLocations.map(loc => (
                <span key={loc} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--foreground-secondary)]">
                  {loc}
                  {editing && <button onClick={() => setForm(f => ({ ...f, preferredLocations: f.preferredLocations.filter(l => l !== loc) }))} className="text-[var(--foreground-muted)] hover:text-rose-400">×</button>}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input className="input-base flex-1" placeholder="Add location..." value={locationInput} onChange={e => setLocationInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLocation())} />
                <Button variant="outline" size="sm" onClick={addLocation}>Add</Button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs text-[var(--foreground-muted)]">Work Mode</label>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map(mode => (
                <button key={mode.value} disabled={!editing} onClick={() => setForm(f => ({ ...f, preferredWorkMode: mode.value }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    form.preferredWorkMode === mode.value ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300" : "border-white/[0.08] bg-white/[0.03] text-[var(--foreground-muted)]"
                  } ${!editing ? "cursor-default" : "cursor-pointer"}`}
                >{mode.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
