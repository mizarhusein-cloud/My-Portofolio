import { useEffect, useRef, type RefObject } from 'react'
import type { SakuraScene } from '../sakura/SakuraScene'

/**
 * Canvas for the 3D sakura tree. The Three.js scene is only downloaded when the
 * Contact section gets close to the viewport, and fully disposed on unmount.
 * `hostRef` is the section the tree listens to for pointer events.
 */
export function SakuraTree({ hostRef, dark }: { hostRef: RefObject<HTMLElement | null>; dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SakuraScene | null>(null)
  const darkRef = useRef(dark)
  darkRef.current = dark

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let cancelled = false

    const load = () =>
      import('../sakura/SakuraScene')
        .then(({ SakuraScene }) => {
          if (cancelled) return
          sceneRef.current = new SakuraScene(canvas, host, darkRef.current)
          host.classList.add('sakura-ready')
        })
        .catch(() => {
          // No WebGL (or the chunk failed): the section falls back to a plain text layout.
          host.classList.add('no-sakura')
        })

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        load()
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(host)

    return () => {
      cancelled = true
      io.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
      host.classList.remove('sakura-ready')
    }
  }, [hostRef])

  useEffect(() => {
    sceneRef.current?.setDark(dark)
  }, [dark])

  return <canvas ref={canvasRef} className="sakura-canvas" aria-hidden="true" />
}
