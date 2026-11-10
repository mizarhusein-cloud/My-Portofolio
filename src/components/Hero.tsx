import { useEffect, useRef } from 'react'
import type { KoiPond } from '../koi/KoiPond'
import { portfolio } from '../data/portfolio'
import { ArrowDown } from './Icons'

export function Hero({ dark }: { dark: boolean }) {
  const hostRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pondRef = useRef<KoiPond | null>(null)
  const darkRef = useRef(dark)
  darkRef.current = dark

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let cancelled = false
    // Three.js is loaded on demand so the page text paints before the 3D scene.
    import('../koi/KoiPond')
      .then(({ KoiPond }) => {
        if (cancelled) return
        pondRef.current = new KoiPond(canvas, host, darkRef.current)
        host.classList.add('pond-ready')
      })
      .catch(() => {
        // WebGL or the chunk is unavailable — the hero still works as a plain text header.
        host.classList.add('no-webgl')
      })
    return () => {
      cancelled = true
      pondRef.current?.dispose()
      pondRef.current = null
    }
  }, [])

  useEffect(() => {
    pondRef.current?.setDark(dark)
  }, [dark])

  return (
    <section id="top" className="hero" ref={hostRef} aria-label="Introduction">
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
      <div className="container hero-content">
        <p className="eyebrow">
          {portfolio.role} — {portfolio.location}
        </p>
        <h1 className="hero-title">
          {portfolio.hero.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="hero-sub">{portfolio.hero.sub}</p>
        <div className="hero-actions">
          <a className="btn btn-solid" href="#work">
            View my work
          </a>
          <a className="btn btn-outline" href="#contact">
            Get in touch
          </a>
        </div>
      </div>
      <div className="container hero-foot">
        <a className="scroll-cue" href="#work">
          <ArrowDown /> Scroll
        </a>
        <span className="hero-hint">Move your cursor — the koi follow. Click the pond to feed them.</span>
      </div>
    </section>
  )
}
