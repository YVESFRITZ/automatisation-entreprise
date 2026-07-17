import { useRef, useState } from 'react'
import {
  Building2,
  Cloud,
  CloudOff,
  Share2,
  Database,
  Download,
  Upload,
  Trash2,
  LogOut,
  Check,
  ChevronDown,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Field, PageHeader } from '../components/ui'
import { MetaConnect } from '../components/MetaConnect'
import { WhatsAppConnect } from '../components/WhatsAppConnect'
import type { AppData, Settings } from '../lib/types'

export default function Reglages() {
  const { settings, saveSettings, mode, session, signOut, data, reload } = useApp()
  const [form, setForm] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function save() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sauvegarde-entreprise-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData
        localStorage.setItem('auto-entreprise:data:v1', JSON.stringify(parsed))
        reload()
        alert('Données importées.')
      } catch {
        alert('Fichier invalide.')
      }
    }
    reader.readAsText(file)
  }

  function resetLocal() {
    if (!confirm('Effacer toutes les données locales de cet appareil ? Cette action est irréversible.')) return
    localStorage.removeItem('auto-entreprise:data:v1')
    reload()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Réglages" subtitle="Entreprise, synchronisation et connexions" />

      {/* Entreprise */}
      <Card icon={<Building2 size={18} />} title="Mon entreprise">
        <div className="space-y-4">
          <Field label="Nom de l'entreprise">
            <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Votre nom (signature des messages)">
              <input className="input" placeholder="Ex : Yves" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
            </Field>
            <Field label="Devise">
              <input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </Field>
          </div>
          <button className="btn-primary" onClick={save}>
            {saved ? <><Check size={18} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </Card>

      {/* Synchro cloud */}
      <Card icon={mode === 'cloud' ? <Cloud size={18} /> : <CloudOff size={18} />} title="Synchronisation entre appareils">
        {mode === 'cloud' ? (
          <div className="space-y-3">
            <p className="text-sm text-ok flex items-center gap-2"><Check size={16} /> Synchro active — connecté en tant que <strong>{session?.user.email}</strong></p>
            <p className="text-sm text-ink3">Vos données (caisse, prospects, posts) sont partagées en temps réel sur tous vos appareils connectés à ce compte.</p>
            <button className="btn-danger" onClick={signOut}><LogOut size={16} /> Se déconnecter</button>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink3">
            <p className="flex items-center gap-2 text-ink2"><CloudOff size={16} /> Mode local — les données restent sur cet appareil.</p>
            <p>Pour synchroniser vos 2-3 appareils, activez le cloud gratuit (Supabase) :</p>
            <ol className="list-decimal list-inside space-y-1.5 text-ink3">
              <li>Créez un projet gratuit sur <b>supabase.com</b></li>
              <li>Exécutez le fichier <code className="text-brand-soft">supabase/schema.sql</code> (SQL Editor)</li>
              <li>Copiez l'URL et la clé <i>anon</i> (Settings → API) dans le fichier <code className="text-brand-soft">.env</code></li>
              <li>Relancez l'application → un écran de connexion apparaîtra</li>
            </ol>
            <p className="text-xs">Tout est détaillé dans <code className="text-brand-soft">supabase/README.md</code>.</p>
          </div>
        )}
      </Card>

      {/* Connexions réseaux sociaux */}
      <Card icon={<Share2 size={18} />} title="Facebook & Instagram — publication automatique">
        <MetaConnect />
        <div className="mt-5 pt-4 border-t border-line">
          <Collapsible summary="TikTok (bientôt)">
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-ink3">
              <li>Créez une app sur <b>developers.tiktok.com</b></li>
              <li>Activez la <b>Content Posting API</b> et demandez l'accès (validation requise)</li>
              <li>Récupérez <code className="text-brand-soft">client_key</code> et <code className="text-brand-soft">client_secret</code></li>
            </ol>
            <a href="https://developers.tiktok.com/doc/content-posting-api-get-started" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-soft hover:underline">
              Documentation TikTok <ExternalLink size={12} />
            </a>
          </Collapsible>
        </div>
      </Card>

      {/* WhatsApp */}
      <Card icon={<MessageCircle size={18} />} title="WhatsApp — messages aux prospects">
        <WhatsAppConnect />
      </Card>

      {/* Données */}
      <Card icon={<Database size={18} />} title="Données & sauvegarde">
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportData}><Download size={16} /> Exporter (JSON)</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importer</button>
          <button className="btn-danger" onClick={resetLocal}><Trash2 size={16} /> Effacer (local)</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
        <p className="text-xs text-ink3 mt-3">Exportez régulièrement une sauvegarde de sécurité, surtout en mode local.</p>
      </Card>

      <p className="text-center text-xs text-ink4 pt-2">Automatisation Entreprise · v0.1 · installable comme une application</p>
    </div>
  )
}

function Card({ icon, title, children }: { icon: JSX.Element; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand-soft grid place-items-center">{icon}</span>
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Collapsible({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-line rounded-xl mb-2 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:bg-bg-hover">
        {summary}
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}
