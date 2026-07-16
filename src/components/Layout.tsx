import { NavLink, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import {
  LayoutDashboard,
  Wallet,
  Users,
  Megaphone,
  Settings,
  Cloud,
  HardDrive,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../lib/store'

const NAV = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/caisse', label: 'Caisse', icon: Wallet },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/reseaux', label: 'Réseaux', icon: Megaphone },
]

export function Layout({ children }: { children: ReactNode }) {
  const { mode, settings } = useApp()
  const location = useLocation()

  return (
    <div className="min-h-full flex flex-col">
      {/* ── Barre de navigation (bureau) ── */}
      <header className="hidden lg:block sticky top-0 z-30 px-6 pt-5 pb-2">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/85 backdrop-blur-xl border border-line rounded-full shadow-nav pl-3 pr-3 py-2 flex items-center gap-2">
            <Brand name={settings.businessName} />
            <nav className="flex items-center gap-1 ml-6">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                      isActive
                        ? 'bg-brand/10 text-brand-soft'
                        : 'text-ink2 hover:text-ink hover:bg-bg-hover'
                    }`
                  }
                >
                  <n.icon size={17} />
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <ModeBadge mode={mode} />
              <NavLink
                to="/reglages"
                className={({ isActive }) =>
                  `w-10 h-10 grid place-items-center rounded-full transition ${
                    isActive ? 'bg-brand/10 text-brand-soft' : 'text-ink2 hover:text-ink hover:bg-bg-hover'
                  }`
                }
                aria-label="Réglages"
              >
                <Settings size={19} />
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      {/* Header mobile */}
      <header className="lg:hidden sticky top-0 z-30 safe-top bg-bg/80 backdrop-blur-xl border-b border-line">
        <div className="flex items-center justify-between px-4 h-14">
          <Brand name={settings.businessName} compact />
          <ModeBadge mode={mode} compact />
        </div>
      </header>

      {/* Contenu */}
      <main
        key={location.pathname}
        className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 lg:pt-3 pb-28 lg:pb-12 max-w-6xl w-full mx-auto animate-fade-up"
      >
        {children}
      </main>

      {/* Barre basse (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white/95 backdrop-blur-xl border-t border-line shadow-[0_-6px_24px_-12px_rgba(16,24,40,0.18)]">
        <div className="grid grid-cols-5">
          {[...NAV, { to: '/reglages', label: 'Réglages', icon: Settings }].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={(n as any).end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  isActive ? 'text-brand-soft' : 'text-ink3'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid place-items-center w-9 h-7 rounded-full transition ${
                      isActive ? 'bg-brand/10' : ''
                    }`}
                  >
                    <n.icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                  </span>
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function Brand({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 pl-1">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F76B7A] to-[#E42D43] grid place-items-center shadow-glow shrink-0">
        <TrendingUp className="text-white" size={18} strokeWidth={2.6} />
      </div>
      <span className="font-extrabold text-ink truncate max-w-[9rem] tracking-tight">
        {name || 'Mon Entreprise'}
      </span>
    </div>
  )
}

function ModeBadge({ mode, compact }: { mode: string; compact?: boolean }) {
  const cloud = mode === 'cloud'
  return (
    <span
      className={`chip ${
        cloud ? 'border-ok/25 bg-ok/10 text-ok' : 'border-line bg-bg-soft text-ink3'
      }`}
      title={cloud ? 'Synchronisé sur vos appareils' : 'Données sur cet appareil uniquement'}
    >
      {cloud ? <Cloud size={13} /> : <HardDrive size={13} />}
      {!compact && (cloud ? 'Synchronisé' : 'Local')}
    </span>
  )
}
