import { useRef } from 'react'
import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { SakuraTree } from './SakuraTree'
import { ArrowUpRight } from './Icons'

export function Contact({ dark }: { dark: boolean }) {
  const { contact } = portfolio
  const sectionRef = useRef<HTMLElement>(null)
  return (
    <section id="contact" className="section contact" ref={sectionRef}>
      <SakuraTree hostRef={sectionRef} dark={dark} />
      <div className="container">
        <SectionHead index="06" label="Contact" />
        <div className="contact-copy">
          <h2 className="contact-title reveal">{contact.title}</h2>
          <p className="contact-text reveal">{contact.text}</p>
          <div className="contact-actions reveal">
            <a className="btn btn-solid btn-lg" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            <a className="btn btn-outline btn-lg" href={contact.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn <ArrowUpRight />
            </a>
          </div>
          <p className="contact-hint">
            <span className="hint-pointer">Hover over the trunk or a branch to shake loose a few blossoms.</span>
            <span className="hint-touch">Tap the tree to shake loose a few blossoms.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
