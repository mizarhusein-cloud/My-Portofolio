import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

const DIGITS = '0123456789'

/**
 * Odometer-style number: every digit is a vertical strip of numerals that
 * rolls up to its target. Lower digits spin through extra full turns so the
 * motion reads like a real mechanical counter.
 *
 * Each digit window is sized to the target digit's natural width (measured
 * from the real font), so the settled number looks exactly like plain text.
 */
export function Odometer({ value, suffix = '', play }: { value: string; suffix?: string; play: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const digits = value.split('')
  const len = digits.length
  const [widths, setWidths] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const cs = getComputedStyle(el)
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx) return
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      const fontSize = parseFloat(cs.fontSize) || 16
      const spacing = parseFloat(cs.letterSpacing) || 0
      // Store widths in em so they stay right when the font size changes responsively.
      setWidths(value.split('').map((d) => (ctx.measureText(d).width + spacing) / fontSize))
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <span ref={ref} className={`odo${play ? ' is-playing' : ''}`} aria-hidden="true">
      {digits.map((d, i) => {
        const place = len - 1 - i // 0 = ones, 1 = tens, ...
        const target = Number(d)
        const loops = place === 0 ? (len > 1 ? 2 : 1) : place === 1 ? 1 : 0
        const strip = DIGITS.repeat(loops) + DIGITS.slice(0, target + 1)
        const steps = strip.length - 1
        const leading = i < len - 1
        const width = widths ? `${widths[i]}em` : '0.62em'
        const style = {
          '--odo-delay': `${place * 0.08}s`,
          '--odo-dur': `${1.8 - place * 0.15}s`,
          // Leading digits grow in from zero width, so the count starts at "0".
          width: leading && !play ? 0 : width,
        } as CSSProperties
        return (
          <span key={i} className={`odo-col${leading ? ' is-leading' : ''}`} style={style}>
            <span className="odo-strip" style={{ transform: play ? `translateY(-${steps}em)` : 'translateY(0)' }}>
              {strip.split('').map((n, k) => (
                <span key={k} className="odo-cell">
                  {n}
                </span>
              ))}
            </span>
          </span>
        )
      })}
      {suffix && <span className="odo-suffix">{suffix}</span>}
    </span>
  )
}
