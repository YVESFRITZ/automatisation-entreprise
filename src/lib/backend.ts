import { supabase } from './supabase'
import {
  type AppData,
  type Post,
  type Prospect,
  type Settings,
  type Transaction,
  DEFAULT_SETTINGS,
} from './types'

export interface Backend {
  load(): Promise<AppData>
  saveSettings(s: Settings): Promise<void>
  upsertTransaction(t: Transaction): Promise<void>
  deleteTransaction(id: string): Promise<void>
  upsertProspect(p: Prospect): Promise<void>
  deleteProspect(id: string): Promise<void>
  upsertPost(p: Post): Promise<void>
  deletePost(id: string): Promise<void>
  /** S'abonner aux changements distants (retourne une fonction de désabonnement). */
  subscribe?(cb: () => void): () => void
}

const LS_KEY = 'auto-entreprise:data:v1'

function emptyData(): AppData {
  return { transactions: [], prospects: [], posts: [], settings: { ...DEFAULT_SETTINGS } }
}

// ── Backend local (localStorage) ────────────────────────────────────
export const localBackend: Backend = {
  async load() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return emptyData()
      const parsed = JSON.parse(raw) as Partial<AppData>
      return {
        transactions: parsed.transactions ?? [],
        prospects: parsed.prospects ?? [],
        posts: parsed.posts ?? [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      }
    } catch {
      return emptyData()
    }
  },
  async saveSettings(s) {
    patchLocal((d) => ({ ...d, settings: s }))
  },
  async upsertTransaction(t) {
    patchLocal((d) => ({ ...d, transactions: upsertById(d.transactions, t) }))
  },
  async deleteTransaction(id) {
    patchLocal((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== id) }))
  },
  async upsertProspect(p) {
    patchLocal((d) => ({ ...d, prospects: upsertById(d.prospects, p) }))
  },
  async deleteProspect(id) {
    patchLocal((d) => ({ ...d, prospects: d.prospects.filter((x) => x.id !== id) }))
  },
  async upsertPost(p) {
    patchLocal((d) => ({ ...d, posts: upsertById(d.posts, p) }))
  },
  async deletePost(id) {
    patchLocal((d) => ({ ...d, posts: d.posts.filter((x) => x.id !== id) }))
  },
}

function patchLocal(fn: (d: AppData) => AppData) {
  const raw = localStorage.getItem(LS_KEY)
  const current: AppData = raw ? { ...emptyData(), ...JSON.parse(raw) } : emptyData()
  localStorage.setItem(LS_KEY, JSON.stringify(fn(current)))
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [item, ...list]
  const copy = list.slice()
  copy[i] = item
  return copy
}

// ── Backend cloud (Supabase) ────────────────────────────────────────
// Activé uniquement quand l'utilisateur est connecté. Les tables sont
// définies dans supabase/schema.sql (RLS : chacun ne voit que ses données).
export function supabaseBackend(userId: string): Backend {
  const sb = supabase!
  const withUser = <T extends object>(o: T) => ({ ...o, user_id: userId })

  return {
    async load() {
      const [tx, pr, po, st] = await Promise.all([
        sb.from('transactions').select('*').order('date', { ascending: false }),
        sb.from('prospects').select('*').order('created_at', { ascending: false }),
        sb.from('posts').select('*').order('created_at', { ascending: false }),
        sb.from('settings').select('*').eq('user_id', userId).maybeSingle(),
      ])
      return {
        transactions: (tx.data ?? []).map(rowToTx),
        prospects: (pr.data ?? []).map(rowToProspect),
        posts: (po.data ?? []).map(rowToPost),
        settings: st.data ? rowToSettings(st.data) : { ...DEFAULT_SETTINGS },
      }
    },
    async saveSettings(s) {
      await sb.from('settings').upsert(withUser(settingsToRow(s)))
    },
    async upsertTransaction(t) {
      await sb.from('transactions').upsert(withUser(txToRow(t)))
    },
    async deleteTransaction(id) {
      await sb.from('transactions').delete().eq('id', id)
    },
    async upsertProspect(p) {
      await sb.from('prospects').upsert(withUser(prospectToRow(p)))
    },
    async deleteProspect(id) {
      await sb.from('prospects').delete().eq('id', id)
    },
    async upsertPost(p) {
      await sb.from('posts').upsert(withUser(postToRow(p)))
    },
    async deletePost(id) {
      await sb.from('posts').delete().eq('id', id)
    },
    subscribe(cb) {
      const ch = sb
        .channel('app-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, cb)
        .subscribe()
      return () => {
        sb.removeChannel(ch)
      }
    },
  }
}

// ── Mapping camelCase <-> snake_case ────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
const rowToTx = (r: any): Transaction => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  category: r.category,
  label: r.label ?? '',
  method: r.method ?? 'especes',
  date: r.date,
  createdAt: r.created_at,
})
const txToRow = (t: Transaction) => ({
  id: t.id,
  type: t.type,
  amount: t.amount,
  category: t.category,
  label: t.label,
  method: t.method,
  date: t.date,
  created_at: t.createdAt,
})
const rowToProspect = (r: any): Prospect => ({
  id: r.id,
  name: r.name,
  phone: r.phone ?? '',
  email: r.email ?? '',
  channel: r.channel ?? 'whatsapp',
  status: r.status ?? 'nouveau',
  note: r.note ?? '',
  lastContact: r.last_contact,
  createdAt: r.created_at,
})
const prospectToRow = (p: Prospect) => ({
  id: p.id,
  name: p.name,
  phone: p.phone,
  email: p.email,
  channel: p.channel,
  status: p.status,
  note: p.note,
  last_contact: p.lastContact,
  created_at: p.createdAt,
})
const rowToPost = (r: any): Post => ({
  id: r.id,
  platforms: r.platforms ?? [],
  content: r.content ?? '',
  mediaUrl: r.media_url ?? '',
  scheduledAt: r.scheduled_at,
  status: r.status ?? 'brouillon',
  error: r.error ?? undefined,
  createdAt: r.created_at,
})
const postToRow = (p: Post) => ({
  id: p.id,
  platforms: p.platforms,
  content: p.content,
  media_url: p.mediaUrl,
  scheduled_at: p.scheduledAt,
  status: p.status,
  error: p.error ?? null,
  created_at: p.createdAt,
})
const rowToSettings = (r: any): Settings => ({
  businessName: r.business_name ?? DEFAULT_SETTINGS.businessName,
  currency: r.currency ?? DEFAULT_SETTINGS.currency,
  currencyLocale: r.currency_locale ?? DEFAULT_SETTINGS.currencyLocale,
  senderName: r.sender_name ?? '',
})
const settingsToRow = (s: Settings) => ({
  business_name: s.businessName,
  currency: s.currency,
  currency_locale: s.currencyLocale,
  sender_name: s.senderName,
})
