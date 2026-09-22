import React from 'react'
import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const strokeWidthMap: Record<SpinnerSize, number> = {
  sm: 3,
  md: 2.5,
  lg: 2.5,
  xl: 2,
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <div className={cn('inline-flex items-center justify-center', className)} role="status" aria-label="Loading">
      <svg
        className={cn('animate-spin', sizeMap[size])}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--border)"
          strokeWidth={strokeWidthMap[size]}
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--primary)"
          strokeWidth={strokeWidthMap[size]}
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
