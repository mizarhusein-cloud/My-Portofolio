import { portfolio } from '../data/portfolio'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo />
        <p>
          © {new Date().getFullYear()} {portfolio.name}. Built with React, TypeScript and Three.js.
        </p>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
