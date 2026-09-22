'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null

  const pages = getVisiblePages(currentPage, totalPages)

  const btnBase =
    'inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer'

  return (
    <nav className={cn('flex items-center gap-1.5', className)} aria-label="Pagination">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          btnBase,
          'text-[var(--foreground-secondary)] hover:bg-white/5 hover:text-[var(--foreground)]',
          'disabled:opacity-30 disabled:pointer-events-none'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 inline-flex items-center justify-center text-[var(--foreground-muted)] text-sm select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              btnBase,
              p === currentPage
                ? 'bg-[var(--primary)] text-white shadow-md shadow-indigo-600/20'
                : 'text-[var(--foreground-secondary)] hover:bg-white/5 hover:text-[var(--foreground)]'
            )}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          btnBase,
          'text-[var(--foreground-secondary)] hover:bg-white/5 hover:text-[var(--foreground)]',
          'disabled:opacity-30 disabled:pointer-events-none'
        )}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
