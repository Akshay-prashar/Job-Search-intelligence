'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Wifi,
  Building2,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import type { Job } from '@/types/job';
import type { JobMatch } from '@/types/match';
import { MatchScoreBadge } from '@/components/jobs/MatchScoreBadge';
import { formatDate } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  match?: JobMatch | null;
  companyName?: string;
  layout?: 'grid' | 'list';
}

const remoteBadgeMap: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  remote: { label: 'Remote', icon: <Wifi size={12} />, cls: 'badge badge-success' },
  hybrid: { label: 'Hybrid', icon: <Building2 size={12} />, cls: 'badge badge-warning' },
  onsite: { label: 'Onsite', icon: <MapPin size={12} />, cls: 'badge badge-ghost' },
  unknown: { label: 'Unknown', icon: <Briefcase size={12} />, cls: 'badge badge-ghost' },
};

const avatarColors = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  match,
  companyName,
  layout = 'grid',
}) => {
  const company = companyName ?? 'Company';
  const initial = company.charAt(0).toUpperCase();
  const colorGrad = getAvatarColor(company);
  const badge = remoteBadgeMap[job.remoteType] ?? remoteBadgeMap.unknown;

  const isGrid = layout === 'grid';

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div
        className={`
          glass-card p-5 h-full flex
          ${isGrid ? 'flex-col gap-4' : 'flex-row items-center gap-5'}
        `}
      >
        {/* Top row: avatar + score */}
        <div className={`flex items-start gap-3 ${isGrid ? '' : 'flex-1 min-w-0'}`}>
          {/* Company avatar */}
          <div
            className={`
              flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${colorGrad}
              flex items-center justify-center text-white font-bold text-lg
              shadow-lg
            `}
          >
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-indigo-300 transition-colors">
              {job.jobTitle}
            </h3>
            {/* Company */}
            <p className="text-xs text-[var(--foreground-secondary)] truncate mt-0.5">
              {company}
            </p>
          </div>

          {/* Match score */}
          {match && (
            <div className="flex-shrink-0 ml-auto">
              <MatchScoreBadge score={match.matchScore} size="sm" />
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className={`flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] ${isGrid ? '' : 'flex-shrink-0'}`}>
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </span>
          )}
          <span className={badge.cls}>
            {badge.icon}
            <span className="ml-1">{badge.label}</span>
          </span>
          {job.postedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {formatDate(job.postedAt)}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.skillsJson.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${isGrid ? 'mt-auto pt-1' : ''}`}>
            {job.skillsJson.slice(0, isGrid ? 4 : 6).map((skill) => (
              <span key={skill} className="badge badge-primary text-[10px] py-0.5 px-2">
                {skill}
              </span>
            ))}
            {job.skillsJson.length > (isGrid ? 4 : 6) && (
              <span className="badge badge-ghost text-[10px] py-0.5 px-2">
                +{job.skillsJson.length - (isGrid ? 4 : 6)}
              </span>
            )}
          </div>
        )}

        {/* Apply link hint (list only) */}
        {!isGrid && job.applyUrl && (
          <div className="flex-shrink-0">
            <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={16} />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
