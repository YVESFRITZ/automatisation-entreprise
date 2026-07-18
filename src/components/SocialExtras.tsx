import { Heart, MessageCircle, Send as SendIcon, MoreHorizontal, Image as ImageIcon } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { initials } from '../lib/format'
import type { Post } from '../lib/types'

// ── Aperçu réaliste d'une publication ───────────────────────────────
export function PostPreview({
  businessName,
  content,
  mediaUrl,
}: {
  businessName: string
  content: string
  mediaUrl?: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-card overflow-hidden shadow-soft max-w-sm mx-auto">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F76B7A] to-[#E42D43] grid place-items-center text-white text-xs font-bold">
          {initials(businessName || 'ME')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink truncate leading-tight">{businessName || 'Mon Entreprise'}</p>
          <p className="text-[11px] text-ink4">À l’instant · Public</p>
        </div>
        <MoreHorizontal size={18} className="text-ink4" />
      </div>

      {content && (
        <p className="px-3.5 pb-3 text-sm text-ink whitespace-pre-wrap leading-relaxed">{content}</p>
      )}

      {mediaUrl ? (
        <img
          src={mediaUrl}
          alt=""
          className="w-full aspect-square object-cover bg-bg-soft"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      ) : (
        <div className="w-full aspect-[16/10] bg-bg-soft grid place-items-center text-ink4">
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={26} />
            <span className="text-[11px]">Aperçu — ajoutez une image</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 px-3.5 py-2.5 text-ink3">
        <Heart size={19} />
        <MessageCircle size={19} />
        <SendIcon size={18} />
      </div>
    </div>
  )
}

// ── Calendrier mensuel des publications ─────────────────────────────
const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function MonthCalendar({
  month, // Date dans le mois affiché
  posts,
  onSelectDay,
  selectedDay,
}: {
  month: Date
  posts: Post[]
  onSelectDay: (d: Date) => void
  selectedDay: Date | null
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  const byDay = new Map<string, Post[]>()
  for (const p of posts) {
    if (!p.scheduledAt) continue
    const key = format(parseISO(p.scheduledAt), 'yyyy-MM-dd')
    byDay.set(key, [...(byDay.get(key) ?? []), p])
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {WD.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-ink4 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayPosts = byDay.get(key) ?? []
          const inMonth = isSameMonth(day, month)
          const selected = selectedDay && isSameDay(day, selectedDay)
          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition border ${
                selected
                  ? 'border-brand bg-brand/10 text-brand-soft font-bold'
                  : inMonth
                    ? 'border-transparent hover:bg-bg-hover text-ink'
                    : 'border-transparent text-ink4'
              } ${isToday(day) && !selected ? 'ring-1 ring-inset ring-brand/40' : ''}`}
            >
              <span className="tabular-nums">{format(day, 'd')}</span>
              {dayPosts.length > 0 && (
                <span className="flex gap-0.5">
                  {dayPosts.slice(0, 3).map((_, i) => (
                    <i key={i} className="w-1.5 h-1.5 rounded-full bg-brand" />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
