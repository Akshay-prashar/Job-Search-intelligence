"use client";

import React, { useState } from "react";
import { Settings, User, Shield, Bell, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [notifications, setNotifications] = useState({ newMatches: true, applicationUpdates: true, weeklyDigest: false, staleJobs: true });

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    try {
      await fetch("/api/privacy/delete-account", { method: "DELETE" });
      window.location.href = "/";
    } catch {}
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="h-5 w-5 text-indigo-400" /> Settings</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">Manage your account preferences and privacy</p>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Bell className="h-4 w-4 text-violet-400" /> Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "newMatches", label: "New Job Matches", desc: "Get notified when new high-match jobs are found" },
            { key: "applicationUpdates", label: "Application Updates", desc: "Reminders for follow-ups and status changes" },
            { key: "weeklyDigest", label: "Weekly Digest", desc: "Weekly summary of new jobs and insights" },
            { key: "staleJobs", label: "Stale Job Alerts", desc: "Notifications when saved jobs are about to expire" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative h-6 w-11 rounded-full transition-all ${
                  notifications[item.key as keyof typeof notifications] ? "bg-indigo-500" : "bg-white/10"
                }`}
              >
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  notifications[item.key as keyof typeof notifications] ? "left-[22px]" : "left-0.5"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="glass-card-static p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Shield className="h-4 w-4 text-emerald-400" /> Privacy & Data</h3>
        <div className="space-y-3 text-sm text-[var(--foreground-secondary)]">
          <p><strong className="text-white">Data We Store:</strong> Your profile info, uploaded resume text, parsed skills/education/projects, embedding vectors, saved jobs, and application tracking data.</p>
          <p><strong className="text-white">What We Don&apos;t Do:</strong> We never share your data externally, sell information, or use your data for training models.</p>
          <p><strong className="text-white">Your Rights:</strong> You can delete your resume, parsed data, or your entire account at any time. All deletions are permanent and immediate.</p>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" size="sm" onClick={() => alert("Resume deletion would happen here")}>Delete Resume Data</Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-rose-400"><AlertTriangle className="h-4 w-4" /> Danger Zone</h3>
        <p className="mb-4 text-sm text-[var(--foreground-secondary)]">
          Once you delete your account, all your data will be permanently removed. This includes your profile, resume, applications, saved jobs, and match history. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-400 font-medium">⚠️ This will permanently delete:</p>
            <ul className="mt-2 space-y-1 text-xs text-rose-300">
              <li>• Your profile and personal information</li>
              <li>• Your resume and all parsed data</li>
              <li>• All applications and saved jobs</li>
              <li>• Match history and preferences</li>
            </ul>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--foreground-secondary)]">Type <strong className="text-white">DELETE</strong> to confirm</label>
            <input className="input-base" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button variant="danger" className="flex-1" disabled={deleteConfirm !== "DELETE"} onClick={handleDeleteAccount}>
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
