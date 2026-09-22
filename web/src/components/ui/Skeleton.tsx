import React from 'react'
import { cn } from '@/lib/utils'

type SkeletonVariant = 'text' | 'circle' | 'card' | 'rectangle'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  lines?: number // for 'text' variant: number of lines to render
}

const variantDefaults: Record<SkeletonVariant, { width: string; height: string; extra: string }> = {
  text: { width: '100%', height: '0.875rem', extra: 'rounded-md' },
  circle: { width: '3rem', height: '3rem', extra: 'rounded-full' },
  card: { width: '100%', height: '10rem', extra: 'rounded-[var(--radius-xl)]' },
  rectangle: { width: '100%', height: '3rem', extra: 'rounded-[var(--radius-md)]' },
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
  lines = 1,
}) => {
  const defaults = variantDefaults[variant]

  const resolvedWidth = width
    ? typeof width === 'number' ? `${width}px` : width
    : defaults.width

  const resolvedHeight = height
    ? typeof height === 'number' ? `${height}px` : height
    : defaults.height

  // Text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('skeleton', defaults.extra)}
            style={{
              width: i === lines - 1 ? '75%' : resolvedWidth,
              height: resolvedHeight,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('skeleton', defaults.extra, className)}
      style={{ width: resolvedWidth, height: resolvedHeight }}
    />
  )
}
