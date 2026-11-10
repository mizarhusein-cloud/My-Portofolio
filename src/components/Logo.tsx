import { portfolio } from '../data/portfolio'

export function Logo() {
  return (
    <span className="logo" aria-label={`${portfolio.brand}.dev`}>
      <span className="logo-word">{portfolio.brand.toUpperCase()}</span>
      <span className="logo-tld">.dev</span>
    </span>
  )
}
