import { moneyShort } from '../lib/format'

/** Mini-courbe (aire) — pour cartes et en-têtes. */
export function Sparkline({
  data,
  color = '#F24B5E',
  width = 120,
  height = 36,
  strokeWidth = 2,
  fill = true,
  full = false,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
  fill?: boolean
  full?: boolean
}) {
  const pts = data.length ? data : [0, 0]
  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const span = max - min || 1
  const stepX = width / (pts.length - 1 || 1)
  const y = (v: number) => height - 4 - ((v - min) / span) * (height - 8)
  const coords = pts.map((v, i) => [i * stepX, y(v)] as const)
  const line = coords.map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = `sg-${color.replace('#', '')}-${full ? 'f' : 's'}`
  const svgProps = full
    ? { width: '100%', height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none' as const }
    : { width, height }
  return (
    <svg {...svgProps} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={full ? '0.28' : '0.22'} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        className="spark-draw"
      />
    </svg>
  )
}

/** Barres groupées entrées / sorties par période (dégradées, ligne de base). */
export function GroupedBars({
  data,
  currency,
  height = 160,
}: {
  data: { label: string; entree: number; sortie: number }[]
  currency: string
  height?: number
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.entree, d.sortie]))
  return (
    <div>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="barIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22c07e" />
            <stop offset="1" stopColor="#12a150" />
          </linearGradient>
          <linearGradient id="barOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fb6a62" />
            <stop offset="1" stopColor="#f0433a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-end gap-3 sm:gap-4 border-b border-line" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
            <div className="w-full flex items-end justify-center gap-1.5" style={{ height: height - 22 }}>
              <Bar value={d.entree} max={max} gradient="url(#barIn)" title={`Entrées : ${moneyShort(d.entree, currency)}`} />
              <Bar value={d.sortie} max={max} gradient="url(#barOut)" title={`Sorties : ${moneyShort(d.sortie, currency)}`} />
            </div>
            <span className="text-[10px] font-semibold text-ink4 truncate w-full text-center capitalize">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center text-[11px] font-medium text-ink3">
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: '#12a150' }} /> Entrées</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f0433a' }} /> Sorties</span>
      </div>
    </div>
  )
}

function Bar({ value, max, gradient, title }: { value: number; max: number; gradient: string; title: string }) {
  const pct = value <= 0 ? 0 : Math.max(4, (value / max) * 100)
  return (
    <svg width="18" height="100%" viewBox="0 0 18 100" preserveAspectRatio="none" className="w-3.5 sm:w-5 overflow-visible">
      <title>{title}</title>
      <rect x="0" y={100 - pct} width="18" height={pct} rx="4" fill={gradient} />
    </svg>
  )
}

/** Anneau de progression simple. */
export function Ring({ value, size = 64, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6E9EF" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F24B5E" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
    </svg>
  )
}
