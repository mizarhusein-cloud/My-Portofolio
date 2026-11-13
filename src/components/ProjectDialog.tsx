import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { portfolio, type Project } from '../data/portfolio'
import { ArrowLeft, ArrowRight, ArrowUpRight, CloseIcon } from './Icons'

const pad = (n: number) => String(n).padStart(2, '0')

/** Screenshot viewer: one large image with arrows and a caption, thumbnails underneath. */
function Gallery({ project }: { project: Project }) {
  const shots = project.gallery
  const [i, setI] = useState(0)
  const total = shots.length
  const go = (n: number) => setI(((n % total) + total) % total)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(i + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(i - 1)
    }
  }

  return (
    <div className="pd-gallery" role="group" aria-roledescription="gallery" aria-label={`${project.title} screenshots`} onKeyDown={onKeyDown}>
      <figure className="pd-shot">
        <div className="pd-frame">
          {shots.map((s, n) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.caption}
              className={n === i ? 'is-active' : ''}
              aria-hidden={n !== i}
              loading={n === 0 ? 'eager' : 'lazy'}
              decoding="async"
              width={1280}
              height={800}
            />
          ))}
          {total > 1 && (
            <>
              <button type="button" className="pd-nav is-prev" onClick={() => go(i - 1)} aria-label="Previous screenshot">
                <ArrowLeft />
              </button>
              <button type="button" className="pd-nav is-next" onClick={() => go(i + 1)} aria-label="Next screenshot">
                <ArrowRight />
              </button>
            </>
          )}
        </div>
        <figcaption aria-live="polite">
          <span>{shots[i].caption}</span>
          <span className="pd-count">
            {pad(i + 1)} / {pad(total)}
          </span>
        </figcaption>
      </figure>
      {total > 1 && (
        <div className="pd-thumbs" role="tablist" aria-label="Choose screenshot">
          {shots.map((s, n) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={s.caption}
              className={n === i ? 'is-active' : ''}
              onClick={() => go(n)}
            >
              <img src={s.src} alt="" loading="lazy" decoding="async" width={160} height={100} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  project: Project | null
  index: number
  total: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Case-study dialog for one project: gallery, role & scope, then
 * Background → Method / Strategy / Solution → Result / Output.
 * Built on the native <dialog> element, so focus is trapped, Escape closes it
 * and the rest of the page is inert while it is open.
 */
export function ProjectDialog({ project, index, total, onClose, onNavigate }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const open = project !== null

  // The parent's state is the source of truth: open the dialog when a project is set,
  // close it (and unlock page scroll) when it is cleared.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    document.documentElement.classList.toggle('dialog-open', open)
  }, [open])

  useEffect(() => () => document.documentElement.classList.remove('dialog-open'), [])

  // Start each project at the top.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [index])

  // Every way out (close button, backdrop, Escape) goes through the parent's state,
  // rather than relying on the dialog's asynchronous `close` event.
  const requestClose = () => onClose()

  if (!project) return <dialog ref={ref} className="pd" />
  const d = project.details
  const prevI = (index - 1 + total) % total
  const nextI = (index + 1) % total

  return (
    <dialog
      ref={ref}
      className="pd"
      aria-labelledby="pd-title"
      onCancel={(e) => {
        // Escape key
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes the dialog.
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div className="pd-panel" ref={bodyRef}>
        <header className="pd-head">
          <div>
            <p className="pd-eyebrow">
              {pad(index + 1)} / {pad(total)} · {project.type} · {project.year}
            </p>
            <h2 id="pd-title" className="pd-title">
              {project.title}
            </h2>
          </div>
          <button type="button" className="pd-close" onClick={requestClose} aria-label="Close project details">
            <CloseIcon />
          </button>
        </header>

        <Gallery key={project.title} project={project} />

        <div className="pd-grid">
          <aside className="pd-aside">
            <dl className="pd-facts">
              <div>
                <dt>Role</dt>
                <dd>{d.role}</dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>{d.context}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{project.year}</dd>
              </div>
            </dl>
            <ul className="tags" aria-label="Tech stack">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {project.liveUrl ? (
              <a className="btn btn-solid pd-live" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                Visit live site <ArrowUpRight />
              </a>
            ) : (
              <span className="pd-soon">Live demo soon</span>
            )}

            <div className="pd-scope">
              <h3>Responsibilities &amp; scope</h3>
              <ul>
                {d.scope.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="pd-story">
            <section className="pd-block">
              <h3>
                <span>01</span> Background
              </h3>
              <p>{d.background}</p>
            </section>
            <section className="pd-block">
              <h3>
                <span>02</span> Method / Strategy / Solution
              </h3>
              <ul>
                {d.approach.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="pd-block">
              <h3>
                <span>03</span> Result / Output
              </h3>
              <ul>
                {d.results.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {total > 1 && (
          <nav className="pd-foot" aria-label="Other projects">
            <button type="button" onClick={() => onNavigate(prevI)}>
              <ArrowLeft />
              <span>
                <small>Previous project</small>
                <PrevNextTitle index={prevI} />
              </span>
            </button>
            <button type="button" className="is-next" onClick={() => onNavigate(nextI)}>
              <span>
                <small>Next project</small>
                <PrevNextTitle index={nextI} />
              </span>
              <ArrowRight />
            </button>
          </nav>
        )}
      </div>
    </dialog>
  )
}

function PrevNextTitle({ index }: { index: number }) {
  return <strong>{portfolio.projects[index].title}</strong>
}
