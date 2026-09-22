'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react'

/* ─── Types ──────────────────────────────── */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

/* ─── Context ────────────────────────────── */

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/* ─── Hook ───────────────────────────────── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

/* ─── Visual helpers ─────────────────────── */

const toastConfig: Record<
  ToastType,
  { icon: React.ReactNode; border: string; bg: string; text: string }
> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-[var(--success)]" />,
    border: 'border-[var(--success)]/30',
    bg: 'bg-[rgba(16,185,129,0.08)]',
    text: 'text-[var(--success)]',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-[var(--danger)]" />,
    border: 'border-[var(--danger)]/30',
    bg: 'bg-[rgba(239,68,68,0.08)]',
    text: 'text-[var(--danger)]',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />,
    border: 'border-[var(--warning)]/30',
    bg: 'bg-[rgba(245,158,11,0.08)]',
    text: 'text-[var(--warning)]',
  },
  info: {
    icon: <Info className="w-5 h-5 text-[var(--info)]" />,
    border: 'border-[var(--info)]/30',
    bg: 'bg-[rgba(59,130,246,0.08)]',
    text: 'text-[var(--info)]',
  },
}

/* ─── Single Toast Item ──────────────────── */

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const cfg = toastConfig[toast.type]
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 200)
  }, [onDismiss, toast.id])

  useEffect(() => {
    const dur = toast.duration ?? 5000
    timerRef.current = setTimeout(dismiss, dur)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [dismiss, toast.duration])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-80 px-4 py-3 rounded-[var(--radius-lg)]',
        'border backdrop-blur-md shadow-[var(--shadow-lg)]',
        'bg-[var(--surface-elevated)]',
        cfg.border,
        exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      )}
      style={exiting ? { animation: 'slideInRight 0.2s ease-in reverse forwards' } : undefined}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{cfg.icon}</div>
      <p className="flex-1 text-sm text-[var(--foreground)] leading-snug">{toast.message}</p>
      <button
        onClick={dismiss}
        className="shrink-0 p-0.5 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ─── Provider ───────────────────────────── */

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, type, message, duration }])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container — top-right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
