import { useEffect, useRef, useState } from 'react'
import { money } from '../lib/format'

/** Nombre qui « compte » jusqu'à sa valeur (effet dynamique). */
export function AnimatedNumber({
  value,
  currency,
  duration = 900,
  plain = false,
}: {
  value: number
  currency?: string
  duration?: number
  plain?: boolean
}) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const to = value
    const start = performance.now()
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const v = from + (to - from) * easeOut(t)
      setDisplay(v)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  const rounded = Math.round(display)
  if (plain) return <>{new Intl.NumberFormat('fr-FR').format(rounded)}</>
  return <>{money(rounded, currency)}</>
}
