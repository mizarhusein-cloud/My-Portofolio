import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'

export function About() {
  const { about, projects, skills } = portfolio
  const stats = [
    { value: String(projects.length), label: 'Projects built' },
    { value: String(skills.length), label: 'Core tools' },
    { value: '100%', label: 'Hands-on' },
    { value: '∞', label: 'Curiosity' },
  ]

  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHead index="02" label="About" />
        <div className="about-grid">
          <h2 className="about-title reveal">{about.title}</h2>
          <div className="about-copy reveal">
            <p className="lead">{about.lead}</p>
            <p>{about.body}</p>
          </div>
        </div>
        <dl className="stats reveal">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="highlights">
          {about.highlights.map((h) => (
            <li key={h.title} className="reveal">
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
