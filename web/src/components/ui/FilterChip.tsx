'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  count?: number
  className?: string
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active = false,
  onClick,
  count,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium',
        'border transition-all cursor-pointer select-none',
        active
          ? 'bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--primary-hover)] shadow-[0_0_12px_var(--primary-glow)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]',
        className
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-semibold',
            active
              ? 'bg-[var(--primary)] text-white'
              : 'bg-white/5 text-[var(--foreground-muted)]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
