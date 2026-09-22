import React from 'react'
import { cn } from '@/lib/utils'

type ProgressColor = 'primary' | 'success' | 'warning' | 'danger'
type ProgressSize = 'sm' | 'md'

interface ProgressBarProps {
  value: number
  color?: ProgressColor
  size?: ProgressSize
  showLabel?: boolean
  className?: string
}

const trackSizes: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
}

const fillGradients: Record<ProgressColor, string> = {
  primary: 'bg-gradient-to-r from-indigo-600 to-violet-500',
  success: 'bg-gradient-to-r from-emerald-600 to-teal-400',
  warning: 'bg-gradient-to-r from-amber-600 to-yellow-400',
  danger: 'bg-gradient-to-r from-rose-600 to-red-400',
}

const glowColors: Record<ProgressColor, string> = {
  primary: 'shadow-[0_0_8px_var(--primary-glow)]',
  success: 'shadow-[0_0_8px_var(--success-glow)]',
  warning: 'shadow-[0_0_8px_var(--warning-glow)]',
  danger: 'shadow-[0_0_8px_var(--danger-glow)]',
}

const labelColors: Record<ProgressColor, string> = {
  primary: 'text-indigo-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-rose-400',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--foreground-muted)]">Progress</span>
          <span className={cn('text-xs font-semibold', labelColors[color])}>{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-[var(--surface)] overflow-hidden',
          trackSizes[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            fillGradients[color],
            clamped > 0 && glowColors[color]
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
