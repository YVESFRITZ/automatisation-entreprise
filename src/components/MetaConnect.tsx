import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Facebook,
  Instagram,
  Check,
  Loader2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Trash2,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { supabase } from '../lib/supabase'

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',')

// URL de la fonction de retour (dérivée de l'URL Supabase)
function redirectUri(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace('.supabase.co', '.functions.supabase.co')
  return `${base}/facebook-oauth-callback`
}

const FB_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: '🎉 Facebook connecté ! Vos posts programmés partiront automatiquement.' },
  nopage: { ok: false, text: "Aucune Page Facebook trouvée sur ce compte. Créez une Page puis réessayez." },
  cancel: { ok: false, text: 'Connexion annulée.' },
  autherror: { ok: false, text: 'Session expirée — reconnectez-vous puis réessayez.' },
  tokenerror: { ok: false, text: 'Échec de l’échange du jeton. Réessayez.' },
  error: { ok: false, text: 'Une erreur est survenue. Réessayez.' },
}

/** Connexion des comptes Meta (Facebook + Instagram) pour la publication auto. */
export function MetaConnect() {
  const { mode, session } = useApp()
  const [params, setParams] = useSearchParams()
  const [pageId, setPageId] = useState('')
  const [igId, setIgId] = useState('')
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [guide, setGuide] = useState(false)
  const [returnMsg, setReturnMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const uid = session?.user.id
  const appId = import.meta.env.VITE_META_APP_ID as string | undefined

  async function load() {
    if (mode !== 'cloud' || !uid || !supabase) {
      setLoading(false)
      return
    }
    const { data } = await supabase.from('social_accounts').select('*').eq('user_id', uid).maybeSingle()
    if (data) {
      setPageId(data.meta_page_id ?? '')
      setIgId(data.meta_ig_user_id ?? '')
      setToken(data.meta_access_token ?? '')
      setConnected(!!data.meta_access_token && !!data.meta_page_id)
    } else {
      setConnected(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, uid])

  // Retour de Facebook (?fb=...)
  useEffect(() => {
    const fb = params.get('fb')
    if (fb && FB_MESSAGES[fb]) {
      setReturnMsg(FB_MESSAGES[fb])
      params.delete('fb')
      setParams(params, { replace: true })
      if (fb === 'ok') load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (mode !== 'cloud') {
    return (
      <p className="text-sm text-ink3">
        Connectez-vous d'abord (créez votre compte) pour relier vos comptes Facebook / Instagram.
      </p>
    )
  }
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink3">
        <Loader2 size={16} className="animate-spin" /> Chargement…
      </div>
    )
  }

  async function connectFacebook() {
    if (!appId || !supabase) {
      setReturnMsg({ ok: false, text: "Configuration Facebook manquante. Réessayez plus tard." })
      return
    }
    const { data } = await supabase.auth.getSession()
    const jwt = data.session?.access_token
    if (!jwt) return
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri())}` +
      `&state=${encodeURIComponent(jwt)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&response_type=code`
    window.location.href = url
  }

  async function saveManual() {
    if (!uid || !supabase) return
    setSaving(true)
    setTestMsg(null)
    await supabase.from('social_accounts').upsert({
      user_id: uid,
      meta_page_id: pageId.trim() || null,
      meta_ig_user_id: igId.trim() || null,
      meta_access_token: token.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setConnected(!!token.trim() && !!pageId.trim())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function disconnect() {
    if (!uid || !supabase) return
    await supabase.from('social_accounts').delete().eq('user_id', uid)
    setPageId(''); setIgId(''); setToken(''); setConnected(false)
    setReturnMsg(null)
  }

  async function testConnexion() {
    setTesting(true)
    setTestMsg(null)
    try {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${pageId.trim()}?fields=name&access_token=${encodeURIComponent(token.trim())}`,
      )
      const j = await r.json()
      if (j.error) setTestMsg('❌ ' + (j.error.message ?? 'Jeton ou Page ID invalide'))
      else setTestMsg('✅ Connecté à la Page : ' + j.name)
    } catch {
      setTestMsg('❌ Impossible de joindre Facebook')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      {returnMsg && (
        <p className={`text-sm rounded-xl px-3.5 py-2.5 border ${returnMsg.ok ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-danger/10 border-danger/25 text-danger'}`}>
          {returnMsg.text}
        </p>
      )}

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold bg-ok/10 border border-ok/25 text-ok">
            <ShieldCheck size={18} /> Comptes Meta connectés
            <span className="ml-auto text-xs font-medium text-ink3">Page : {pageId}{igId ? ' · IG ✓' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={testConnexion} disabled={testing}>
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Tester
            </button>
            <button className="btn-danger" onClick={disconnect}><Trash2 size={16} /> Déconnecter</button>
          </div>
          {testMsg && (
            <p className={`text-sm rounded-lg px-3 py-2 border ${testMsg.startsWith('✅') ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-danger/10 border-danger/25 text-danger'}`}>{testMsg}</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-ink3">
            Reliez votre Page Facebook (et Instagram) en un clic pour publier automatiquement vos posts programmés.
          </p>
          <button
            onClick={connectFacebook}
            className="btn w-full text-white font-semibold shadow-blue"
            style={{ background: 'linear-gradient(180deg,#1877F2 0%,#0e5fd8 100%)' }}
          >
            <Facebook size={18} /> Se connecter avec Facebook
          </button>
          <p className="text-xs text-ink4 text-center flex items-center justify-center gap-1.5">
            <Instagram size={12} /> Instagram inclus s'il est relié à votre Page.
          </p>
        </>
      )}

      {/* Méthode manuelle (avancée) */}
      <div className="border border-line rounded-xl overflow-hidden">
        <button onClick={() => setAdvanced((a) => !a)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink3 hover:bg-bg-hover">
          Méthode manuelle (avancée)
          <ChevronDown size={16} className={`transition ${advanced ? 'rotate-180' : ''}`} />
        </button>
        {advanced && (
          <div className="px-4 pb-4 pt-1 space-y-3">
            <div>
              <label className="label">ID de la Page Facebook</label>
              <input className="input" placeholder="Ex : 1029384756..." value={pageId} onChange={(e) => setPageId(e.target.value)} />
            </div>
            <div>
              <label className="label">ID du compte Instagram (optionnel)</label>
              <input className="input" placeholder="Ex : 1784...." value={igId} onChange={(e) => setIgId(e.target.value)} />
            </div>
            <div>
              <label className="label">Jeton d'accès de la Page</label>
              <input className="input" type="password" placeholder="EAAG…" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveManual} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                {saved ? 'Enregistré' : 'Enregistrer'}
              </button>
              <button className="btn-ghost" onClick={testConnexion} disabled={testing || !pageId || !token}>
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Tester
              </button>
            </div>
            {testMsg && (
              <p className={`text-sm rounded-lg px-3 py-2 border ${testMsg.startsWith('✅') ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-danger/10 border-danger/25 text-danger'}`}>{testMsg}</p>
            )}
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="border border-line rounded-xl overflow-hidden">
        <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink3 hover:bg-bg-hover">
          Prérequis & aide
          <ChevronDown size={16} className={`transition ${guide ? 'rotate-180' : ''}`} />
        </button>
        {guide && (
          <div className="px-4 pb-4 pt-1 text-sm text-ink3 space-y-2">
            <p>Pour publier, il faut une <b>Page Facebook</b> (et, pour Instagram, un compte <b>Instagram Professionnel relié à cette Page</b>).</p>
            <a href="https://www.facebook.com/pages/create" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-soft hover:underline">
              Créer une Page Facebook <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
