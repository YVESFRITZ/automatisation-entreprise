import { useEffect, useState } from 'react'
import {
  Facebook,
  Instagram,
  Check,
  Loader2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { supabase } from '../lib/supabase'

/** Connexion des comptes Meta (Facebook + Instagram) pour la publication auto. */
export function MetaConnect() {
  const { mode, session } = useApp()
  const [pageId, setPageId] = useState('')
  const [igId, setIgId] = useState('')
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [guide, setGuide] = useState(false)

  const uid = session?.user.id

  useEffect(() => {
    if (mode !== 'cloud' || !uid || !supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPageId(data.meta_page_id ?? '')
          setIgId(data.meta_ig_user_id ?? '')
          setToken(data.meta_access_token ?? '')
          setConnected(!!data.meta_access_token && !!data.meta_page_id)
        }
        setLoading(false)
      })
  }, [mode, uid])

  if (mode !== 'cloud') {
    return (
      <p className="text-sm text-ink3">
        Connectez-vous d'abord au cloud (créez votre compte) pour relier vos comptes Facebook / Instagram
        en toute sécurité.
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

  async function save() {
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
      {/* Statut */}
      <div
        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold border ${
          connected ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-bg-soft border-line text-ink3'
        }`}
      >
        {connected ? <ShieldCheck size={17} /> : <Facebook size={17} />}
        {connected ? 'Comptes Meta connectés' : 'Non connecté'}
      </div>

      <div className="space-y-3">
        <div>
          <label className="label flex items-center gap-1.5"><Facebook size={13} /> ID de la Page Facebook</label>
          <input className="input" placeholder="Ex : 1029384756..." value={pageId} onChange={(e) => setPageId(e.target.value)} />
        </div>
        <div>
          <label className="label flex items-center gap-1.5"><Instagram size={13} /> ID du compte Instagram (optionnel)</label>
          <input className="input" placeholder="Ex : 1784...." value={igId} onChange={(e) => setIgId(e.target.value)} />
        </div>
        <div>
          <label className="label">Jeton d'accès de la Page</label>
          <input className="input" type="password" placeholder="EAAG…" value={token} onChange={(e) => setToken(e.target.value)} />
          <p className="text-xs text-ink4 mt-1">Stocké de façon sécurisée côté serveur, jamais exposé dans le navigateur.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </button>
        <button className="btn-ghost" onClick={testConnexion} disabled={testing || !pageId || !token}>
          {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Tester la connexion
        </button>
      </div>
      {testMsg && (
        <p className={`text-sm rounded-lg px-3 py-2 border ${testMsg.startsWith('✅') ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-danger/10 border-danger/25 text-danger'}`}>
          {testMsg}
        </p>
      )}

      {/* Guide */}
      <div className="border border-line rounded-xl overflow-hidden">
        <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-bg-hover">
          Comment obtenir ces informations ? (guide pas à pas)
          <ChevronDown size={16} className={`transition ${guide ? 'rotate-180' : ''}`} />
        </button>
        {guide && (
          <div className="px-4 pb-4 pt-1 text-sm text-ink3 space-y-2">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Vérifiez que votre compte <b>Instagram est « Professionnel »</b> et <b>relié à votre Page Facebook</b>.</li>
              <li>Allez sur l'outil <b>Graph API Explorer</b> de Meta (lien ci-dessous).</li>
              <li>En haut à droite, sélectionnez votre <b>app</b>, puis <b>« Generate Access Token »</b> et cochez les permissions <code className="text-brand-soft">pages_manage_posts</code>, <code className="text-brand-soft">pages_read_engagement</code>, <code className="text-brand-soft">instagram_basic</code>, <code className="text-brand-soft">instagram_content_publish</code>.</li>
              <li>Copiez le <b>jeton</b> généré et collez-le ci-dessus.</li>
              <li>Pour l'<b>ID de la Page</b> : dans l'Explorer, tapez <code className="text-brand-soft">me/accounts</code> et exécutez → copiez le champ <code className="text-brand-soft">id</code> de votre Page.</li>
              <li>Cliquez <b>Enregistrer</b> puis <b>Tester la connexion</b>.</li>
            </ol>
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-soft hover:underline">
              Ouvrir Graph API Explorer <ExternalLink size={12} />
            </a>
            <p className="text-xs text-ink4 pt-1">
              Une fois connecté, vos posts <b>programmés</b> sont publiés automatiquement à l'heure prévue. 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
