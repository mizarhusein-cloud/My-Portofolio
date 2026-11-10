import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { Odometer } from './Odometer'
import { useInViewOnce } from '../hooks/useInViewOnce'

type Stat = { label: string; value: string; suffix?: string; infinite?: boolean }

export function About() {
  const { about, projects, skills } = portfolio
  const [statsRef, play] = useInViewOnce<HTMLDListElement>(0.5)
  const stats: Stat[] = [
    { value: String(projects.length), label: 'Projects built' },
    { value: String(skills.length), label: 'Core tools' },
    { value: '100', suffix: '%', label: 'Hands-on' },
    { value: '∞', label: 'Curiosity', infinite: true },
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
        <dl className="stats" ref={statsRef}>
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <dt>{s.label}</dt>
              <dd>
                <span className="sr-only">
                  {s.value}
                  {s.suffix}
                </span>
                {s.infinite ? (
                  <span className={`odo-inf${play ? ' is-playing' : ''}`} aria-hidden="true">
                    {s.value}
                  </span>
                ) : (
                  <Odometer value={s.value} suffix={s.suffix} play={play} />
                )}
              </dd>
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
