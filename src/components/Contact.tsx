import { portfolio } from '../data/portfolio'
import { SectionHead } from './SectionHead'
import { ArrowUpRight } from './Icons'

export function Contact() {
  const { contact } = portfolio
  return (
    <section id="contact" className="section contact">
      <div className="container">
        <SectionHead index="06" label="Contact" />
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
      </div>
    </section>
  )
}
