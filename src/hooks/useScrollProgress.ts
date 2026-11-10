import { useEffect, useRef } from 'react'

/**
 * Writes how far the user has scrolled through an element into the CSS
 * variable --progress (0 → 1). The line starts filling when the element's top
 * reaches the middle of the screen and is full when its bottom does.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const mid = window.innerHeight * 0.55
      const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)))
      el.style.setProperty('--progress', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return ref
}
