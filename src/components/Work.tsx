import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { ArrowUpRight } from './Icons'

export function Work() {
  const { projects } = portfolio
  const total = String(projects.length).padStart(2, '0')

  return (
    <section id="work" className="section">
      <div className="container">
        <SectionHead index="01" label="Selected work" title="Things I've designed and built." />
        <ol className="project-list">
          {projects.map((p, i) => {
            const num = `${String(i + 1).padStart(2, '0')} / ${total}`
            const body = (
              <>
                <span className="project-num">{num}</span>
                <div className="project-main">
                  <h3 className="project-title">{p.title}</h3>
                  <p className="project-desc">{p.description}</p>
                  <ul className="tags" aria-label="Tech stack">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="project-meta">
                  <span>{p.type}</span>
                  <span>{p.year}</span>
                  {p.liveUrl ? (
                    <span className="project-cta">
                      Visit live site <ArrowUpRight />
                    </span>
                  ) : (
                    <span className="project-soon">Live demo soon</span>
                  )}
                </div>
              </>
            )
            return (
              <li key={p.title} className="reveal">
                {p.liveUrl ? (
                  <a className="project" href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                    {body}
                  </a>
                ) : (
                  <div className="project">{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
