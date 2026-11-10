import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'

export function Stack() {
  return (
    <section id="stack" className="section">
      <div className="container">
        <SectionHead index="03" label="Stack" title="The tools I reach for every day." />
        <ul className="skills">
          {portfolio.skills.map((s) => (
            <li key={s.name} className="skill reveal">
              <span className="skill-tag">{s.tag}</span>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
