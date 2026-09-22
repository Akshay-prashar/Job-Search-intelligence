'use client';

import React from 'react';
import {
  Code2,
  Server,
  Layers,
  Container,
  Database,
  Brain,
  Smartphone,
  GraduationCap,
  UserCheck,
  Briefcase,
  Wifi,
  Building2,
  MapPin,
  Leaf,
  GitBranch,
  Globe,
  PencilLine,
} from 'lucide-react';
import type { JobFilter } from '@/types/job';

interface JobFiltersProps {
  filters: JobFilter;
  onChange: (filters: JobFilter) => void;
}

interface FilterChipProps {
  label: string;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
      border transition-all duration-200 cursor-pointer select-none whitespace-nowrap
      ${
        active
          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]'
      }
    `}
  >
    {icon && <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>}
    {label}
  </button>
);

const ROLE_TYPES = [
  { value: 'frontend', label: 'Frontend', icon: <Code2 size={14} /> },
  { value: 'backend', label: 'Backend', icon: <Server size={14} /> },
  { value: 'fullstack', label: 'Fullstack', icon: <Layers size={14} /> },
  { value: 'devops', label: 'DevOps', icon: <Container size={14} /> },
  { value: 'data', label: 'Data', icon: <Database size={14} /> },
  { value: 'ml', label: 'ML / AI', icon: <Brain size={14} /> },
  { value: 'mobile', label: 'Mobile', icon: <Smartphone size={14} /> },
];

const EXPERIENCE_LEVELS = [
  { value: 'intern', label: 'Intern', icon: <GraduationCap size={14} /> },
  { value: 'entry', label: 'Entry Level', icon: <UserCheck size={14} /> },
  { value: 'junior', label: 'Junior', icon: <Briefcase size={14} /> },
];

const WORK_MODES = [
  { value: 'remote', label: 'Remote', icon: <Wifi size={14} /> },
  { value: 'hybrid', label: 'Hybrid', icon: <Building2 size={14} /> },
  { value: 'onsite', label: 'Onsite', icon: <MapPin size={14} /> },
];

const SOURCES = [
  { value: 'greenhouse', label: 'Greenhouse', icon: <Leaf size={14} /> },
  { value: 'lever', label: 'Lever', icon: <Globe size={14} /> },
  { value: 'github', label: 'GitHub', icon: <GitBranch size={14} /> },
  { value: 'manual', label: 'Manual', icon: <PencilLine size={14} /> },
];

function toggleFilter(current: string[] | undefined, value: string): string[] {
  const arr = current ?? [];
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export const JobFilters: React.FC<JobFiltersProps> = ({ filters, onChange }) => {
  const toggle = (key: keyof JobFilter, value: string) => {
    onChange({
      ...filters,
      [key]: toggleFilter(filters[key] as string[] | undefined, value),
    });
  };

  const activeCount =
    (filters.roleType?.length ?? 0) +
    (filters.experienceLevel?.length ?? 0) +
    (filters.remoteType?.length ?? 0) +
    (filters.source?.length ?? 0);

  const clearAll = () =>
    onChange({ ...filters, roleType: [], experienceLevel: [], remoteType: [], source: [] });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Section: Role Type */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">
          Role Type
        </h4>
        <div className="flex flex-wrap gap-2">
          {ROLE_TYPES.map((r) => (
            <FilterChip
              key={r.value}
              label={r.label}
              icon={r.icon}
              active={filters.roleType?.includes(r.value) ?? false}
              onClick={() => toggle('roleType', r.value)}
            />
          ))}
        </div>
      </div>

      {/* Section: Experience Level */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">
          Experience
        </h4>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((e) => (
            <FilterChip
              key={e.value}
              label={e.label}
              icon={e.icon}
              active={filters.experienceLevel?.includes(e.value) ?? false}
              onClick={() => toggle('experienceLevel', e.value)}
            />
          ))}
        </div>
      </div>

      {/* Section: Work Mode */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">
          Work Mode
        </h4>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.map((w) => (
            <FilterChip
              key={w.value}
              label={w.label}
              icon={w.icon}
              active={filters.remoteType?.includes(w.value) ?? false}
              onClick={() => toggle('remoteType', w.value)}
            />
          ))}
        </div>
      </div>

      {/* Section: Source */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">
          Source
        </h4>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <FilterChip
              key={s.value}
              label={s.label}
              icon={s.icon}
              active={filters.source?.includes(s.value) ?? false}
              onClick={() => toggle('source', s.value)}
            />
          ))}
        </div>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
};
