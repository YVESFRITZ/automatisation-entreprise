import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  Megaphone,
  ChevronRight,
  Scale,
} from 'lucide-react'
import { subMonths, format } from 'date-fns'
import { useApp } from '../lib/store'
import { money, monthKey, nowISO, dateLabel, dateTimeLabel, initials } from '../lib/format'
import { StatCard } from '../components/ui'
import { Sparkline } from '../components/Charts'
import { PLATFORM_LABELS, type Platform } from '../lib/types'

export default function Dashboard() {
  const { data, settings } = useApp()
  const navigate = useNavigate()
  const currency = settings.currency
  const thisMonth = monthKey(nowISO())

  // Série des 6 derniers mois
  const series = useMemo(() => {
    const base = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(base, 5 - i)
      const key = format(d, 'yyyy-MM')
      const tx = data.transactions.filter((t) => monthKey(t.date) === key)
      const entree = tx.filter((t) => t.type === 'entree').reduce((s, t) => s + t.amount, 0)
      const sortie = tx.filter((t) => t.type === 'sortie').reduce((s, t) => s + t.amount, 0)
      return { entree, sortie, net: entree - sortie }
    })
  }, [data.transactions])

  const stats = useMemo(() => {
    const monthTx = data.transactions.filter((t) => monthKey(t.date) === thisMonth)
    const entree = monthTx.filter((t) => t.type === 'entree').reduce((s, t) => s + t.amount, 0)
    const sortie = monthTx.filter((t) => t.type === 'sortie').reduce((s, t) => s + t.amount, 0)
    const relance = data.prospects.filter((p) => p.status === 'relance' || p.status === 'nouveau').length
    const programmes = data.posts.filter((p) => p.status === 'programme').length
    const prev = series[series.length - 2] ?? { entree: 0, net: 0 }
    const pct = (cur: number, before: number) => (before ? Math.round(((cur - before) / Math.abs(before)) * 100) : null)
    return {
      entree,
      sortie,
      net: entree - sortie,
      relance,
      programmes,
      entreeTrend: pct(entree, prev.entree),
      netTrend: pct(entree - sortie, prev.net),
    }
  }, [data, thisMonth, series])

  const recentTx = useMemo(
    () => [...data.transactions].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)).slice(0, 5),
    [data.transactions],
  )
  const upcoming = useMemo(
    () =>
      data.posts
        .filter((p) => p.status === 'programme')
        .sort((a, b) => ((a.scheduledAt ?? '') > (b.scheduledAt ?? '') ? 1 : -1))
        .slice(0, 3),
    [data.posts],
  )
  const toFollow = useMemo(
    () => data.prospects.filter((p) => p.status === 'relance' || p.status === 'nouveau').slice(0, 3),
    [data.prospects],
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const netPositive = stats.net >= 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wider text-ink4">{greeting}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{settings.businessName || 'Mon Entreprise'}</h1>
      </div>

      {/* Solde du mois — carte principale premium */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-nav text-white"
        style={{ backgroundImage: 'linear-gradient(135deg,#1B2942 0%,#0F1728 55%,#0B111E 100%)' }}
      >
        <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-azure/25 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-white/55">Solde du mois</p>
            {stats.netTrend != null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${netPositive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                {stats.netTrend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {stats.netTrend >= 0 ? '+' : ''}{stats.netTrend}%
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[2.5rem] sm:text-5xl font-extrabold tracking-tight tabular-nums leading-none">
            {money(stats.net, currency)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <ArrowDownLeft size={15} className="text-emerald-300" />
              <span className="text-white/90">{money(stats.entree, currency)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <ArrowUpRight size={15} className="text-rose-300" />
              <span className="text-white/90">{money(stats.sortie, currency)}</span>
            </span>
          </div>
          <div className="mt-5 h-12">
            <Sparkline full data={series.map((s) => s.net)} color={netPositive ? '#6EE7B7' : '#FDA4AF'} height={48} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Entrées (mois)" value={money(stats.entree, currency)} icon={<TrendingUp size={18} />} accent="ok" trendPct={stats.entreeTrend} spark={series.map((s) => s.entree)} />
        <StatCard label="Bénéfice net" value={money(stats.net, currency)} icon={<Scale size={18} />} accent={netPositive ? 'ok' : 'danger'} trendPct={stats.netTrend} spark={series.map((s) => s.net)} />
        <StatCard label="À relancer" value={String(stats.relance)} sub="prospects" icon={<Users size={18} />} accent="warn" />
        <StatCard label="Posts programmés" value={String(stats.programmes)} sub="à venir" icon={<Clock size={18} />} accent="info" />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction icon={<ArrowDownLeft size={18} />} label="Entrée" onClick={() => navigate('/caisse')} tone="ok" />
        <QuickAction icon={<ArrowUpRight size={18} />} label="Sortie" onClick={() => navigate('/caisse')} tone="danger" />
        <QuickAction icon={<MessageCircle size={18} />} label="Prospect" onClick={() => navigate('/prospects')} tone="brand" />
        <QuickAction icon={<Megaphone size={18} />} label="Post" onClick={() => navigate('/reseaux')} tone="info" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dernières opérations */}
        <div>
          <SectionHead title="Dernières opérations" onSee={() => navigate('/caisse')} />
          {recentTx.length === 0 ? (
            <p className="text-sm text-ink3 card p-4">Aucune opération pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((t) => (
                <div key={t.id} className="card px-3.5 py-2.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${t.type === 'entree' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>
                    {t.type === 'entree' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{t.label || t.category}</p>
                    <p className="text-xs text-ink3">{dateLabel(t.date)}</p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${t.type === 'entree' ? 'text-ok' : 'text-danger'}`}>
                    {t.type === 'entree' ? '+' : '−'}{money(t.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <div>
            <SectionHead title="Prochains posts" onSee={() => navigate('/reseaux')} />
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink3 card p-4">Aucun post programmé.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((p) => (
                  <div key={p.id} className="card px-3.5 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      {p.platforms.map((pl: Platform) => (
                        <span key={pl} className="text-[11px] font-semibold text-ink3">{PLATFORM_LABELS[pl]}</span>
                      ))}
                      {p.scheduledAt && <span className="text-[11px] font-medium text-warn ml-auto">{dateTimeLabel(p.scheduledAt)}</span>}
                    </div>
                    <p className="text-sm text-ink2 line-clamp-2">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHead title="Prospects à relancer" onSee={() => navigate('/prospects')} />
            {toFollow.length === 0 ? (
              <p className="text-sm text-ink3 card p-4">Aucun prospect à relancer.</p>
            ) : (
              <div className="space-y-2">
                {toFollow.map((p) => (
                  <button key={p.id} onClick={() => navigate('/prospects')} className="w-full card card-hover px-3.5 py-2.5 flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/25 to-brand-glow/25 grid place-items-center text-xs font-bold text-brand-soft">{initials(p.name)}</div>
                    <span className="text-sm font-medium text-ink flex-1 truncate">{p.name}</span>
                    <ChevronRight size={18} className="text-ink4" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick, tone }: { icon: JSX.Element; label: string; onClick: () => void; tone: 'ok' | 'danger' | 'brand' | 'info' }) {
  const tones = {
    ok: 'text-ok bg-ok/10',
    danger: 'text-danger bg-danger/10',
    brand: 'text-brand-soft bg-brand/10',
    info: 'text-azure bg-azure/10',
  }
  return (
    <button onClick={onClick} className="card card-hover p-3.5 flex items-center gap-3">
      <span className={`grid place-items-center w-9 h-9 rounded-xl ${tones[tone]}`}>{icon}</span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </button>
  )
}

function SectionHead({ title, onSee }: { title: string; onSee: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      <button onClick={onSee} className="text-xs font-semibold text-brand-soft flex items-center gap-0.5 hover:gap-1.5 transition-all">
        Voir tout <ChevronRight size={14} />
      </button>
    </div>
  )
}
