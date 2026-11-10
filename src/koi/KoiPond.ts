import * as THREE from 'three'

/**
 * KoiPond — a procedural, top-down 3D koi pond rendered with Three.js.
 *
 * Every koi is generated in code (no model files): the body is a swept tube
 * that bends along a travelling sine wave, fins and tail are deformable grids
 * that follow the spine, and the skin is painted onto a canvas texture.
 *
 * Interaction: koi follow the pointer, and a click drops a food pellet with a
 * ripple — the nearest koi race to eat it.
 */

type Pattern = 'orange' | 'kohaku' | 'showa'

interface KoiOptions {
  length: number
  pattern: Pattern
  x: number
  depth: number
  z: number
  heading: number
  tailTint: string | null
  finTint: string | null
  phase: number
}

interface Koi {
  length: number
  group: THREE.Group
  pos: THREE.Vector3
  wanderTarget: THREE.Vector3
  newWanderTarget: () => void
  step: (dt: number, target: { x: number; z: number }, speed: number, all: Koi[]) => number
}

interface Food {
  mesh: THREE.Mesh
  age: number
}

interface Ripple {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  age: number
  maxScale: number
}

const LIGHT_FIN_TINT = 0xcbbba8
const TEX_W = 2048
const TEX_H = 1024

// Deterministic random so the koi patterns look the same on every visit.
function makeRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const hsl = (h: number, s: number, l: number) => `hsl(${h},${s}%,${l}%)`
const texX = (s: number) => s * TEX_W
const texY = (f: number) => 256 + Math.max(-1, Math.min(1, f)) * 243

function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Overlapping scale arcs, each with a dark edge and a light highlight. */
function paintScales(c: CanvasRenderingContext2D, strength: number, edge: string, s0: number, s1: number) {
  for (let row = 0, y = 0; y < 530; y += 14, row++) {
    for (let x = texX(s0) + (row % 2) * 25; x < texX(s1); x += 50) {
      c.fillStyle = `rgba(255,250,240,${0.08 * strength})`
      c.beginPath()
      c.ellipse(x, y, 28, 15, 0, -Math.PI / 2, Math.PI / 2)
      c.fill()
      c.strokeStyle = `rgba(${edge},${0.42 * strength})`
      c.lineWidth = 2.6
      c.beginPath()
      c.ellipse(x, y, 28, 15, 0, -Math.PI / 2, Math.PI / 2)
      c.stroke()
      c.strokeStyle = `rgba(255,238,200,${0.5 * strength})`
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(x - 7, y, 20, 10, 0, -1.2, 1.2)
      c.stroke()
    }
  }
}

function makeBodyTexture(pattern: Pattern, rnd: () => number) {
  const [cv, g] = canvas(TEX_W, TEX_H)
  const base = pattern === 'orange' ? '247,241,232' : '244,240,234'
  g.fillStyle = `rgb(${base})`
  g.fillRect(0, 0, TEX_W, TEX_H)

  // Darken the flanks so a white koi still reads against a white page.
  const rim = g.createLinearGradient(0, 0, 0, 512)
  rim.addColorStop(0, 'rgba(110,95,80,0.42)')
  rim.addColorStop(0.22, 'rgba(110,95,80,0)')
  rim.addColorStop(0.78, 'rgba(110,95,80,0)')
  rim.addColorStop(1, 'rgba(110,95,80,0.42)')
  g.fillStyle = rim
  g.fillRect(0, 0, TEX_W, 512)
  paintScales(g, 0.35, '120,108,96', 0.13, 0.97)

  // Colour patches live on their own layer so scales can be clipped to them.
  const [lc, l] = canvas(TEX_W, TEX_H)
  const red = () => hsl(2 + rnd() * 7, 80, 45 + rnd() * 6)
  const black = () => hsl(220, 8, 8 + rnd() * 6)
  const patch = (s0: number, s1: number, fc: number, fr: number, col: () => string, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = rnd()
      const s = s0 + t * (s1 - s0)
      const taper = Math.sin(Math.PI * t) * 0.5 + 0.5
      l.fillStyle = col()
      circle(l, texX(s), texY(fc + (rnd() * 2 - 1) * fr * taper), (26 + rnd() * 44) * taper)
    }
  }

  if (pattern === 'orange') {
    for (let k = 0; k < 420; k++) {
      const s = 0.1 + rnd() * 0.83
      const spread = 0.78 * (1 - (0.4 * (s - 0.1)) / 0.83)
      l.fillStyle = hsl(26 + rnd() * 12, 88 + rnd() * 8, 50 + rnd() * 9)
      circle(l, texX(s), texY((rnd() * 2 - 1) * spread), 32 + rnd() * 56)
    }
    for (let k = 0; k < 90; k++) {
      const s = 0.025 + rnd() * 0.12
      l.fillStyle = hsl(6 + rnd() * 8, 82, 50 + rnd() * 6)
      circle(l, texX(s), texY((rnd() * 2 - 1) * 0.55), 26 + rnd() * 40)
    }
  } else if (pattern === 'kohaku') {
    patch(0.03, 0.17, 0, 0.5, red, 60)
    patch(0.27, 0.5, 0.12, 0.75, red, 110)
    patch(0.6, 0.78, -0.1, 0.6, red, 70)
  } else {
    patch(0.03, 0.14, 0, 0.45, red, 40)
    patch(0.3, 0.42, -0.1, 0.6, red, 55)
    patch(0.6, 0.7, 0.12, 0.55, red, 45)
    patch(0.12, 0.26, 0.45, 0.55, black, 55)
    patch(0.44, 0.58, -0.4, 0.7, black, 80)
    patch(0.72, 0.88, 0.35, 0.6, black, 60)
    patch(0.2, 0.32, -0.65, 0.4, black, 30)
  }

  l.globalCompositeOperation = 'source-atop'
  paintScales(l, 1, '80,28,4', 0.13, 0.97)
  const shade = l.createLinearGradient(0, 0, 0, 512)
  shade.addColorStop(0, 'rgba(255,240,215,0.22)')
  shade.addColorStop(0.5, 'rgba(120,40,0,0.08)')
  shade.addColorStop(1, 'rgba(255,240,215,0.22)')
  l.fillStyle = shade
  l.fillRect(0, 0, TEX_W, 512)
  g.drawImage(lc, 0, 0)

  if (pattern === 'orange') {
    g.fillStyle = 'rgba(28,26,30,0.85)'
    for (const [x, y, r] of [[1300, 190, 18], [1324, 208, 14], [1282, 216, 12], [1440, 320, 16], [1462, 304, 12], [1610, 236, 10]]) {
      circle(g, x, y, r)
    }
    g.strokeStyle = 'rgba(255,252,246,0.92)'
    g.lineWidth = 9
    g.beginPath()
    g.moveTo(1000, 256)
    g.lineTo(2030, 256)
    g.stroke()
  }

  const nose = g.createLinearGradient(0, 0, 92, 0)
  nose.addColorStop(0, `rgba(${base},1)`)
  nose.addColorStop(1, `rgba(${base},0)`)
  g.fillStyle = nose
  g.fillRect(0, 0, 92, TEX_H)
  const tail = g.createLinearGradient(1860, 0, TEX_W, 0)
  tail.addColorStop(0, `rgba(${base},0)`)
  tail.addColorStop(1, `rgba(${base},1)`)
  g.fillStyle = tail
  g.fillRect(1860, 0, 188, TEX_H)

  const tex = new THREE.CanvasTexture(cv)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function makeBumpTexture() {
  const [cv, g] = canvas(1024, 512)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, 1024, 512)
  for (let row = 0, y = 0; y < 268; y += 7, row++) {
    for (let x = texX(0.13) / 2 + (row % 2) * 12.5; x < texX(0.97) / 2; x += 25) {
      g.strokeStyle = 'rgba(255,255,255,0.6)'
      g.lineWidth = 1.4
      g.beginPath()
      g.ellipse(x, y, 14, 7.5, 0, -Math.PI / 2, Math.PI / 2)
      g.stroke()
      g.strokeStyle = 'rgba(0,0,0,0.45)'
      g.lineWidth = 1.2
      g.beginPath()
      g.ellipse(x + 2, y, 14, 7.5, 0, -Math.PI / 2, Math.PI / 2)
      g.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.flipY = false
  return tex
}

function makeFinTexture(baseTint: string | null) {
  const [cv, f] = canvas(128, 256)
  const gr = f.createLinearGradient(0, 0, 0, 256)
  gr.addColorStop(0, 'rgba(255,251,245,0.95)')
  gr.addColorStop(0.85, 'rgba(250,244,236,0.7)')
  gr.addColorStop(1, 'rgba(220,210,198,0.95)')
  f.fillStyle = gr
  f.fillRect(0, 0, 128, 256)
  if (baseTint) {
    const tint = f.createLinearGradient(0, 0, 0, 256)
    tint.addColorStop(0, baseTint)
    tint.addColorStop(0.5, baseTint.replace(/[\d.]+\)$/, '0)'))
    f.fillStyle = tint
    f.fillRect(0, 0, 128, 256)
  }
  f.strokeStyle = 'rgba(150,130,112,0.6)'
  f.lineWidth = 1.4
  for (let x = 4; x < 128; x += 9) {
    f.beginPath()
    f.moveTo(x, 0)
    f.lineTo(x, 256)
    f.stroke()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeShadowTexture() {
  const [cv, g] = canvas(128, 128)
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  rg.addColorStop(0, 'rgba(0,0,0,0.55)')
  rg.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(cv)
}

/** A (rows × cols) grid whose vertex positions are rewritten every frame. */
function makeGrid(rows: number, cols: number) {
  const geo = new THREE.BufferGeometry()
  const uv = new Float32Array(rows * cols * 2)
  const idx: number[] = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const n = i * cols + j
      uv[n * 2] = j / (cols - 1)
      uv[n * 2 + 1] = i / (rows - 1)
      if (i < rows - 1 && j < cols - 1) {
        const a = n, b = n + cols, c = b + 1, d = a + 1
        idx.push(a, b, d, b, c, d)
      }
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rows * cols * 3), 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.setIndex(idx)
  return geo
}

export class KoiPond {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  private camHeight = 8
  private halfW = 4
  private halfH = 2.5
  private rnd = makeRandom(11)
  private dark = false
  private kois: Koi[] = []
  private foods: Food[] = []
  private ripples: Ripple[] = []
  private pointer: THREE.Vector3 | null = null
  private time = 0
  private last = 0
  private raf = 0
  private visible = true
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  private shadowMat = new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, opacity: 0.3 })
  private finShadowMat = new THREE.MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide })
  private finMats: THREE.MeshStandardMaterial[] = []
  private bumpTex = makeBumpTexture()
  private ringGeo = new THREE.RingGeometry(0.96, 1, 72)
  private foodGeo = new THREE.SphereGeometry(0.045, 12, 10)
  private foodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
  private raycaster = new THREE.Raycaster()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private ndc = new THREE.Vector2()
  private resizeObs: ResizeObserver
  private visObs: IntersectionObserver

  constructor(private canvasEl: HTMLCanvasElement, private host: HTMLElement, dark: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.scene.background = new THREE.Color('#ffffff')
    this.camera.up.set(0, 0, -1)

    // Intensities are ×π because modern three.js uses physically based light units.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b0a5, 0.75 * Math.PI))
    const key = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI)
    key.position.set(2, 8, 3)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xfff1e0, 0.3 * Math.PI)
    fill.position.set(-3, 5, -2)
    this.scene.add(fill)

    this.resize()
    this.kois = [
      this.makeKoi({ length: 2.0, pattern: 'orange', x: -1.2, depth: 0, z: 0.2, heading: 0.3, tailTint: 'rgba(240,138,40,0.85)', finTint: null, phase: 0 }),
      this.makeKoi({ length: 1.6, pattern: 'kohaku', x: 2, depth: -0.3, z: 1, heading: 2.5, tailTint: null, finTint: null, phase: 1.3 }),
      this.makeKoi({ length: 1.45, pattern: 'showa', x: 1, depth: -0.6, z: -1.2, heading: -2, tailTint: null, finTint: 'rgba(18,18,22,0.92)', phase: 2.6 }),
    ]
    this.setDark(dark)

    host.addEventListener('pointermove', this.onMove)
    host.addEventListener('pointerleave', this.onLeave)
    host.addEventListener('pointerdown', this.onDown)
    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(host)
    this.visObs = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      if (this.visible && !this.raf) this.start()
    })
    this.visObs.observe(host)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.start()
  }

  setDark(dark: boolean) {
    this.dark = dark
    ;(this.scene.background as THREE.Color).set(dark ? '#0b0b0b' : '#ffffff')
    this.shadowMat.opacity = dark ? 0 : 0.3
    this.finShadowMat.opacity = dark ? 0 : 0.13
    for (const m of this.finMats) m.color.set(dark ? 0xffffff : LIGHT_FIN_TINT)
    for (const r of this.ripples) r.mesh.material.color.set(dark ? 0xffffff : 0x8a8a8a)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.host.removeEventListener('pointermove', this.onMove)
    this.host.removeEventListener('pointerleave', this.onLeave)
    this.host.removeEventListener('pointerdown', this.onDown)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.resizeObs.disconnect()
    this.visObs.disconnect()
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose()
        m.dispose()
      }
    })
    this.renderer.dispose()
  }

  private resize() {
    const w = this.host.clientWidth || 1
    const h = this.host.clientHeight || 1
    const aspect = w / h
    const tan = Math.tan((16 * Math.PI) / 180)
    // Keep at least ~2.8 world units of half-width visible so koi fit on phones.
    this.camHeight = Math.max(9.5, 2.8 / aspect / tan)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = aspect
    this.camera.position.set(0, this.camHeight, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
    this.halfH = this.camHeight * tan
    this.halfW = this.halfH * aspect
  }

  private toPond(e: PointerEvent) {
    const b = this.canvasEl.getBoundingClientRect()
    this.ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    this.raycaster.setFromCamera(this.ndc, this.camera)
    const v = new THREE.Vector3()
    return this.raycaster.ray.intersectPlane(this.plane, v) ? v : null
  }

  private onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    this.pointer = this.toPond(e)
  }

  private onLeave = () => {
    this.pointer = null
  }

  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a,button')) return
    const v = this.toPond(e)
    if (!v || this.foods.length > 5) return
    const mesh = new THREE.Mesh(this.foodGeo, this.foodMat)
    mesh.position.set(v.x, 0.3, v.z)
    mesh.scale.setScalar(0.01)
    this.scene.add(mesh)
    this.foods.push({ mesh, age: 0 })
    this.addRipple(v.x, v.z, true)
  }

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    } else if (!this.raf) this.start()
  }

  private start() {
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  private addRipple(x: number, z: number, big: boolean) {
    for (let i = 0; i < (big ? 3 : 2); i++) {
      const mat = new THREE.MeshBasicMaterial({ color: this.dark ? 0xffffff : 0x8a8a8a, transparent: true, opacity: 0, depthWrite: false })
      const mesh = new THREE.Mesh(this.ringGeo, mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(x, 0.4, z)
      mesh.scale.setScalar(0.01)
      this.scene.add(mesh)
      this.ripples.push({ mesh, age: -i * 0.28, maxScale: big ? 1.1 : 0.55 })
    }
  }

  private makeKoi(o: KoiOptions): Koi {
    const L = o.length
    const W = 0.155 * L
    const TL = 0.62 * L
    let phase = o.phase
    let turn = 0
    let heading = o.heading
    let speed = 0.5

    // Body half-width along the spine: round head, tapering to the tail.
    const profile = (s: number) => {
      if (s < 0.33) {
        const x = (0.33 - s) / 0.33
        return Math.sqrt(Math.max(0, 1 - x * x))
      }
      const t = Math.min(1, (s - 0.33) / 0.67)
      return 1 - 0.86 * t * t * (3 - 2 * t)
    }
    // Lateral offset of the spine: a travelling swim wave plus a turn bend.
    const lateral = (s: number) => {
      const sc = Math.min(s, 1.6)
      const amp = L * (0.008 + 0.07 * sc * sc)
      return amp * Math.sin(sc * 5.4 - phase) - turn * 0.22 * (s * L) * (s * L)
    }
    const sp = new THREE.Vector3()
    const side = new THREE.Vector3()
    const spine = (s: number) => sp.set(-s * L, 0, lateral(s))
    const leftOf = (s: number) => {
      const e = 0.004
      const fx = 2 * e * L
      const fz = -(lateral(s + e) - lateral(s - e))
      const len = Math.hypot(fx, fz)
      return side.set(fz / len, 0, -fx / len)
    }

    const group = new THREE.Group()
    this.scene.add(group)

    const ROWS = 90, SEGS = 44
    const bodyGeo = makeGrid(ROWS, SEGS + 1)
    const sArr: number[] = []
    const buv = bodyGeo.attributes.uv.array as Float32Array
    for (let i = 0; i < ROWS; i++) {
      const s = Math.pow(i / (ROWS - 1), 1.2)
      sArr.push(s)
      for (let j = 0; j <= SEGS; j++) {
        const n = i * (SEGS + 1) + j
        buv[n * 2] = s
        buv[n * 2 + 1] = j / SEGS
      }
    }
    group.add(
      new THREE.Mesh(
        bodyGeo,
        new THREE.MeshPhysicalMaterial({
          map: makeBodyTexture(o.pattern, this.rnd),
          bumpMap: this.bumpTex,
          bumpScale: 0.6,
          roughness: 0.42,
          clearcoat: 0.85,
          clearcoatRoughness: 0.18,
        }),
      ),
    )

    const finMat = new THREE.MeshStandardMaterial({ map: makeFinTexture(o.finTint), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5, color: LIGHT_FIN_TINT })
    const tailMat = new THREE.MeshStandardMaterial({ map: makeFinTexture(o.tailTint), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5, color: LIGHT_FIN_TINT })
    this.finMats.push(finMat, tailMat)

    const addShadow = (geo: THREE.BufferGeometry) => {
      const m = new THREE.Mesh(geo, this.finShadowMat)
      m.position.set(0.12, -0.6, 0.2)
      m.renderOrder = -2
      group.add(m)
    }

    const fins: { geo: THREE.BufferGeometry; s0: number; side: number; R: number; a0: number; spread: number; off: number }[] = []
    const addFin = (s0: number, sideSign: number, R: number, a0: number, spread: number, off: number) => {
      const geo = makeGrid(10, 9)
      const m = new THREE.Mesh(geo, finMat)
      m.renderOrder = -1
      group.add(m)
      addShadow(geo)
      fins.push({ geo, s0, side: sideSign, R, a0, spread, off })
    }
    addFin(0.2, 1, 0.34 * L, 0.6, 0.5, 0)
    addFin(0.2, -1, 0.34 * L, 0.6, 0.5, 1.7)
    addFin(0.53, 1, 0.17 * L, 0.75, 0.4, 0.8)
    addFin(0.53, -1, 0.17 * L, 0.75, 0.4, 2.4)

    const tailGeo = makeGrid(26, 15)
    const tailMesh = new THREE.Mesh(tailGeo, tailMat)
    tailMesh.renderOrder = -1
    group.add(tailMesh)
    addShadow(tailGeo)

    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.15, clearcoat: 1 })
    const eyeGeo = new THREE.SphereGeometry(0.015 * L, 16, 12)
    const eyes = [new THREE.Mesh(eyeGeo, eyeMat), new THREE.Mesh(eyeGeo, eyeMat)]
    eyes.forEach((e) => group.add(e))

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.scale.set(L * 1.7, W * 4.2, 1)
    shadow.position.set(-0.55 * L + 0.12, -0.6, 0.2)
    group.add(shadow)

    const updateMesh = () => {
      const p = bodyGeo.attributes.position.array as Float32Array
      for (let i = 0; i < ROWS; i++) {
        const s = sArr[i]
        const c0 = spine(s), l0 = leftOf(s)
        const w = W * profile(s), h = w * 0.62
        for (let j = 0; j <= SEGS; j++) {
          const ang = (j / SEGS) * Math.PI * 2
          const c = Math.cos(ang), sn = Math.sin(ang)
          const n = (i * (SEGS + 1) + j) * 3
          p[n] = c0.x + l0.x * w * c
          p[n + 1] = (sn > 0 ? h : h * 0.7) * sn
          p[n + 2] = c0.z + l0.z * w * c
        }
      }
      bodyGeo.attributes.position.needsUpdate = true
      bodyGeo.computeVertexNormals()

      for (const f of fins) {
        const p2 = f.geo.attributes.position.array as Float32Array
        const flap = 0.28 * Math.sin(phase * 0.45 + f.off)
        for (let i = 0; i < 10; i++) {
          const r = i / 9
          for (let j = 0; j < 9; j++) {
            const q = (j / 8) * 2 - 1
            const al = f.a0 + q * f.spread + flap
            const rad = r * f.R * (1 - 0.3 * q * q)
            const out = rad * Math.cos(al), back = rad * Math.sin(al)
            const s = f.s0 + back / L
            const c0 = spine(s), l0 = leftOf(s)
            const a = f.side * (W * profile(f.s0) * 0.72 + out)
            const n = (i * 9 + j) * 3
            p2[n] = c0.x + l0.x * a
            p2[n + 1] = -0.03 + rad * 0.18 * Math.sin(flap * 2)
            p2[n + 2] = c0.z + l0.z * a
          }
        }
        f.geo.attributes.position.needsUpdate = true
        f.geo.computeVertexNormals()
      }

      const p3 = tailGeo.attributes.position.array as Float32Array
      for (let i = 0; i < 26; i++) {
        const r = i / 25
        for (let j = 0; j < 15; j++) {
          const q = (j / 14) * 2 - 1, aq = Math.abs(q)
          const back = r * TL * (0.58 + 0.42 * Math.pow(aq, 0.75)) * (1 - 0.1 * Math.pow(aq, 6))
          const halfWidth = L * (0.024 + 0.2 * Math.pow(r, 0.8))
          const a = q * halfWidth + Math.sin(phase * 1.3 - r * 4 + q) * 0.025 * L * r
          const s = 0.98 + back / L
          const c0 = spine(s), l0 = leftOf(s)
          const n = (i * 15 + j) * 3
          p3[n] = c0.x + l0.x * a
          p3[n + 1] = 0.015 * Math.sin(phase + r * 3) * r
          p3[n + 2] = c0.z + l0.z * a
        }
      }
      tailGeo.attributes.position.needsUpdate = true
      tailGeo.computeVertexNormals()

      ;[1, -1].forEach((sg, k) => {
        const s = 0.075
        const c0 = spine(s), l0 = leftOf(s)
        const w = W * profile(s)
        eyes[k].position.set(c0.x + l0.x * w * 0.7 * sg, w * 0.62 * 0.62, c0.z + l0.z * w * 0.7 * sg)
      })
    }

    const koi: Koi = {
      length: L,
      group,
      pos: new THREE.Vector3(o.x, o.depth, o.z),
      wanderTarget: new THREE.Vector3(),
      newWanderTarget: () => {
        // On wide screens, favour the right side so the headline on the left stays readable.
        const minX = this.halfW / this.halfH > 1.2 ? -this.halfW * 0.15 : -(this.halfW - 1)
        const maxX = this.halfW - 1
        koi.wanderTarget.set(minX + this.rnd() * (maxX - minX), 0, (this.rnd() * 2 - 1) * (this.halfH - 0.7))
      },
      step: (dt, target, targetSpeed, all) => {
        const dx = target.x - koi.pos.x, dz = target.z - koi.pos.z
        const dist = Math.hypot(dx, dz) || 1
        let vx = dx / dist, vz = dz / dist
        // Keep a polite distance from the other koi.
        for (const other of all) {
          if (other === koi) continue
          const ex = koi.pos.x - other.pos.x, ez = koi.pos.z - other.pos.z
          const e = Math.hypot(ex, ez), lim = (L + other.length) * 0.42
          if (e < lim && e > 0.001) {
            const w = ((lim - e) / lim) * 1.8
            vx += (ex / e) * w
            vz += (ez / e) * w
          }
        }
        // Stay inside the visible pond.
        if (koi.pos.x > this.halfW - 0.4) vx -= 2
        if (koi.pos.x < -this.halfW + 0.4) vx += 2
        if (koi.pos.z > this.halfH - 0.3) vz -= 2
        if (koi.pos.z < -this.halfH + 0.3) vz += 2

        let diff = Math.atan2(-vz, vx) - heading
        while (diff > Math.PI) diff -= 2 * Math.PI
        while (diff < -Math.PI) diff += 2 * Math.PI
        const rate = Math.max(-1.5, Math.min(1.5, diff * 1.5))
        heading += rate * dt
        speed += (targetSpeed - speed) * 0.035
        koi.pos.x += Math.cos(heading) * speed * dt
        koi.pos.z -= Math.sin(heading) * speed * dt
        const k = Math.max(-0.9, Math.min(0.9, rate / Math.max(speed, 0.2)))
        turn += (k - turn) * 0.06
        phase += dt * (2.4 + speed * 3.4)

        group.position.copy(koi.pos)
        group.rotation.y = heading
        updateMesh()
        return dist
      },
    }
    koi.newWanderTarget()
    return koi
  }

  private loop = (now: number) => {
    if (!this.visible || document.hidden) {
      this.raf = 0
      return
    }
    let dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    if (this.reducedMotion) dt *= 0.35
    this.time += dt

    this.kois.forEach((koi, i) => {
      let nearest: Food | null = null
      let best = Infinity
      for (const f of this.foods) {
        const d = Math.hypot(f.mesh.position.x - koi.pos.x, f.mesh.position.z - koi.pos.z)
        if (d < best) {
          best = d
          nearest = f
        }
      }
      let target: { x: number; z: number }
      let speed: number
      if (nearest && best < 6) {
        target = nearest.mesh.position
        speed = 1.25
      } else if (this.pointer) {
        const a = i * 2.1 + this.time * 0.5, r = i ? 0.9 : 0.2
        target = { x: this.pointer.x + Math.cos(a) * r, z: this.pointer.z + Math.sin(a) * r }
        speed = Math.hypot(target.x - koi.pos.x, target.z - koi.pos.z) < 0.7 ? 0.3 : 0.9
      } else {
        target = koi.wanderTarget
        speed = 0.5 + i * 0.04
      }
      const d = koi.step(dt, target, speed, this.kois)
      if (nearest && target === nearest.mesh.position && d < 0.18) {
        this.scene.remove(nearest.mesh)
        this.foods.splice(this.foods.indexOf(nearest), 1)
        this.addRipple(koi.pos.x, koi.pos.z, false)
      }
      if (!nearest && !this.pointer && d < 0.9) koi.newWanderTarget()
    })

    for (const f of this.foods) {
      f.age += dt
      f.mesh.position.y = 0.3 + Math.sin(f.age * 2) * 0.02
      f.mesh.scale.setScalar(Math.min(1, f.age * 4))
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i]
      r.age += dt
      if (r.age < 0) continue
      const p = r.age / 1.6
      if (p >= 1) {
        this.scene.remove(r.mesh)
        r.mesh.material.dispose()
        this.ripples.splice(i, 1)
        continue
      }
      r.mesh.scale.setScalar(0.05 + p * r.maxScale)
      r.mesh.material.opacity = (1 - p) * (this.dark ? 0.35 : 0.45)
    }

    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }
}
