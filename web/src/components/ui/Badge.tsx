import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'ghost'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  className?: string
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.65rem]',
  md: '', // default sizing from .badge CSS class
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'badge',
        `badge-${variant}`,
        size === 'sm' && sizeClasses.sm,
        className
      )}
    >
      {children}
    </span>
  )
}
