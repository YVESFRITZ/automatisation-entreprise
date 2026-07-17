import { useEffect, useState } from 'react'
import { MessageCircle, Check, Loader2, ChevronDown, ExternalLink, ShieldCheck, Send } from 'lucide-react'
import { useApp } from '../lib/store'
import { supabase } from '../lib/supabase'

/** Connexion WhatsApp Business (Cloud API) pour l'envoi automatique aux prospects. */
export function WhatsAppConnect() {
  const { mode, session } = useApp()
  const [phoneId, setPhoneId] = useState('')
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [guide, setGuide] = useState(false)

  const uid = session?.user.id

  useEffect(() => {
    if (mode !== 'cloud' || !uid || !supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('social_accounts')
      .select('whatsapp_phone_id, whatsapp_token')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPhoneId(data.whatsapp_phone_id ?? '')
          setToken(data.whatsapp_token ?? '')
          setConnected(!!data.whatsapp_phone_id && !!data.whatsapp_token)
        }
        setLoading(false)
      })
  }, [mode, uid])

  if (mode !== 'cloud') {
    return <p className="text-sm text-ink3">Connectez-vous d'abord (créez votre compte) pour relier WhatsApp.</p>
  }
  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-ink3"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
  }

  async function save() {
    if (!uid || !supabase) return
    setSaving(true)
    setMsg(null)
    await supabase.from('social_accounts').upsert({
      user_id: uid,
      whatsapp_phone_id: phoneId.trim() || null,
      whatsapp_token: token.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setConnected(!!phoneId.trim() && !!token.trim())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function sendTest() {
    if (!supabase || !testTo.trim()) return
    setSending(true)
    setMsg(null)
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { to: testTo.trim(), message: 'Test ✅ Votre WhatsApp est bien connecté à Automatisation Entreprise.' },
      })
      if (error) throw error
      if ((data as any)?.error) throw new Error((data as any).error)
      setMsg({ ok: true, text: '✅ Message envoyé ! Vérifiez WhatsApp sur le numéro destinataire.' })
    } catch (e: any) {
      setMsg({ ok: false, text: '❌ ' + (e?.message ?? 'Échec de l’envoi') })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold border ${connected ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-bg-soft border-line text-ink3'}`}>
        {connected ? <ShieldCheck size={17} /> : <MessageCircle size={17} />}
        {connected ? 'WhatsApp connecté' : 'Non connecté'}
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Identifiant du numéro (Phone Number ID)</label>
          <input className="input" placeholder="Ex : 1029384756..." value={phoneId} onChange={(e) => setPhoneId(e.target.value)} />
        </div>
        <div>
          <label className="label">Jeton d'accès WhatsApp</label>
          <input className="input" type="password" placeholder="EAAG…" value={token} onChange={(e) => setToken(e.target.value)} />
          <p className="text-xs text-ink4 mt-1">Stocké de façon sécurisée côté serveur.</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>

      {connected && (
        <div className="rounded-xl border border-line bg-bg-soft p-3.5 space-y-2">
          <label className="label">Tester l'envoi (numéro avec indicatif, ex : 2376…)</label>
          <div className="flex gap-2">
            <input className="input" inputMode="tel" placeholder="2376XXXXXXXX" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button className="btn-primary shrink-0" onClick={sendTest} disabled={sending || !testTo.trim()}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Envoyer
            </button>
          </div>
          <p className="text-xs text-ink4">En test, le numéro doit être ajouté comme destinataire autorisé dans Meta. En production, un modèle de message approuvé est requis pour un premier contact.</p>
        </div>
      )}

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 border ${msg.ok ? 'bg-ok/10 border-ok/25 text-ok' : 'bg-danger/10 border-danger/25 text-danger'}`}>{msg.text}</p>
      )}

      <div className="border border-line rounded-xl overflow-hidden">
        <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink3 hover:bg-bg-hover">
          Comment obtenir ces informations ?
          <ChevronDown size={16} className={`transition ${guide ? 'rotate-180' : ''}`} />
        </button>
        {guide && (
          <div className="px-4 pb-4 pt-1 text-sm text-ink3 space-y-1.5">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Dans ton app Meta → <b>+ Add Product</b> → <b>WhatsApp</b> → <b>Set up</b>.</li>
              <li>Meta crée un <b>numéro de test</b> + un <b>jeton temporaire</b>. Copie le <b>Phone Number ID</b> et le <b>jeton</b> → colle-les ci-dessus.</li>
              <li>Dans <b>« To »</b>, ajoute ton propre numéro comme <b>destinataire autorisé</b> (pour les tests).</li>
              <li>Clique <b>Enregistrer</b> puis <b>Envoyer</b> un test à ce numéro.</li>
              <li>Pour la production : relie ton <b>vrai numéro</b> WhatsApp Business et fais approuver des <b>modèles de message</b>.</li>
            </ol>
            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-soft hover:underline">
              Documentation WhatsApp Cloud API <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
