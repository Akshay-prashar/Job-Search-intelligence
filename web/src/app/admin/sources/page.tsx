"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface SourceFeed {
  id: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  active: boolean;
  fetchFrequency: string;
  lastFetchedAt: string | null;
  trustLevel: string;
  createdAt: string;
  _count?: { rawIngestions: number };
}

const SOURCE_TYPES = [
  { value: "greenhouse", label: "Greenhouse", color: "text-emerald-400 bg-emerald-500/15" },
  { value: "lever", label: "Lever", color: "text-indigo-400 bg-indigo-500/15" },
  { value: "github", label: "GitHub", color: "text-violet-400 bg-violet-500/15" },
  { value: "hn", label: "Hacker News", color: "text-orange-400 bg-orange-500/15" },
  { value: "rss", label: "RSS Feed", color: "text-teal-400 bg-teal-500/15" },
  { value: "manual", label: "Manual", color: "text-amber-400 bg-amber-500/15" },
];

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<SourceFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState({ sourceName: "", sourceType: "greenhouse", sourceUrl: "", fetchFrequency: "daily" });

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function addSource() {
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewSource({ sourceName: "", sourceType: "greenhouse", sourceUrl: "", fetchFrequency: "daily" });
        fetchSources();
      }
    } catch {}
  }

  const getSourceStyle = (type: string) =>
    SOURCE_TYPES.find((s) => s.value === type)?.color || "text-slate-400 bg-white/5";

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" /> Source Feeds
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {sources.length} source feeds configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSources}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Source
          </Button>
        </div>
      </div>

      {/* Source List */}
      {sources.length === 0 ? (
        <div className="glass-card-static py-16 text-center">
          <Database className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
          <h3 className="mt-4 text-lg font-semibold text-white">No source feeds configured</h3>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Add your first data source to start ingesting jobs.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Source
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="glass-card-static flex items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getSourceStyle(source.sourceType)}`}>
                  {source.sourceType}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">
                    {source.sourceName || `${source.sourceType} feed`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                    {source.sourceUrl && <span className="truncate max-w-[200px]">{source.sourceUrl}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {source.fetchFrequency}
                    </span>
                    <span>{source._count?.rawIngestions || 0} ingestions</span>
                    {source.lastFetchedAt && (
                      <span>Last: {new Date(source.lastFetchedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {source.active ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Source Feed" size="md">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Source Name</label>
            <input
              className="input-base"
              placeholder="e.g. Stripe Greenhouse, Cloudflare Lever"
              value={newSource.sourceName}
              onChange={(e) => setNewSource((s) => ({ ...s, sourceName: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Source Type</label>
            <select
              value={newSource.sourceType}
              onChange={(e) => setNewSource((s) => ({ ...s, sourceType: e.target.value }))}
              className="input-base"
            >
              {SOURCE_TYPES.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Source URL</label>
            <input
              className="input-base"
              placeholder="https://boards-api.greenhouse.io/v1/boards/stripe/jobs"
              value={newSource.sourceUrl}
              onChange={(e) => setNewSource((s) => ({ ...s, sourceUrl: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Fetch Frequency</label>
            <select
              value={newSource.fetchFrequency}
              onChange={(e) => setNewSource((s) => ({ ...s, fetchFrequency: e.target.value }))}
              className="input-base"
            >
              <option value="hourly">Every 6 Hours</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={addSource}>
              <Plus className="mr-1 h-4 w-4" /> Add Source
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
