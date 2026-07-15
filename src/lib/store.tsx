import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { cloudEnabled, supabase } from './supabase'
import { localBackend, supabaseBackend, type Backend } from './backend'
import {
  type AppData,
  type Post,
  type Prospect,
  type Settings,
  type Transaction,
  DEFAULT_SETTINGS,
} from './types'

type Mode = 'local' | 'cloud-auth' | 'cloud'

interface Ctx {
  ready: boolean
  mode: Mode
  session: Session | null
  data: AppData
  settings: Settings
  // actions
  reload: () => Promise<void>
  saveSettings: (s: Settings) => Promise<void>
  addTransaction: (t: Transaction) => Promise<void>
  updateTransaction: (t: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addProspect: (p: Prospect) => Promise<void>
  updateProspect: (p: Prospect) => Promise<void>
  deleteProspect: (id: string) => Promise<void>
  addPost: (p: Post) => Promise<void>
  updatePost: (p: Post) => Promise<void>
  deletePost: (id: string) => Promise<void>
  // auth (cloud uniquement)
  signOut: () => Promise<void>
}

const AppContext = createContext<Ctx | null>(null)

const EMPTY: AppData = {
  transactions: [],
  prospects: [],
  posts: [],
  settings: { ...DEFAULT_SETTINGS },
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [data, setData] = useState<AppData>(EMPTY)
  const backendRef = useRef<Backend>(localBackend)

  const mode: Mode = !cloudEnabled ? 'local' : session ? 'cloud' : 'cloud-auth'

  // Sélectionne le backend selon le mode
  useEffect(() => {
    if (!cloudEnabled) {
      backendRef.current = localBackend
    } else if (session) {
      backendRef.current = supabaseBackend(session.user.id)
    }
  }, [session])

  const reload = useCallback(async () => {
    const d = await backendRef.current.load()
    setData(d)
  }, [])

  // Initialisation : auth (cloud) + premier chargement
  useEffect(() => {
    let unsubData: (() => void) | undefined

    async function init() {
      if (cloudEnabled && supabase) {
        const { data: s } = await supabase.auth.getSession()
        setSession(s.session)
        supabase.auth.onAuthStateChange((_e, next) => setSession(next))
      }
      setReady(true)
    }
    init()
    return () => unsubData?.()
  }, [])

  // Charge les données quand le mode devient exploitable
  useEffect(() => {
    if (!ready) return
    if (mode === 'cloud-auth') {
      setData(EMPTY)
      return
    }
    reload()
    // Abonnement temps réel en mode cloud
    const b = backendRef.current
    const unsub = b.subscribe?.(() => reload())
    return () => unsub?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, session])

  // ── Actions (mise à jour optimiste + persistance) ─────────────────
  const optimistic = useCallback((fn: (d: AppData) => AppData) => {
    setData((d) => fn(d))
  }, [])

  const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
    const i = list.findIndex((x) => x.id === item.id)
    if (i === -1) return [item, ...list]
    const copy = list.slice()
    copy[i] = item
    return copy
  }

  const actions = useMemo<Omit<Ctx, 'ready' | 'mode' | 'session' | 'data' | 'settings' | 'reload'>>(
    () => ({
      async saveSettings(s) {
        optimistic((d) => ({ ...d, settings: s }))
        await backendRef.current.saveSettings(s)
      },
      async addTransaction(t) {
        optimistic((d) => ({ ...d, transactions: [t, ...d.transactions] }))
        await backendRef.current.upsertTransaction(t)
      },
      async updateTransaction(t) {
        optimistic((d) => ({ ...d, transactions: upsert(d.transactions, t) }))
        await backendRef.current.upsertTransaction(t)
      },
      async deleteTransaction(id) {
        optimistic((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== id) }))
        await backendRef.current.deleteTransaction(id)
      },
      async addProspect(p) {
        optimistic((d) => ({ ...d, prospects: [p, ...d.prospects] }))
        await backendRef.current.upsertProspect(p)
      },
      async updateProspect(p) {
        optimistic((d) => ({ ...d, prospects: upsert(d.prospects, p) }))
        await backendRef.current.upsertProspect(p)
      },
      async deleteProspect(id) {
        optimistic((d) => ({ ...d, prospects: d.prospects.filter((x) => x.id !== id) }))
        await backendRef.current.deleteProspect(id)
      },
      async addPost(p) {
        optimistic((d) => ({ ...d, posts: [p, ...d.posts] }))
        await backendRef.current.upsertPost(p)
      },
      async updatePost(p) {
        optimistic((d) => ({ ...d, posts: upsert(d.posts, p) }))
        await backendRef.current.upsertPost(p)
      },
      async deletePost(id) {
        optimistic((d) => ({ ...d, posts: d.posts.filter((x) => x.id !== id) }))
        await backendRef.current.deletePost(id)
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [optimistic],
  )

  const value: Ctx = {
    ready,
    mode,
    session,
    data,
    settings: data.settings,
    reload,
    ...actions,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>')
  return ctx
}
