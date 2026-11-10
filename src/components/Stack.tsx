import type { CSSProperties } from 'react'
import {
  siHtml5,
  siJavascript,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPostman,
  siRailway,
  siReact,
  siSwagger,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from 'simple-icons'
import { portfolio, type Tool } from '../data/portfolio'
import { SectionHead } from './SectionHead'

// Logos come from Simple Icons (CC0). Only the icons imported here end up in the bundle.
const ICONS: Record<string, SimpleIcon> = {
  html5: siHtml5,
  javascript: siJavascript,
  nestjs: siNestjs,
  nextdotjs: siNextdotjs,
  nodedotjs: siNodedotjs,
  postgresql: siPostgresql,
  postman: siPostman,
  railway: siRailway,
  react: siReact,
  swagger: siSwagger,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
}

/** Relative luminance of a hex colour, used to keep brand colours readable. */
function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ToolChip({ tool }: { tool: Tool }) {
  const icon = ICONS[tool.icon]
  if (!icon) return null
  const lum = luminance(icon.hex)
  // Near-black logos (Next.js, Railway) keep the text colour instead of vanishing on dark mode.
  const style = {
    '--brand': lum > 0.9 ? 'currentColor' : `#${icon.hex}`,
    '--brand-dark': lum < 0.03 ? 'currentColor' : `#${icon.hex}`,
  } as CSSProperties
  return (
    <li className="tool" style={style}>
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d={icon.path} />
      </svg>
      <span className="tool-name">{tool.name}</span>
    </li>
  )
}

function Ribbon({ tools, reverse, speed }: { tools: Tool[]; reverse?: boolean; speed: string }) {
  // Repeat the set so one track is always wider than even a very wide screen,
  // then render the track twice so the loop is seamless.
  const loop = [...tools, ...tools]
  const track = (
    <ul className="ribbon-track">
      {loop.map((t, i) => (
        <ToolChip key={`${t.name}-${i}`} tool={t} />
      ))}
    </ul>
  )
  return (
    <div className={`ribbon${reverse ? ' is-reverse' : ''}`} style={{ '--ribbon-speed': speed } as CSSProperties} aria-hidden="true">
      {track}
      {track}
    </div>
  )
}

export function Stack() {
  const { stack } = portfolio
  const half = Math.ceil(stack.length / 2)

  return (
    <section id="stack" className="section">
      <div className="container">
        <SectionHead index="05" label="Stack" title="The tools I reach for every day." />
        {/* The moving ribbon is decorative; screen readers get this plain list. */}
        <ul className="sr-only">
          {stack.map((t) => (
            <li key={t.name}>{t.name}</li>
          ))}
        </ul>
        <div className="ribbons reveal">
          <Ribbon tools={stack.slice(0, half)} speed="44s" />
          <Ribbon tools={stack.slice(half)} speed="52s" reverse />
        </div>
        <p className="stack-note hint-pointer">Hover the ribbon to pause it.</p>
      </div>
    </section>
  )
}
