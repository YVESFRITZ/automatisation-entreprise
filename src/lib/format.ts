import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/** Formate un montant avec la devise (ex: "12 500 FCFA"). */
export function money(amount: number, currency = 'FCFA'): string {
  const n = Math.round(amount)
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(n)
  return `${formatted} ${currency}`
}

/** Version courte pour les grands nombres (ex: 1,2 M). */
export function moneyShort(amount: number, currency = 'FCFA'): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} M ${currency}`
  if (abs >= 10_000) return `${Math.round(amount / 1000)} k ${currency}`
  return money(amount, currency)
}

export function dateLabel(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return "Aujourd'hui"
  if (isYesterday(d)) return 'Hier'
  return format(d, 'd MMM yyyy', { locale: fr })
}

export function dateTimeLabel(iso: string): string {
  const d = parseISO(iso)
  return format(d, "d MMM yyyy 'à' HH:mm", { locale: fr })
}

export function monthKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM')
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: fr })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowISO(): string {
  return new Date().toISOString()
}

/** Génère un identifiant unique simple. */
export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

/** Initiales pour un avatar (ex: "Yves Fritz" -> "YF"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
