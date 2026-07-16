import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Megaphone,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Facebook,
  Instagram,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  AlertTriangle,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { uid, nowISO, dateTimeLabel } from '../lib/format'
import {
  PLATFORM_LABELS,
  POST_STATUS_LABELS,
  type Platform,
  type Post,
  type PostStatus,
} from '../lib/types'
import { Modal, EmptyState, Field, PageHeader, Segmented } from '../components/ui'
import { cloudEnabled } from '../lib/supabase'
import { PostPreview, MonthCalendar } from '../components/SocialExtras'
import {
  OBJECTIFS,
  QUICK_TEMPLATES,
  generateCaption,
  generateHashtags,
  type Objectif,
} from '../lib/socialTemplates'
import { addMonths, format, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const PLATFORM_ICON: Record<Platform, JSX.Element> = {
  facebook: <Facebook size={14} />,
  instagram: <Instagram size={14} />,
  tiktok: <TikTokIcon />,
}
const PLATFORM_COLOR: Record<Platform, string> = {
  facebook: 'text-[#1877F2] bg-[#1877F2]/10 border-[#1877F2]/20',
  instagram: 'text-[#C13584] bg-[#E1306C]/10 border-[#E1306C]/20',
  tiktok: 'text-ink bg-ink/[0.06] border-ink/15',
}
const CREATE_URL: Record<Platform, string> = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/upload',
}

export default function Social() {
  const { data, addPost, updatePost, deletePost } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [view, setView] = useState<'liste' | 'calendrier'>('liste')
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [presetDate, setPresetDate] = useState<Date | null>(null)

  const groups = useMemo(() => {
    const programme = data.posts
      .filter((p) => p.status === 'programme')
      .sort((a, b) => ((a.scheduledAt ?? '') > (b.scheduledAt ?? '') ? 1 : -1))
    const brouillon = data.posts.filter((p) => p.status === 'brouillon')
    const publie = data.posts
      .filter((p) => p.status === 'publie' || p.status === 'echec')
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    return { programme, brouillon, publie }
  }, [data.posts])

  const dayPosts = useMemo(() => {
    if (!selectedDay) return []
    return data.posts.filter((p) => p.scheduledAt && isSameDay(parseISO(p.scheduledAt), selectedDay))
  }, [data.posts, selectedDay])

  function openNew() {
    setEditing(null)
    setPresetDate(null)
    setOpen(true)
  }
  function openForDay(d: Date) {
    setEditing(null)
    setPresetDate(d)
    setOpen(true)
  }

  const empty = groups.programme.length === 0 && groups.brouillon.length === 0 && groups.publie.length === 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Réseaux sociaux"
        subtitle="Préparez, programmez et générez vos publications"
        action={
          <button className="btn-primary hidden sm:inline-flex" onClick={openNew}>
            <Plus size={18} /> Nouveau post
          </button>
        }
      />

      {/* Bannière automatisation */}
      <div className="card p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand-soft grid place-items-center shrink-0">
          <Megaphone size={18} />
        </div>
        <div className="text-sm text-ink2">
          <p className="font-semibold text-ink">Publication automatique</p>
          <p className="text-ink3 mt-0.5">
            {cloudEnabled
              ? "Une fois vos comptes connectés dans Réglages, les posts programmés partent tout seuls à l'heure prévue."
              : "Programmez vos posts ici. Pour la publication 100% automatique, activez le cloud puis connectez vos comptes (Réglages)."}
          </p>
        </div>
      </div>

      {/* Bascule Liste / Calendrier */}
      <div className="flex justify-center sm:justify-start">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'liste', label: 'Liste', icon: <List size={15} /> },
            { value: 'calendrier', label: 'Calendrier', icon: <CalendarDays size={15} /> },
          ]}
        />
      </div>

      {view === 'calendrier' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <button className="p-2 rounded-lg hover:bg-bg-hover text-ink3" onClick={() => setCalMonth(addMonths(calMonth, -1))}>
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-ink capitalize">{format(calMonth, 'MMMM yyyy', { locale: fr })}</span>
              <button className="p-2 rounded-lg hover:bg-bg-hover text-ink3" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
            <MonthCalendar month={calMonth} posts={data.posts} onSelectDay={setSelectedDay} selectedDay={selectedDay} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink2 capitalize">
                {selectedDay ? format(selectedDay, 'EEEE d MMMM', { locale: fr }) : 'Sélectionnez un jour'}
              </p>
              {selectedDay && (
                <button className="btn-primary !py-2 !px-3 text-xs" onClick={() => openForDay(selectedDay)}>
                  <Plus size={14} /> Programmer
                </button>
              )}
            </div>
            {dayPosts.length === 0 ? (
              <div className="card p-6 text-center text-sm text-ink3">Aucun post ce jour-là.</div>
            ) : (
              <div className="space-y-3">
                {dayPosts.map((p) => (
                  <PostCard key={p.id} post={p} onEdit={() => { setEditing(p); setPresetDate(null); setOpen(true) }} onDelete={() => deletePost(p.id)} onPublish={() => updatePost({ ...p, status: 'publie' })} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : empty ? (
        <EmptyState
          icon={<Megaphone size={26} />}
          title="Aucune publication"
          hint="Créez votre premier post pour Facebook, Instagram ou TikTok — l'assistant peut même rédiger le texte pour vous."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus size={18} /> Créer un post
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <Section title="Programmés" icon={<Clock size={16} />} count={groups.programme.length}>
            {groups.programme.map((p) => (
              <PostCard key={p.id} post={p} onEdit={() => { setEditing(p); setPresetDate(null); setOpen(true) }} onDelete={() => deletePost(p.id)} onPublish={() => updatePost({ ...p, status: 'publie' })} />
            ))}
          </Section>
          <Section title="Brouillons" icon={<ImageIcon size={16} />} count={groups.brouillon.length}>
            {groups.brouillon.map((p) => (
              <PostCard key={p.id} post={p} onEdit={() => { setEditing(p); setPresetDate(null); setOpen(true) }} onDelete={() => deletePost(p.id)} onPublish={() => updatePost({ ...p, status: 'publie' })} />
            ))}
          </Section>
          <Section title="Publiés" icon={<CheckCircle2 size={16} />} count={groups.publie.length}>
            {groups.publie.map((p) => (
              <PostCard key={p.id} post={p} onEdit={() => { setEditing(p); setPresetDate(null); setOpen(true) }} onDelete={() => deletePost(p.id)} onPublish={() => updatePost({ ...p, status: 'publie' })} />
            ))}
          </Section>
        </div>
      )}

      <button
        onClick={openNew}
        className="sm:hidden fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-glow grid place-items-center active:scale-95"
        aria-label="Nouveau post"
      >
        <Plus size={26} />
      </button>

      <PostModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        presetDate={presetDate}
        onSave={(p) => {
          if (editing) updatePost(p)
          else addPost(p)
          setOpen(false)
        }}
      />
    </div>
  )
}

function Section({ title, icon, count, children }: { title: string; icon: JSX.Element; count: number; children: React.ReactNode }) {
  if (count === 0) return null
  return (
    <div>
      <p className="text-sm font-semibold text-ink2 mb-3 flex items-center gap-2">
        <span className="text-ink3">{icon}</span> {title} <span className="text-ink3">· {count}</span>
      </p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function PostCard({ post, onEdit, onDelete, onPublish }: { post: Post; onEdit: () => void; onDelete: () => void; onPublish: () => void }) {
  const [copied, setCopied] = useState(false)
  async function copyAndOpen() {
    await navigator.clipboard.writeText(post.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    const first = post.platforms[0]
    if (first) window.open(CREATE_URL[first], '_blank')
  }
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {post.platforms.map((pl) => (
            <span key={pl} className={`chip ${PLATFORM_COLOR[pl]}`}>
              {PLATFORM_ICON[pl]} {PLATFORM_LABELS[pl]}
            </span>
          ))}
        </div>
        <StatusBadge status={post.status} />
      </div>

      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-line bg-bg-soft aspect-video">
          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        </div>
      )}

      <p className="text-sm text-ink2 whitespace-pre-wrap line-clamp-4">{post.content}</p>

      {post.scheduledAt && (
        <p className="text-xs text-ink3 flex items-center gap-1.5">
          <Calendar size={12} /> {dateTimeLabel(post.scheduledAt)}
        </p>
      )}
      {post.status === 'echec' && post.error && (
        <p className="text-xs text-danger flex items-center gap-1.5"><AlertTriangle size={12} /> {post.error}</p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        <button onClick={copyAndOpen} className="btn-ghost !py-2 flex-1 text-xs">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copié' : 'Copier & ouvrir'}
        </button>
        {post.status !== 'publie' && (
          <button onClick={onPublish} className="btn-primary !py-2 !px-3 text-xs" title="Marquer comme publié">
            <Send size={15} />
          </button>
        )}
        <button onClick={onEdit} className="btn-ghost !py-2 !px-3 text-xs">Modifier</button>
        <button onClick={onDelete} className="p-2 rounded-lg text-ink4 hover:text-danger hover:bg-danger/10">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: PostStatus }) {
  const style: Record<PostStatus, string> = {
    brouillon: 'border-line bg-bg-hover text-ink3',
    programme: 'border-warn/30 bg-warn/10 text-warn',
    publie: 'border-ok/30 bg-ok/10 text-ok',
    echec: 'border-danger/30 bg-danger/10 text-danger',
  }
  return <span className={`chip ${style[status]}`}>{POST_STATUS_LABELS[status]}</span>
}

function PostModal({
  open,
  onClose,
  editing,
  presetDate,
  onSave,
}: {
  open: boolean
  onClose: () => void
  editing: Post | null
  presetDate: Date | null
  onSave: (p: Post) => void
}) {
  const { settings } = useApp()
  const [content, setContent] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook'])
  const [mediaUrl, setMediaUrl] = useState('')
  const [schedule, setSchedule] = useState(false)
  const [when, setWhen] = useState('')
  const [showAssist, setShowAssist] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [objectif, setObjectif] = useState<Objectif>('promo')
  const [sujet, setSujet] = useState('')

  useEffect(() => {
    if (open) {
      setContent(editing?.content ?? '')
      setPlatforms(editing?.platforms ?? ['facebook'])
      setMediaUrl(editing?.mediaUrl ?? '')
      const presetISO = presetDate ? isoAt(presetDate, 9) : null
      setSchedule(!!editing?.scheduledAt || !!presetDate)
      setWhen(
        editing?.scheduledAt ? editing.scheduledAt.slice(0, 16) : presetISO ?? defaultWhen(),
      )
      setShowAssist(!editing)
      setSujet('')
    }
  }, [open, editing, presetDate])

  function togglePlatform(pl: Platform) {
    setPlatforms((cur) => (cur.includes(pl) ? cur.filter((x) => x !== pl) : [...cur, pl]))
  }

  function generer() {
    setContent(generateCaption(objectif, sujet, settings.businessName))
  }
  function ajouterHashtags() {
    const tags = generateHashtags(objectif, sujet)
    setContent((c) => (c.trim() ? `${c.trim()}\n\n${tags}` : tags))
  }

  const valid = content.trim().length > 0 && platforms.length > 0 && (!schedule || !!when)

  function save() {
    if (!valid) return
    onSave({
      id: editing?.id ?? uid(),
      platforms,
      content: content.trim(),
      mediaUrl: mediaUrl.trim(),
      scheduledAt: schedule ? new Date(when).toISOString() : null,
      status: schedule ? 'programme' : 'brouillon',
      createdAt: editing?.createdAt ?? nowISO(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier le post' : 'Nouveau post'}
      footer={
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annuler</button>
          <button className="btn-primary flex-1" disabled={!valid} onClick={save}>
            {schedule ? 'Programmer' : 'Enregistrer'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Plateformes">
          <div className="flex gap-2">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((pl) => (
              <button
                key={pl}
                onClick={() => togglePlatform(pl)}
                className={`btn flex-1 border ${platforms.includes(pl) ? PLATFORM_COLOR[pl] + ' ring-1 ring-inset ring-current' : 'bg-bg-hover text-ink3 border-line'}`}
              >
                {PLATFORM_ICON[pl]} {PLATFORM_LABELS[pl]}
              </button>
            ))}
          </div>
        </Field>

        {/* Assistant de rédaction */}
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] overflow-hidden">
          <button
            onClick={() => setShowAssist((s) => !s)}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-brand-soft"
          >
            <Wand2 size={16} /> Assistant de rédaction
            <span className="ml-auto text-xs text-ink3">{showAssist ? 'masquer' : 'afficher'}</span>
          </button>
          {showAssist && (
            <div className="px-3.5 pb-3.5 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setObjectif(t.objectif)
                      setContent(generateCaption(t.objectif, sujet, settings.businessName))
                    }}
                    className="chip border-line bg-white text-ink2 hover:border-brand hover:text-brand-soft"
                  >
                    {t.emoji} {t.title}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="input" value={objectif} onChange={(e) => setObjectif(e.target.value as Objectif)}>
                  {OBJECTIFS.map((o) => (
                    <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>
                  ))}
                </select>
                <input className="input" placeholder="Sujet (ex : nos jus)" value={sujet} onChange={(e) => setSujet(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button className="btn-blue flex-1 !py-2 text-xs" onClick={generer}><Wand2 size={14} /> Générer le texte</button>
                <button className="btn-ghost !py-2 text-xs" onClick={ajouterHashtags}># Hashtags</button>
              </div>
            </div>
          )}
        </div>

        <Field label="Texte du post">
          <textarea
            className="input min-h-[120px] leading-relaxed"
            placeholder="Rédigez votre publication, ou utilisez l'assistant ci-dessus…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <p className="text-xs text-ink3 mt-1">{content.length} caractères</p>
        </Field>

        <Field label="Image / vidéo (lien, optionnel)" hint="Collez l'URL d'une image à joindre.">
          <input className="input" placeholder="https://…" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
        </Field>

        {/* Aperçu */}
        <div>
          <button
            onClick={() => setShowPreview((s) => !s)}
            className="flex items-center gap-2 text-[13px] font-semibold text-ink3 mb-2"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />} {showPreview ? 'Masquer' : 'Afficher'} l’aperçu
          </button>
          {showPreview && <PostPreview businessName={settings.businessName} content={content} mediaUrl={mediaUrl} />}
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="w-4 h-4 accent-[#F24B5E]" />
          <span className="text-sm text-ink2">Programmer une date et heure</span>
        </label>

        {schedule && (
          <Field label="Quand publier">
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  )
}

function defaultWhen(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return localISO(d)
}
function isoAt(date: Date, hour: number): string {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return localISO(d)
}
function localISO(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.3 3h-3.05v12.4a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.77.12V9.8a5.7 5.7 0 0 0-.77-.05 5.65 5.65 0 1 0 5.65 5.65V9.01a7.3 7.3 0 0 0 4.3 1.38V7.34a4.28 4.28 0 0 1-3-1.52z" />
    </svg>
  )
}
