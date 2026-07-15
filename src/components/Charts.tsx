import { moneyShort } from '../lib/format'

/** Barres groupées entrées / sorties par période. */
export function GroupedBars({
  data,
  currency,
  height = 150,
}: {
  data: { label: string; entree: number; sortie: number }[]
  currency: string
  height?: number
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.entree, d.sortie]))
  return (
    <div>
      <div className="flex items-end gap-3 sm:gap-4" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
            <div className="w-full flex items-end justify-center gap-1" style={{ height: height - 22 }}>
              <Bar value={d.entree} max={max} className="bg-ok/80" title={`Entrées : ${moneyShort(d.entree, currency)}`} />
              <Bar value={d.sortie} max={max} className="bg-danger/80" title={`Sorties : ${moneyShort(d.sortie, currency)}`} />
            </div>
            <span className="text-[10px] text-slate-500 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-ok/80" /> Entrées</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-danger/80" /> Sorties</span>
      </div>
    </div>
  )
}

function Bar({ value, max, className, title }: { value: number; max: number; className: string; title: string }) {
  const h = value <= 0 ? 2 : Math.max(4, (value / max) * 100)
  return (
    <div
      title={title}
      className={`w-3 sm:w-4 rounded-t-md transition-all ${className}`}
      style={{ height: `${h}%` }}
    />
  )
}

/** Anneau de progression simple (pour un pourcentage). */
export function Ring({ value, size = 64, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#233049" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#818cf8"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  )
}
