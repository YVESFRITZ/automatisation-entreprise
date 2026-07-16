import { useMemo, useState } from 'react'
import {
  Plus,
  Users,
  Search,
  MessageCircle,
  Trash2,
  Send,
  Copy,
  Mail,
  Phone,
  Megaphone,
  Check,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { uid, nowISO, initials, dateLabel } from '../lib/format'
import {
  STATUS_LABELS,
  type Channel,
  type Prospect,
  type ProspectStatus,
} from '../lib/types'
import { Modal, EmptyState, Field, PageHeader } from '../components/ui'
import {
  TEMPLATES,
  fillTemplate,
  whatsappLink,
  smsLink,
  emailLink,
} from '../lib/messages'

const STATUS_ORDER: ProspectStatus[] = ['nouveau', 'contacte', 'relance', 'client', 'perdu']
const STATUS_STYLE: Record<ProspectStatus, string> = {
  nouveau: 'border-info/30 bg-info/10 text-info',
  contacte: 'border-brand/30 bg-brand/10 text-brand-soft',
  relance: 'border-warn/30 bg-warn/10 text-warn',
  client: 'border-ok/30 bg-ok/10 text-ok',
  perdu: 'border-line bg-bg-hover text-ink3',
}

export default function Prospects() {
  const { data, addProspect, updateProspect, deleteProspect } = useApp()
  const [filter, setFilter] = useState<'tous' | ProspectStatus>('tous')
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [msgTarget, setMsgTarget] = useState<Prospect | null>(null)
  const [campaignOpen, setCampaignOpen] = useState(false)

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: data.prospects.length }
    for (const s of STATUS_ORDER) c[s] = data.prospects.filter((p) => p.status === s).length
    return c
  }, [data.prospects])

  const list = useMemo(() => {
    return data.prospects.filter((p) => {
      if (filter !== 'tous' && p.status !== filter) return false
      if (q && !`${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [data.prospects, filter, q])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prospects"
        subtitle="Votre carnet de contacts et vos messages"
        action={
          <div className="hidden sm:flex gap-2">
            <button className="btn-ghost" onClick={() => setCampaignOpen(true)}>
              <Megaphone size={18} /> Message groupé
            </button>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={18} /> Prospect
            </button>
          </div>
        }
      />

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3" />
        <input
          className="input pl-10"
          placeholder="Rechercher un prospect…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Chip active={filter === 'tous'} onClick={() => setFilter('tous')} label={`Tous · ${counts.tous}`} />
        {STATUS_ORDER.map((s) => (
          <Chip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={`${STATUS_LABELS[s]} · ${counts[s] ?? 0}`}
            className={STATUS_STYLE[s]}
          />
        ))}
      </div>

      {/* Liste */}
      {list.length === 0 ? (
        <EmptyState
          icon={<Users size={26} />}
          title={data.prospects.length === 0 ? 'Aucun prospect' : 'Aucun résultat'}
          hint={
            data.prospects.length === 0
              ? 'Ajoutez vos contacts pour leur écrire des messages en un clic (WhatsApp, SMS, e-mail).'
              : 'Modifiez le filtre ou la recherche.'
          }
          action={
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={18} /> Ajouter un prospect
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <ProspectRow
              key={p.id}
              p={p}
              onMessage={() => setMsgTarget(p)}
              onStatus={(status) => updateProspect({ ...p, status })}
              onDelete={() => deleteProspect(p.id)}
            />
          ))}
        </div>
      )}

      {/* Actions mobiles */}
      <button
        onClick={() => setAddOpen(true)}
        className="sm:hidden fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-glow grid place-items-center active:scale-95"
        aria-label="Ajouter un prospect"
      >
        <Plus size={26} />
      </button>

      <ProspectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(p) => {
          addProspect(p)
          setAddOpen(false)
        }}
      />

      {msgTarget && (
        <MessageComposer
          prospect={msgTarget}
          onClose={() => setMsgTarget(null)}
          onSent={() => {
            updateProspect({
              ...msgTarget,
              lastContact: nowISO(),
              status: msgTarget.status === 'nouveau' ? 'contacte' : msgTarget.status,
            })
            setMsgTarget(null)
          }}
        />
      )}

      <CampaignModal open={campaignOpen} onClose={() => setCampaignOpen(false)} prospects={data.prospects} />
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
  className,
}: {
  active: boolean
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`chip shrink-0 whitespace-nowrap transition ${
        active ? 'border-brand bg-brand/15 text-brand-soft' : className ?? 'border-line bg-bg-hover text-ink3'
      }`}
    >
      {label}
    </button>
  )
}

function ProspectRow({
  p,
  onMessage,
  onStatus,
  onDelete,
}: {
  p: Prospect
  onMessage: () => void
  onStatus: (s: ProspectStatus) => void
  onDelete: () => void
}) {
  return (
    <div className="card px-3.5 py-3 flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/40 to-brand-glow/40 grid place-items-center text-sm font-bold text-brand-soft shrink-0">
        {initials(p.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink truncate">{p.name}</p>
        <p className="text-xs text-ink3 flex items-center gap-1.5 truncate">
          {p.phone ? <><Phone size={11} /> {p.phone}</> : p.email ? <><Mail size={11} /> {p.email}</> : 'Pas de contact'}
          {p.lastContact && <span className="text-ink4">· vu {dateLabel(p.lastContact)}</span>}
        </p>
      </div>
      <select
        value={p.status}
        onChange={(e) => onStatus(e.target.value as ProspectStatus)}
        className={`chip cursor-pointer ${STATUS_STYLE[p.status]} appearance-none pr-2`}
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s} className="bg-bg-card text-ink">
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button onClick={onMessage} className="btn-primary !px-3 !py-2 shrink-0" aria-label="Écrire un message">
        <MessageCircle size={16} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-ink4 hover:text-danger hover:bg-danger/10 hidden sm:block"
        aria-label="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function ProspectModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (p: Prospect) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [status, setStatus] = useState<ProspectStatus>('nouveau')
  const [note, setNote] = useState('')

  const valid = name.trim().length > 0 && (phone.trim() || email.trim())

  function save() {
    if (!valid) return
    onSave({
      id: uid(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      channel,
      status,
      note: note.trim(),
      lastContact: null,
      createdAt: nowISO(),
    })
    setName(''); setPhone(''); setEmail(''); setNote('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau prospect"
      footer={
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" disabled={!valid} onClick={save}>Enregistrer</button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nom complet">
          <input autoFocus className="input" placeholder="Ex : Marie Nguema" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Téléphone (WhatsApp/SMS)" hint="Avec l'indicatif pays, ex : 2376XXXXXXXX">
          <input className="input" inputMode="tel" placeholder="2376XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="E-mail (optionnel)">
          <input className="input" inputMode="email" placeholder="prospect@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Canal préféré">
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">E-mail</option>
            </select>
          </Field>
          <Field label="Statut">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ProspectStatus)}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Note (optionnel)">
          <textarea className="input min-h-[70px]" placeholder="Ex : intéressé par le pack pro" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function MessageComposer({
  prospect,
  onClose,
  onSent,
}: {
  prospect: Prospect
  onClose: () => void
  onSent: () => void
}) {
  const { settings } = useApp()
  const [tplId, setTplId] = useState(TEMPLATES[0].id)
  const [channel, setChannel] = useState<Channel>(prospect.channel)
  const [text, setText] = useState(() => fillTemplate(TEMPLATES[0].body, prospect, settings))
  const [copied, setCopied] = useState(false)

  function applyTemplate(id: string) {
    setTplId(id)
    const tpl = TEMPLATES.find((t) => t.id === id)!
    setText(fillTemplate(tpl.body, prospect, settings))
  }

  function send() {
    let link = ''
    if (channel === 'whatsapp') link = whatsappLink(prospect.phone, text)
    else if (channel === 'sms') link = smsLink(prospect.phone, text)
    else link = emailLink(prospect.email, `Message de ${settings.businessName}`, text)
    window.open(link, '_blank')
    onSent()
  }

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const canSend = channel === 'email' ? !!prospect.email : !!prospect.phone

  return (
    <Modal
      open
      onClose={onClose}
      title={`Message à ${prospect.name}`}
      footer={
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={copy}>
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copié' : 'Copier'}
          </button>
          <button className="btn-primary flex-1" disabled={!canSend} onClick={send}>
            <Send size={18} /> Envoyer
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Modèle">
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={`chip transition ${tplId === t.id ? 'border-brand bg-brand/15 text-brand-soft' : 'border-line bg-bg-hover text-ink3'}`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Canal">
          <div className="flex gap-2">
            {(['whatsapp', 'sms', 'email'] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`btn flex-1 ${channel === c ? 'bg-brand text-white' : 'bg-bg-hover text-ink2 border border-line'}`}
              >
                {c === 'whatsapp' ? 'WhatsApp' : c === 'sms' ? 'SMS' : 'E-mail'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Message">
          <textarea className="input min-h-[140px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>

        {!canSend && (
          <p className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
            {channel === 'email' ? "Ce prospect n'a pas d'e-mail." : "Ce prospect n'a pas de numéro."}
          </p>
        )}
      </div>
    </Modal>
  )
}

function CampaignModal({
  open,
  onClose,
  prospects,
}: {
  open: boolean
  onClose: () => void
  prospects: Prospect[]
}) {
  const { settings, updateProspect } = useApp()
  const [tplId, setTplId] = useState(TEMPLATES[0].id)
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [statusFilter, setStatusFilter] = useState<'tous' | ProspectStatus>('tous')
  const [sent, setSent] = useState<Set<string>>(new Set())

  const recipients = useMemo(
    () =>
      prospects.filter((p) => {
        if (statusFilter !== 'tous' && p.status !== statusFilter) return false
        return channel === 'email' ? !!p.email : !!p.phone
      }),
    [prospects, statusFilter, channel],
  )

  const tpl = TEMPLATES.find((t) => t.id === tplId)!

  function sendTo(p: Prospect) {
    const text = fillTemplate(tpl.body, p, settings)
    let link = ''
    if (channel === 'whatsapp') link = whatsappLink(p.phone, text)
    else if (channel === 'sms') link = smsLink(p.phone, text)
    else link = emailLink(p.email, `Message de ${settings.businessName}`, text)
    window.open(link, '_blank')
    setSent((s) => new Set(s).add(p.id))
    updateProspect({ ...p, lastContact: nowISO(), status: p.status === 'nouveau' ? 'contacte' : p.status })
  }

  return (
    <Modal open={open} onClose={onClose} title="Message groupé">
      <div className="space-y-4">
        <p className="text-xs text-ink3 bg-bg-soft border border-line rounded-lg px-3 py-2">
          Envoyez le même message à plusieurs prospects, un par un (ouverture de WhatsApp/SMS/e-mail pré-rempli).
          Pour un envoi <strong>100% automatique en masse</strong>, l'API WhatsApp Business est nécessaire — voir Réglages.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Canal">
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">E-mail</option>
            </select>
          </Field>
          <Field label="Cible">
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="tous">Tous</option>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Modèle">
          <select className="input" value={tplId} onChange={(e) => setTplId(e.target.value)}>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </Field>

        <div>
          <p className="text-sm font-semibold text-ink2 mb-2">
            Destinataires · {recipients.length} <span className="text-ink3">({sent.size} envoyés)</span>
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {recipients.length === 0 && <p className="text-sm text-ink3">Aucun prospect ne correspond.</p>}
            {recipients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 card px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-brand/20 grid place-items-center text-xs font-bold text-brand-soft">
                  {initials(p.name)}
                </div>
                <span className="text-sm text-ink flex-1 truncate">{p.name}</span>
                <button
                  onClick={() => sendTo(p)}
                  className={`btn !px-3 !py-1.5 text-xs ${sent.has(p.id) ? 'bg-ok/15 text-ok border border-ok/30' : 'btn-primary'}`}
                >
                  {sent.has(p.id) ? <><Check size={14} /> Envoyé</> : <><Send size={14} /> Envoyer</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
