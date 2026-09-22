'use client';

import React from 'react';

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 40, stroke: 3, fontSize: '0.65rem', radius: 16 },
  md: { width: 56, stroke: 3.5, fontSize: '0.8rem', radius: 22 },
  lg: { width: 80, stroke: 4, fontSize: '1.1rem', radius: 32 },
};

function getScoreColor(score: number) {
  if (score >= 90) return { stroke: '#10b981', text: '#34d399', glow: 'rgba(16,185,129,0.25)', label: 'Excellent' };
  if (score >= 80) return { stroke: '#6366f1', text: '#818cf8', glow: 'rgba(99,102,241,0.25)', label: 'Great' };
  if (score >= 70) return { stroke: '#8b5cf6', text: '#a78bfa', glow: 'rgba(139,92,246,0.25)', label: 'Good' };
  return { stroke: '#f59e0b', text: '#fbbf24', glow: 'rgba(245,158,11,0.25)', label: 'Fair' };
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const config = sizeConfig[size];
  const color = getScoreColor(clamped);
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        className="score-ring"
        style={{ width: config.width, height: config.width }}
      >
        <svg width={config.width} height={config.width}>
          {/* Background track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke="rgba(100,100,130,0.15)"
            strokeWidth={config.stroke}
          />
          {/* Score arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 6px ${color.glow})`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </svg>
        <span
          className="score-value font-bold"
          style={{ color: color.text, fontSize: config.fontSize }}
        >
          {clamped}
        </span>
      </div>
      {showLabel && (
        <span
          className="text-xs font-medium"
          style={{ color: color.text }}
        >
          {color.label}
        </span>
      )}
    </div>
  );
};
