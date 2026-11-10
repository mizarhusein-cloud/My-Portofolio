import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { portfolio, type Project } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { ArrowLeft, ArrowRight, ArrowUpRight } from './Icons'

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function Preview({ project }: { project: Project }) {
  const frame = (
    <>
      <span className="browser-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="browser-url">{project.liveUrl ? hostOf(project.liveUrl) : 'coming soon'}</span>
      </span>
      <span className="preview-img">
        <img src={project.image} alt={`Preview of ${project.title}`} loading="lazy" decoding="async" width={1280} height={800} />
        {project.liveUrl ? (
          <span className="preview-hover" aria-hidden="true">
            Visit live site <ArrowUpRight />
          </span>
        ) : (
          <span className="preview-badge">Live demo soon</span>
        )}
      </span>
    </>
  )

  return project.liveUrl ? (
    <a
      className="preview is-link"
      href={project.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${project.title} live site (opens in a new tab)`}
    >
      {frame}
    </a>
  ) : (
    <div className="preview">{frame}</div>
  )
}

export function Work() {
  const { projects } = portfolio
  const trackRef = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  const total = projects.length
  const pad = (n: number) => String(n).padStart(2, '0')

  // Track which slide is most visible as the user swipes or scrolls.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.children) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(slides.indexOf(e.target as HTMLElement))
        }
      },
      { root: track, threshold: [0.6] },
    )
    slides.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  const goTo = useCallback((i: number) => {
    const track = trackRef.current
    if (!track) return
    const index = Math.max(0, Math.min(total - 1, i))
    const slide = track.children[index] as HTMLElement
    track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
    setActive(index)
  }, [total])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(active - 1)
    }
  }

  return (
    <section id="work" className="section">
      <div className="container">
        <SectionHead index="01" label="Selected work" title="Things I've designed and built." />

        <div className="carousel reveal" role="region" aria-roledescription="carousel" aria-label="Projects" onKeyDown={onKeyDown}>
          <ol className="carousel-track" ref={trackRef}>
            {projects.map((p, i) => (
              <li
                key={p.title}
                className={`slide${i === active ? ' is-active' : ''}`}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}: ${p.title}`}
              >
                <Preview project={p} />
                <div className="slide-info">
                  <div className="slide-head">
                    <span className="project-num">
                      {pad(i + 1)} / {pad(total)}
                    </span>
                    <span className="slide-meta">
                      {p.type} · {p.year}
                    </span>
                  </div>
                  <h3 className="project-title">
                    {p.liveUrl ? (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </h3>
                  <p className="project-desc">{p.description}</p>
                  <ul className="tags" aria-label="Tech stack">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>

          <div className="carousel-controls">
            <div className="carousel-dots" role="tablist" aria-label="Choose project">
              {projects.map((p, i) => (
                <button
                  key={p.title}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Show ${p.title}`}
                  className={i === active ? 'is-active' : ''}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <span className="carousel-count" aria-live="polite">
              {pad(active + 1)} / {pad(total)}
            </span>
            <div className="carousel-arrows">
              <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous project">
                <ArrowLeft />
              </button>
              <button type="button" onClick={() => goTo(active + 1)} disabled={active === total - 1} aria-label="Next project">
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
