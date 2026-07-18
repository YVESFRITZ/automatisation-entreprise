import { useEffect, type ReactNode } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { Sparkline } from './Charts'

// ── Modal / feuille responsive ──────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-pop" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-bg-card border border-line rounded-t-3xl sm:rounded-3xl shadow-nav max-h-[92vh] flex flex-col animate-fade-up safe-bottom">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg-hover text-ink3">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

// ── Carte de statistique ────────────────────────────────────────────
const ACCENT_HEX: Record<string, string> = {
  brand: '#F24B5E',
  ok: '#12A150',
  danger: '#F0433A',
  info: '#2F6BF6',
  warn: '#F79009',
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'brand',
  trendPct,
  spark,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  accent?: 'brand' | 'ok' | 'danger' | 'info' | 'warn'
  trendPct?: number | null
  spark?: number[]
}) {
  const ring: Record<string, string> = {
    brand: 'text-brand-soft bg-brand/10',
    ok: 'text-ok bg-ok/10',
    danger: 'text-danger bg-danger/10',
    info: 'text-azure bg-azure/10',
    warn: 'text-warn bg-warn/10',
  }
  const up = (trendPct ?? 0) >= 0
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink3">{label}</span>
        {icon && <span className={`grid place-items-center w-9 h-9 rounded-xl ${ring[accent]}`}>{icon}</span>}
      </div>
      <div className="mt-2.5 text-2xl font-extrabold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="text-xs font-medium text-ink3">
          {trendPct != null ? (
            <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-ok' : 'text-danger'}`}>
              {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {up ? '+' : ''}{trendPct.toFixed(0)}%
              <span className="text-ink4 font-normal">/ mois préc.</span>
            </span>
          ) : (
            sub
          )}
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} color={ACCENT_HEX[accent]} width={72} height={28} />}
      </div>
    </div>
  )
}

// ── État vide ───────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="card p-8 sm:p-10 text-center flex flex-col items-center gap-3">
      <div className="w-16 h-16 grid place-items-center rounded-2xl bg-brand/10 text-brand-soft">{icon}</div>
      <div>
        <p className="font-bold text-ink text-lg">{title}</p>
        {hint && <p className="text-sm text-ink3 mt-1.5 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Contrôle segmenté ───────────────────────────────────────────────
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
}) {
  return (
    <div className="inline-flex p-1 rounded-full bg-bg-soft border border-line gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
            value === o.value ? 'bg-bg-card text-ink shadow-soft' : 'text-ink3 hover:text-ink'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink4 mt-1.5">{hint}</p>}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink3 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
