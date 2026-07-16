import { useState } from 'react'
import { Loader2, LogIn, UserPlus, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

/** Écran de connexion affiché uniquement quand la synchro cloud est activée. */
export function AuthGate() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Compte créé. Vous pouvez vous connecter (vérifiez vos e-mails si la confirmation est activée).')
        setMode('in')
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-soft to-brand-glow grid place-items-center shadow-glow">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Automatisation Entreprise</h1>
          <p className="text-sm text-ink3 mt-1">
            Connectez-vous pour retrouver vos données sur tous vos appareils.
          </p>
        </div>

        <form onSubmit={submit} className="card p-5 space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              required
              className="input"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{err}</p>}
          {msg && <p className="text-sm text-ok bg-ok/10 border border-ok/30 rounded-lg px-3 py-2">{msg}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="animate-spin" size={18} /> : mode === 'in' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === 'in' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in')
              setErr(null)
            }}
            className="w-full text-sm text-ink3 hover:text-ink"
          >
            {mode === 'in' ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte — Se connecter"}
          </button>
        </form>
      </div>
    </div>
  )
}
