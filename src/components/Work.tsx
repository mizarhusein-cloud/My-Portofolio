import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
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

/** Shortest signed distance from the active slide, wrapping around the ends. */
function offsetOf(i: number, active: number, total: number) {
  let d = (((i - active) % total) + total) % total
  if (d > total / 2) d -= total
  // With exactly two projects, always show the other one on the right.
  if (total === 2 && d === -1) d = 1
  return d
}

function Card({ project, index, total }: { project: Project; index: number; total: number }) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const media = (
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

  return (
    <>
      {project.liveUrl ? (
        <a
          className="preview is-link"
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${project.title} live site (opens in a new tab)`}
        >
          {media}
        </a>
      ) : (
        <div className="preview">{media}</div>
      )}
      <div className="card-info">
        <div className="slide-head">
          <span className="project-num">
            {pad(index + 1)} / {pad(total)}
          </span>
          <span className="slide-meta">
            {project.type} · {project.year}
          </span>
        </div>
        <h3 className="project-title">
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h3>
        <p className="project-desc">{project.description}</p>
        <ul className="tags" aria-label="Tech stack">
          {project.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function Work() {
  const { projects } = portfolio
  const total = projects.length
  const [active, setActive] = useState(0)
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  const swiped = useRef(false)
  const pad = (n: number) => String(n).padStart(2, '0')

  const goTo = useCallback((i: number) => setActive(((i % total) + total) % total), [total])
  const next = () => goTo(active + 1)
  const prev = () => goTo(active - 1)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  // Horizontal swipe on touch screens (and mouse drag) changes the project.
  const onPointerDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true
      if (dx < 0) next()
      else prev()
    }
  }

  return (
    <section id="work" className="section">
      <div className="container">
        <SectionHead index="01" label="Selected work" title="Things I've designed and built." />

        <div
          className="carousel reveal"
          role="region"
          aria-roledescription="carousel"
          aria-label="Projects"
          onKeyDown={onKeyDown}
        >
          <ol
            className="cf-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (drag.current = null)}
            onClickCapture={(e) => {
              // A swipe must not also open the live site underneath the pointer.
              if (swiped.current) {
                e.preventDefault()
                e.stopPropagation()
                swiped.current = false
              }
            }}
            onDragStart={(e) => e.preventDefault()}
          >
            {projects.map((p, i) => {
              const offset = offsetOf(i, active, total)
              const isActive = offset === 0
              const pos = Math.abs(offset) > 1 ? 'far' : offset === 0 ? 'center' : offset < 0 ? 'left' : 'right'
              return (
                <li
                  key={p.title}
                  className={`cf-card is-${pos}`}
                  style={{ '--dir': Math.sign(offset) } as CSSProperties}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${total}: ${p.title}`}
                  aria-hidden={!isActive}
                >
                  <div className="cf-inner" inert={!isActive}>
                    <Card project={p} index={i} total={total} />
                  </div>
                  {!isActive && pos !== 'far' && (
                    <button type="button" className="cf-hit" tabIndex={-1} aria-label={`Show ${p.title}`} onClick={() => goTo(i)} />
                  )}
                </li>
              )
            })}
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
              <button type="button" onClick={prev} disabled={total < 2} aria-label="Previous project">
                <ArrowLeft />
              </button>
              <button type="button" onClick={next} disabled={total < 2} aria-label="Next project">
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
