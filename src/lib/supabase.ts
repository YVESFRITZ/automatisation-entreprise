import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true si la synchro cloud est configurée (clés présentes). */
export const cloudEnabled = Boolean(url && anon)

/**
 * Client Supabase partagé. `null` si les clés ne sont pas fournies :
 * dans ce cas l'app fonctionne en local (localStorage) sur cet appareil.
 */
export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
