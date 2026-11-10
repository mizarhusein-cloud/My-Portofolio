import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { Odometer } from './Odometer'
import { useInViewOnce } from '../hooks/useInViewOnce'

export function Education() {
  const { education, certificates, languages } = portfolio
  const [extrasRef, play] = useInViewOnce<HTMLDivElement>(0.4)

  return (
    <section id="education" className="section">
      <div className="container">
        <SectionHead index="04" label="Education" title="Learning by building, and by studying the people I build for." />
        <ul className="edu-grid">
          {education.map((ed) => (
            <li key={ed.school} className="edu-card reveal">
              <div className="edu-top">
                <span className="edu-period">{ed.period}</span>
                <span className={`edu-badge${ed.status === 'In progress' ? ' is-progress' : ''}`}>
                  <i aria-hidden="true" />
                  {ed.status}
                </span>
              </div>
              <h3 className="edu-school">{ed.school}</h3>
              <p className="edu-program">{ed.program}</p>
              <p className="edu-text">{ed.text}</p>
            </li>
          ))}
        </ul>

        <div className="edu-extras" ref={extrasRef}>
          <div className="reveal">
            <h3 className="edu-extras-title">Certificates</h3>
            <ul className="mini-cards">
              {certificates.map((c) => {
                const score = c.detail.match(/^Score (\d+)$/)?.[1]
                return (
                  <li key={c.name} className="mini-card">
                    <span className="mini-name">{c.name}</span>
                    {score ? (
                      <span className="mini-score">
                        <span className="sr-only">Score {score}</span>
                        <Odometer value={score} play={play} />
                        <small>score</small>
                      </span>
                    ) : (
                      <span className="mini-detail">{c.detail}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="reveal">
            <h3 className="edu-extras-title">Languages</h3>
            <ul className="mini-cards">
              {languages.map((l) => {
                const [name, level] = l.split(' — ')
                return (
                  <li key={l} className="mini-card">
                    <span className="mini-name">{name}</span>
                    <span className="mini-detail">{level}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
