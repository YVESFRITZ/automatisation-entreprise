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
} from 'lucide-react'
import { useApp } from '../lib/store'

const NAV = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/caisse', label: 'Caisse', icon: Wallet },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/reseaux', label: 'Réseaux', icon: Megaphone },
  { to: '/reglages', label: 'Réglages', icon: Settings },
]

export function Layout({ children }: { children: ReactNode }) {
  const { mode, settings } = useApp()
  const location = useLocation()

  return (
    <div className="min-h-full flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-bg-soft/60 backdrop-blur px-4 py-6 sticky top-0 h-screen">
        <Brand name={settings.businessName} />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand/15 text-brand-soft'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-bg-hover'
                }`
              }
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <ModeBadge mode={mode} />
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 safe-top bg-bg/80 backdrop-blur border-b border-line">
          <div className="flex items-center justify-between px-4 h-14">
            <Brand name={settings.businessName} compact />
            <ModeBadge mode={mode} compact />
          </div>
        </header>

        <main
          key={location.pathname}
          className="flex-1 px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-8 max-w-5xl w-full mx-auto animate-fade-up"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-bg-soft/95 backdrop-blur border-t border-line">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-soft' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
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
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-soft to-brand-glow grid place-items-center shadow-glow shrink-0">
        <span className="text-white font-black text-sm">A</span>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate">{name || 'Mon Entreprise'}</p>
          <p className="text-[11px] text-slate-500">Tableau de bord</p>
        </div>
      )}
      {compact && <span className="text-sm font-bold text-slate-100 truncate">{name || 'Mon Entreprise'}</span>}
    </div>
  )
}

function ModeBadge({ mode, compact }: { mode: string; compact?: boolean }) {
  const cloud = mode === 'cloud'
  return (
    <span
      className={`chip ${
        cloud ? 'border-ok/30 bg-ok/10 text-ok' : 'border-line bg-bg-hover text-slate-400'
      }`}
      title={cloud ? 'Synchronisé sur vos appareils' : 'Données sur cet appareil uniquement'}
    >
      {cloud ? <Cloud size={13} /> : <HardDrive size={13} />}
      {!compact && (cloud ? 'Synchronisé' : 'Local')}
    </span>
  )
}
