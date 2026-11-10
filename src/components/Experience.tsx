import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { useScrollProgress } from '../hooks/useScrollProgress'

/** Bold the figures in a task ("100+", "50–200+") so they catch the eye. */
function highlightNumbers(text: string): ReactNode[] {
  return text.split(/(\d[\d,.]*(?:[–-]\d[\d,.]*)?\+?)/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

export function Experience() {
  const jobs = portfolio.experience
  const lineRef = useScrollProgress<HTMLOListElement>()
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const [reached, setReached] = useState<boolean[]>(() => jobs.map(() => false))
  // Touch screens have no hover, so a tap opens a row instead.
  const [tapped, setTapped] = useState<number | null>(null)

  // Light up each dot once the scroll-drawn line has passed it.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = rowRefs.current.indexOf(e.target as HTMLLIElement)
          setReached((prev) => (prev[i] ? prev : prev.map((v, k) => (k === i ? true : v))))
        }
      },
      { rootMargin: '0px 0px -45% 0px' },
    )
    rowRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const canHover = () => window.matchMedia('(hover: hover)').matches

  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHead index="03" label="Experience" title="Five years of serving people, now building for them." />
        <p className="section-intro reveal">
          Before code, I spent five years in banking and international hospitality. It taught me accuracy under pressure,
          clear communication and how real users think — habits I bring to every interface I build.
        </p>
        <ol className="xp reveal" ref={lineRef}>
          {jobs.map((job, i) => {
            const open = tapped === i
            const year = job.period.match(/\d{4}/)?.[0] ?? ''
            return (
              <li
                key={job.company}
                ref={(el) => {
                  rowRefs.current[i] = el
                }}
                className={`xp-row${reached[i] ? ' is-reached' : ''}${open ? ' is-open' : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                <button
                  type="button"
                  className="xp-head"
                  aria-expanded={open}
                  onClick={() => {
                    if (!canHover()) setTapped(open ? null : i)
                  }}
                >
                  <span className="xp-dot" aria-hidden="true" />
                  <span className="xp-year" aria-hidden="true">
                    {year}
                  </span>
                  <span className="xp-main">
                    <span className="xp-role">{job.role}</span>
                    <span className="xp-company">{job.company}</span>
                  </span>
                  <span className="xp-when">
                    <span className="xp-period">{job.period}</span>
                    <span className="xp-place">{job.location}</span>
                  </span>
                </button>
                <div className="xp-more">
                  <div>
                    <ul className="xp-tasks">
                      {job.points.map((pt, k) => (
                        <li key={pt} style={{ '--k': k } as CSSProperties}>
                          {highlightNumbers(pt)}
                        </li>
                      ))}
                    </ul>
                    <p className="xp-code">
                      <span>In my code</span>
                      {job.inCode}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
        <p className="xp-hint" aria-hidden="true">
          <span className="hint-pointer">Hover a role to see what I did there.</span>
          <span className="hint-touch">Tap a role to see what I did there.</span>
        </p>
      </div>
    </section>
  )
}
