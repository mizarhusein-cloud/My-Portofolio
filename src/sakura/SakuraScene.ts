import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * SakuraScene — a procedural 3D cherry blossom tree for the Contact section.
 *
 * The tree is generated in code (no model file): every limb is a tapered tube
 * along a meandering curve, blossoms are soft pink "puffs" covered in small
 * flower sprites.
 *
 * Performance: only the trunk and the first three levels of limbs (≈37 groups)
 * are animated. Everything finer is merged into its level-3 ancestor, so the
 * whole tree draws in roughly a hundred calls instead of several hundred.
 *
 * Interaction: a Raycaster checks whether the pointer touches bark (trunk or
 * branch). If it does, the tree gets a small push: the trunk sways on a soft
 * spring, the branches lag behind it elastically, and blossoms shake loose and
 * drift down. The springs then settle back to rest on their own.
 */

const MAX_DEPTH = 5
const LIVE_DEPTH = 3
const PINKS = ['#fff6f9', '#ffe1eb', '#fcc9d9', '#f7afc7', '#ec8fb0']
const BARK = { light: 0x5a3426, dark: 0x5e3a2b }
const PETALS_PER_POOL = 140
const POOL_OPACITY = [0.95, 0.75, 0.5]
const CAMERA_Z = 16
const FOV = 35

// Spring tuning per animated depth: stiffness, damping ratio, max bend (radians).
const SPRING = [
  { k: 5, zeta: 0.16, max: 0.06 },
  { k: 9, zeta: 0.2, max: 0.12 },
  { k: 14, zeta: 0.22, max: 0.2 },
  { k: 18, zeta: 0.25, max: 0.25 },
]

function makeRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface Cluster {
  points: THREE.Points
  acc: number
}

interface Limb {
  group: THREE.Group
  parent: Limb | null
  depth: number
  baseZ: number
  off: number
  vel: number
  prevVel: number
  shake: number
  phase: number
  k: number
  damp: number
  maxOff: number
  lastHit: number
  /** Blossom clusters anywhere in this limb's subtree. */
  clusters: Cluster[]
}

interface Bucket {
  bark: THREE.BufferGeometry[]
  puffs: THREE.Matrix4[]
  puffColors: THREE.Color[]
  flowerPos: number[]
  flowerCol: number[]
}

interface Petal {
  active: boolean
  pos: THREE.Vector3
  vel: THREE.Vector3
  rot: THREE.Euler
  spin: THREE.Vector3
  phase: number
  fall: number
  sway: number
}

const rnd = (a: number, b: number) => a + (b - a) * Math.random()

// ------------------------------------------------------------- textures
function petalPath(x: CanvasRenderingContext2D, s: number) {
  x.beginPath()
  x.moveTo(0, 0)
  x.bezierCurveTo(-14 * s, -8 * s, -13 * s, -26 * s, -4 * s, -29 * s)
  x.lineTo(0, -25 * s)
  x.lineTo(4 * s, -29 * s)
  x.bezierCurveTo(13 * s, -26 * s, 14 * s, -8 * s, 0, 0)
}

function canvasTexture(draw: (x: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

const flowerTexture = () =>
  canvasTexture((x) => {
    x.translate(32, 32)
    for (let k = 0; k < 5; k++) {
      x.save()
      x.rotate((k * Math.PI * 2) / 5)
      petalPath(x, 1)
      const g = x.createLinearGradient(0, 0, 0, -29)
      g.addColorStop(0, '#efb8c9')
      g.addColorStop(1, '#ffffff')
      x.fillStyle = g
      x.fill()
      x.restore()
    }
    x.fillStyle = '#c94f72'
    x.beginPath()
    x.arc(0, 0, 4, 0, Math.PI * 2)
    x.fill()
  })

const petalTexture = () =>
  canvasTexture((x) => {
    x.translate(32, 60)
    petalPath(x, 1.9)
    const g = x.createLinearGradient(0, 0, 0, -55)
    g.addColorStop(0, '#f3c2d1')
    g.addColorStop(1, '#ffffff')
    x.fillStyle = g
    x.fill()
  })

const shadowTexture = () =>
  canvasTexture((x) => {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, 'rgba(214,150,170,.5)')
    g.addColorStop(1, 'rgba(214,150,170,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
  })

// ------------------------------------------------------------- scene
export class SakuraScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  /** Positioned and scaled to fit the layout. */
  private tree = new THREE.Group()
  /** Trunk, limbs and rocks — measured once to place the tree. */
  private body = new THREE.Group()
  private bbox = new THREE.Box3()
  private rand = makeRandom(20260915)

  private limbs: Limb[] = []
  private barkMeshes: THREE.Mesh[] = []
  private clusters: Cluster[] = []
  private trunk: Limb

  private barkMat = new THREE.MeshStandardMaterial({ color: BARK.light, roughness: 0.95, flatShading: true })
  private rockMat = new THREE.MeshStandardMaterial({ color: 0x4a423b, roughness: 1, flatShading: true })
  private puffMat = new THREE.MeshLambertMaterial()
  private puffGeo = new THREE.IcosahedronGeometry(1, 2)
  private flowerMat = new THREE.PointsMaterial({ size: 0.2, map: flowerTexture(), vertexColors: true, alphaTest: 0.45 })
  private shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })

  private pools: THREE.InstancedMesh[] = []
  private petals: Petal[] = []
  private nextPetal = 0
  private petalScale = 1
  private dummy = new THREE.Object3D()

  private halfW = 1
  private halfH = 1
  private ndc = new THREE.Vector2()
  private raycaster = new THREE.Raycaster()
  private pendingPick = false
  private pointerDx = 0

  private running = false
  private inView = false
  private raf = 0
  private last = 0
  private time = 0
  private ambient = 0
  private nudgeTimer = 0
  private nudged = false
  private reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private io: IntersectionObserver
  private ro: ResizeObserver

  constructor(
    private canvas: HTMLCanvasElement,
    private host: HTMLElement,
    dark: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))

    this.camera.position.set(0, 0.8, CAMERA_Z)
    this.camera.lookAt(0, 0, 0)

    // Soft light: a warm sky/ground fill plus one gentle key light for depth.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6a70, 0.85 * Math.PI))
    const sun = new THREE.DirectionalLight(0xfff4ee, 0.8 * Math.PI)
    sun.position.set(6, 9, 7)
    this.scene.add(sun)

    this.scene.add(this.tree)
    this.tree.add(this.body)
    this.trunk = this.growLive(this.body, null, 3.3, 0.52, 0, new THREE.Vector3(), 0, 0)
    this.addGround()
    this.body.updateMatrixWorld(true)
    this.bbox.setFromObject(this.body)
    this.addPetalPools()

    this.setDark(dark)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(host)
    this.resize()

    this.io = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting
      this.updateRunning()
      if (this.inView) this.maybeNudge()
    })
    this.io.observe(host)
    document.addEventListener('visibilitychange', this.updateRunning)
    host.addEventListener('pointermove', this.onPointerMove)
    host.addEventListener('pointerleave', this.onPointerLeave)
    host.addEventListener('pointerdown', this.onPointerDown)
  }

  // ----------------------------------------------------------- tree building
  private limbCurve(len: number, depth: number) {
    const r = this.rand
    const V = THREE.Vector3
    if (depth === 0) {
      const w = 0.32 * len
      return new THREE.CatmullRomCurve3([
        new V(0, 0, 0),
        new V(0, len * 0.22, 0),
        new V(-w * 0.35, len * 0.5, 0.03),
        new V(w * 0.1, len * 0.75, 0.05),
        new V(w * 0.35, len, 0),
      ])
    }
    const w = (0.12 + depth * 0.02) * len
    const s = r() < 0.5 ? -1 : 1
    const R = (a: number, b: number) => a + (b - a) * r()
    return new THREE.CatmullRomCurve3([
      new V(0, 0, 0),
      new V(s * w * R(0.2, 0.6), len * 0.3, R(-0.05, 0.05) * len),
      new V(-s * w * R(0, 0.4), len * 0.65, R(-0.08, 0.08) * len),
      new V(s * w * R(0, 0.5), len, R(-0.1, 0.1) * len),
    ])
  }

  /** A tube along the curve, tapered to the tip, flared at the trunk's root, with small knots. */
  private limbGeometry(curve: THREE.CatmullRomCurve3, rad: number, depth: number) {
    const seg = depth < 2 ? 24 : depth < 4 ? 10 : 6
    const radial = depth < 2 ? 10 : depth < 4 ? 6 : 5
    const geo = new THREE.TubeGeometry(curve, seg, 1, radial, false)
    const p = geo.attributes.position
    const c = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let i = 0; i <= seg; i++) {
      const t = i / seg
      curve.getPointAt(t, c)
      let r = rad * (1 - 0.42 * t)
      if (depth === 0) r *= 1 + Math.max(0, 0.16 - t) * 5
      r *= 1 + Math.sin(t * 17 + rad * 9) * 0.05
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j
        v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c)
        p.setXYZ(k, v.x, v.y, v.z)
      }
    }
    geo.computeVertexNormals()
    return geo
  }

  /** Angles, lengths and joints for a limb's children (deterministic). */
  private children(curve: THREE.CatmullRomCurve3, depth: number, worldAng: number) {
    const r = this.rand
    const R = (a: number, b: number) => a + (b - a) * r()
    const n = depth <= 1 ? 3 : r() < 0.5 ? 2 : 3
    const out: { at: number; angle: number; lenF: number; rx: number }[] = []
    for (let i = 0; i < n; i++) {
      // the trunk splits into a long low limb sweeping right, one rising, one reaching left
      let a = depth === 0 ? [-0.72, -0.02, 0.7][i] : (i - (n - 1) / 2) * R(0.6, 0.85) + R(-0.15, 0.15) - 0.15
      const at = depth === 0 ? [0.72, 0.98, 0.84][i] : i === 0 ? R(0.86, 1) : R(0.45, 0.85)
      const tan = curve.getTangentAt(at)
      const along = Math.atan2(-tan.x, tan.y)
      // umbrella canopy: limbs spread wide, tips may droop a little past horizontal
      const wa = worldAng + along + a
      if (wa < -1.35) a += -1.35 - wa
      if (wa > 1.15) a -= wa - 1.15
      const lenF = depth === 0 ? [0.78, 0.8, 0.8][i] : R(0.66, 0.82)
      out.push({ at, angle: along + a, lenF, rx: R(-0.3, 0.3) })
    }
    return out
  }

  private growLive(
    parentGroup: THREE.Object3D,
    parent: Limb | null,
    len: number,
    rad: number,
    depth: number,
    pos: THREE.Vector3,
    rz: number,
    worldAng: number,
    rx = 0,
  ): Limb {
    const group = new THREE.Group()
    group.position.copy(pos)
    group.rotation.set(depth === 0 ? 0 : rx, 0, rz)
    parentGroup.add(group)

    const s = SPRING[depth]
    const limb: Limb = {
      group,
      parent,
      depth,
      baseZ: rz,
      off: 0,
      vel: 0,
      prevVel: 0,
      shake: 0,
      phase: this.rand() * Math.PI * 2,
      k: s.k,
      damp: 2 * s.zeta * Math.sqrt(s.k),
      maxOff: s.max,
      lastHit: 0,
      clusters: [],
    }
    this.limbs.push(limb)

    const curve = this.limbCurve(len, depth)
    const bucket: Bucket | null = depth >= 2 ? { bark: [], puffs: [], puffColors: [], flowerPos: [], flowerCol: [] } : null
    if (bucket) bucket.bark.push(this.limbGeometry(curve, rad, depth))
    else this.addBark(group, this.limbGeometry(curve, rad, depth), limb)

    if (depth < MAX_DEPTH) {
      const childRad = Math.max(0.035, rad * (depth === 0 ? 0.58 : 0.62))
      for (const c of this.children(curve, depth, worldAng)) {
        const p = curve.getPointAt(c.at)
        if (depth + 1 <= LIVE_DEPTH) {
          this.growLive(group, limb, len * c.lenF, childRad, depth + 1, p, c.angle, worldAng + c.angle, c.rx)
        } else if (bucket) {
          const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(c.rx, 0, c.angle)), new THREE.Vector3(1, 1, 1))
          this.growBaked(bucket, m, len * c.lenF, childRad, depth + 1, worldAng + c.angle)
        }
      }
    }

    if (bucket) {
      this.addBlossoms(bucket, new THREE.Matrix4(), curve, depth)
      this.finishBucket(group, bucket, limb)
    }
    return limb
  }

  /** Fine branches: baked into their level-3 ancestor's geometry (not animated on their own). */
  private growBaked(bucket: Bucket, m: THREE.Matrix4, len: number, rad: number, depth: number, worldAng: number) {
    const curve = this.limbCurve(len, depth)
    bucket.bark.push(this.limbGeometry(curve, rad, depth).applyMatrix4(m))
    if (depth < MAX_DEPTH) {
      for (const c of this.children(curve, depth, worldAng)) {
        const local = new THREE.Matrix4().compose(
          curve.getPointAt(c.at),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(c.rx, 0, c.angle)),
          new THREE.Vector3(1, 1, 1),
        )
        this.growBaked(bucket, m.clone().multiply(local), len * c.lenF, Math.max(0.035, rad * 0.62), depth + 1, worldAng + c.angle)
      }
    }
    this.addBlossoms(bucket, m, curve, depth)
  }

  /** Blossom clumps: pink puffs for volume, flower sprites on their surface for texture. */
  private addBlossoms(bucket: Bucket, m: THREE.Matrix4, curve: THREE.CatmullRomCurve3, depth: number) {
    const r = this.rand
    const R = (a: number, b: number) => a + (b - a) * r()
    const nPuff = depth === MAX_DEPTH ? 5 : depth === MAX_DEPTH - 1 ? 4 : 2
    const spheres: [THREE.Vector3, number][] = []
    for (let i = 0; i < nPuff; i++) {
      const pt = curve.getPointAt(i === 0 ? 1 : R(0.45, 1))
      const size = depth === MAX_DEPTH ? R(0.3, 0.42) : R(0.24, 0.34)
      const c = new THREE.Vector3(pt.x + R(-0.25, 0.25), pt.y + R(0, 0.25), pt.z + R(-0.3, 0.3))
      spheres.push([c, size])
      bucket.puffs.push(m.clone().multiply(new THREE.Matrix4().compose(c, new THREE.Quaternion(), new THREE.Vector3(size, size * 0.78, size))))
      bucket.puffColors.push(new THREE.Color('#ee9ab7').lerp(new THREE.Color('#f9c4d5'), r()))
    }
    const v = new THREE.Vector3()
    const pinks = PINKS.map((c) => new THREE.Color(c))
    for (let i = 0; i < nPuff * 170; i++) {
      const [c, size] = spheres[i % nPuff]
      v.set(R(-1, 1), R(-1, 1), R(-1, 1))
        .normalize()
        .multiplyScalar(size * (r() < 0.8 ? R(0.95, 1.3) : R(0.4, 1)))
      v.y *= 0.78
      const lower = v.y < -size * 0.35
      v.add(c).applyMatrix4(m)
      bucket.flowerPos.push(v.x, v.y, v.z)
      const col = pinks[Math.floor(Math.pow(r(), 1.3) * pinks.length)].clone().multiplyScalar(lower ? 0.82 : 1)
      bucket.flowerCol.push(col.r, col.g, col.b)
    }
  }

  private addBark(group: THREE.Group, geo: THREE.BufferGeometry, limb: Limb) {
    const mesh = new THREE.Mesh(geo, this.barkMat)
    mesh.userData.limb = limb
    group.add(mesh)
    this.barkMeshes.push(mesh)
  }

  private finishBucket(group: THREE.Group, bucket: Bucket, limb: Limb) {
    const merged = mergeGeometries(bucket.bark)
    bucket.bark.forEach((g) => g.dispose())
    if (merged) this.addBark(group, merged, limb)

    const puffs = new THREE.InstancedMesh(this.puffGeo, this.puffMat, bucket.puffs.length)
    bucket.puffs.forEach((m, i) => {
      puffs.setMatrixAt(i, m)
      puffs.setColorAt(i, bucket.puffColors[i])
    })
    puffs.computeBoundingSphere()
    group.add(puffs)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(bucket.flowerPos, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(bucket.flowerCol, 3))
    const points = new THREE.Points(geo, this.flowerMat)
    group.add(points)

    const cluster: Cluster = { points, acc: 0 }
    this.clusters.push(cluster)
    for (let l: Limb | null = limb; l; l = l.parent) l.clusters.push(cluster)
  }

  private addGround() {
    const r = this.rand
    const R = (a: number, b: number) => a + (b - a) * r()
    // Roots: a few tapered tubes spreading from the trunk base along the ground, so the
    // trunk is planted in the soil instead of balancing on the rocks.
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + R(-0.3, 0.3)
      const L = R(0.9, 1.5)
      const dx = Math.cos(ang) * L
      const dz = Math.sin(ang) * L * 0.7
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(dx * 0.35, 0.16, dz * 0.35),
        new THREE.Vector3(dx * 0.7, 0.04, dz * 0.7),
        new THREE.Vector3(dx, 0, dz),
      ])
      const geo = new THREE.TubeGeometry(curve, 12, 1, 6, false)
      const pos = geo.attributes.position
      const c = new THREE.Vector3()
      const v = new THREE.Vector3()
      for (let k = 0; k <= 12; k++) {
        const t = k / 12
        curve.getPointAt(t, c)
        const r = 0.24 * (1 - t) + 0.03
        for (let j = 0; j <= 6; j++) {
          const idx = k * 7 + j
          v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c)
          // flatten the underside so the root lies on the ground
          pos.setXYZ(idx, v.x, Math.max(v.y, -0.01), v.z)
        }
      }
      geo.computeVertexNormals()
      this.body.add(new THREE.Mesh(geo, this.barkMat))
    }

    const rocks: [number, number, number][] = [
      [-1.5, -0.4, 0.45],
      [1.35, -0.5, 0.5],
      [2.2, 0.4, 0.3],
      [-2.1, 0.5, 0.32],
      [0.9, 0.85, 0.22],
    ]
    const rockGeo = new THREE.DodecahedronGeometry(1, 0)
    for (const [x, z, sz] of rocks) {
      const m = new THREE.Mesh(rockGeo, this.rockMat)
      m.position.set(x, sz * 0.2, z)
      m.scale.set(sz, sz * 0.55, sz)
      m.rotation.set(0, R(0, 3), 0)
      this.body.add(m)
    }

    // contact shadow right under the trunk
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.6),
      new THREE.MeshBasicMaterial({ map: this.contactShadowTexture(), transparent: true, depthWrite: false }),
    )
    contact.rotation.x = -Math.PI / 2
    contact.position.set(0, 0.015, 0.1)
    this.tree.add(contact)

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.4), this.shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(2.5, 0.01, 0)
    this.tree.add(shadow)

    // a scatter of fallen petals around the roots
    const fallen = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.2, 0.2),
      new THREE.MeshLambertMaterial({ map: petalTexture(), side: THREE.DoubleSide, alphaTest: 0.4 }),
      70,
    )
    const pinks = PINKS.slice(1).map((c) => new THREE.Color(c))
    for (let i = 0; i < 70; i++) {
      this.dummy.position.set(R(-2.2, 5.5) * (i % 3 === 0 ? 1 : 0.6), 0.03, R(-0.6, 1.4))
      this.dummy.rotation.set(-Math.PI / 2 + R(-0.2, 0.2), 0, R(0, 6.28))
      this.dummy.scale.setScalar(R(0.7, 1.1))
      this.dummy.updateMatrix()
      fallen.setMatrixAt(i, this.dummy.matrix)
      fallen.setColorAt(i, pinks[i % pinks.length])
    }
    this.tree.add(fallen)
  }

  private contactShadowTexture() {
    return canvasTexture((x) => {
      const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
      g.addColorStop(0, 'rgba(60,38,30,.38)')
      g.addColorStop(1, 'rgba(60,38,30,0)')
      x.fillStyle = g
      x.fillRect(0, 0, 64, 64)
    })
  }

  private addPetalPools() {
    const geo = new THREE.PlaneGeometry(0.2, 0.2)
    const map = petalTexture()
    const pinks = PINKS.slice(2).map((c) => new THREE.Color(c))
    POOL_OPACITY.forEach((opacity) => {
      const mat = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, transparent: true, opacity, alphaTest: 0.2, depthWrite: false })
      const mesh = new THREE.InstancedMesh(geo, mat, PETALS_PER_POOL)
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.frustumCulled = false
      for (let i = 0; i < PETALS_PER_POOL; i++) {
        mesh.setColorAt(i, pinks[i % pinks.length])
        mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0))
      }
      this.pools.push(mesh)
      this.scene.add(mesh)
    })
    for (let i = 0; i < PETALS_PER_POOL * POOL_OPACITY.length; i++) {
      this.petals.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        spin: new THREE.Vector3(),
        phase: 0,
        fall: 0,
        sway: 0,
      })
    }
  }

  // ----------------------------------------------------------- layout & theme
  setDark(dark: boolean) {
    this.barkMat.color.set(dark ? BARK.dark : BARK.light)
    this.rockMat.color.set(dark ? 0x4f4842 : 0x4a423b)
    this.shadowMat.opacity = dark ? 0.35 : 1
    if (!this.running) this.render()
  }

  private resize() {
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.halfH = CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    this.halfW = this.halfH * this.camera.aspect
    const upp = (2 * this.halfH) / h // world units per CSS pixel
    const b = this.bbox
    const bw = b.max.x - b.min.x
    const bh = b.max.y - b.min.y

    let s: number
    if (w > 900) {
      // Side by side: the trunk stands at ~13% of the width and the canopy reaches to
      // just before the text column (48%); whatever spills past the left edge is cropped.
      const trunkX = w * 0.15
      s = Math.min((h * 0.97 * upp) / bh, ((w * 0.47 - trunkX) * upp) / b.max.x)
      this.tree.position.x = -this.halfW + trunkX * upp
    } else {
      // Stacked: the tree fills a band under the text (see .contact padding-bottom)
      // and may spill a little past both edges.
      const band = Math.min(520, Math.max(300, w * 0.75))
      s = Math.min((band * upp) / bh, (w * 1.08 * upp) / bw)
      this.tree.position.x = -((b.min.x + b.max.x) / 2) * s
    }
    this.tree.scale.setScalar(s)
    this.tree.position.y = -this.halfH + 16 * upp - b.min.y * s
    this.petalScale = s
    this.render()
  }

  // ----------------------------------------------------------- interaction
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    // Text and buttons never trigger the tree, even if a branch sits behind them.
    if ((e.target as Element).closest('.contact-copy')) {
      this.host.style.cursor = ''
      return
    }
    this.setNdc(e)
    this.pointerDx = e.movementX
    this.pendingPick = true
  }

  private onPointerLeave = () => {
    this.pendingPick = false
    this.host.style.cursor = ''
  }

  private onPointerDown = (e: PointerEvent) => {
    if ((e.target as Element).closest('.contact-copy, a, button')) return
    this.setNdc(e)
    const limb = this.pick()
    if (limb) {
      limb.lastHit = 0
      this.excite(limb, Math.random() < 0.5 ? -1 : 1, 1.3)
    }
  }

  private setNdc(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect()
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  private pick(): Limb | null {
    this.raycaster.setFromCamera(this.ndc, this.camera)
    const hit = this.raycaster.intersectObjects(this.barkMeshes, false)[0]
    return hit ? (hit.object.userData.limb as Limb) : null
  }

  /** Push the tree: the trunk sways a little, the touched limb a bit more, and blossoms let go. */
  private excite(limb: Limb, dir: number, strength: number) {
    const now = performance.now()
    if (now - limb.lastHit < 450) return
    limb.lastHit = now
    this.trunk.vel += dir * 0.1 * strength
    if (limb !== this.trunk) limb.vel += dir * 0.3 * strength
    const n = Math.round((10 + limb.depth * 3) * strength * (this.reduceMotion ? 0.4 : 1))
    for (let i = 0; i < n; i++) this.spawnFrom(limb.clusters[Math.floor(Math.random() * limb.clusters.length)], dir * 0.3)
    if (!this.running) this.updateRunning()
  }

  /** Touch screens have no hover: give the tree one gentle shake the first time it scrolls into view. */
  private maybeNudge() {
    if (this.nudged || !window.matchMedia('(hover: none)').matches) return
    this.nudged = true
    this.nudgeTimer = window.setTimeout(() => this.excite(this.trunk, 1, 0.9), 900)
  }

  private spawnFrom(cluster: Cluster, kick: number) {
    const p = this.petals[this.nextPetal]
    this.nextPetal = (this.nextPetal + 1) % this.petals.length
    const attr = cluster.points.geometry.getAttribute('position')
    p.pos.fromBufferAttribute(attr, Math.floor(Math.random() * attr.count))
    cluster.points.localToWorld(p.pos)
    p.vel.set(kick + rnd(-0.25, 0.25), rnd(-0.3, 0.05), rnd(-0.1, 0.1))
    p.rot.set(rnd(0, 6), rnd(0, 6), rnd(0, 6))
    p.spin.set(rnd(-2.6, 2.6), rnd(-2.6, 2.6), rnd(-1.8, 1.8))
    p.phase = rnd(0, Math.PI * 2)
    p.fall = rnd(0.28, 0.6)
    p.sway = rnd(0.2, 0.55)
    p.active = true
  }

  // ----------------------------------------------------------- loop
  private updateRunning = () => {
    const should = this.inView && !document.hidden
    if (should && !this.running) {
      this.running = true
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    } else if (!should && this.running) {
      this.running = false
      cancelAnimationFrame(this.raf)
    }
  }

  private frame = () => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    const now = performance.now()
    const dt = Math.min((now - this.last) / 1000, 1 / 30) // delta time keeps motion frame-rate independent
    this.last = now
    this.time += dt
    this.step(dt)
    this.render()
  }

  private step(dt: number) {
    if (this.pendingPick) {
      this.pendingPick = false
      const limb = this.pick()
      this.host.style.cursor = limb ? 'grab' : ''
      if (limb) this.excite(limb, Math.sign(this.pointerDx) || (Math.random() < 0.5 ? -1 : 1), 1)
    }

    // Springs: parents are updated before children, so a branch feels its parent's
    // acceleration and lags behind it — that lag is what makes the motion elastic.
    const wind = this.reduceMotion ? 0 : 1
    for (const l of this.limbs) {
      const p = l.parent
      const parentAcc = p ? (p.vel - p.prevVel) / dt : 0
      l.prevVel = l.vel
      l.vel += (-l.k * l.off - l.damp * l.vel - parentAcc * 0.5) * dt
      l.off += l.vel * dt
      if (Math.abs(l.off) > l.maxOff) {
        l.off = Math.sign(l.off) * l.maxOff
        l.vel *= -0.3
      }
      const breeze = (Math.sin(this.time * 0.8 + l.phase) * 0.006 * (l.depth + 0.5) + Math.sin(this.time * 0.31) * 0.004) * wind
      l.group.rotation.z = l.baseZ + l.off + breeze
      l.shake = Math.abs(l.vel) + (p ? p.shake * 0.8 : 0)
    }

    // Shaken clusters keep shedding for as long as they move; a light breeze drops the odd petal.
    for (const l of this.limbs) {
      if (l.depth < 2 || l.shake < 0.06) continue
      const own = l.clusters[l.clusters.length - 1]
      own.acc += (l.shake - 0.06) * 14 * dt
      while (own.acc >= 1) {
        own.acc -= 1
        this.spawnFrom(own, -l.vel * 0.4)
      }
    }
    if (!this.reduceMotion) {
      this.ambient += dt * 0.7
      while (this.ambient >= 1) {
        this.ambient -= 1
        this.spawnFrom(this.clusters[Math.floor(Math.random() * this.clusters.length)], 0)
      }
    }

    // Falling petals: drift, flutter and spin, then disappear once they leave the view.
    const t = this.time
    const d = this.dummy
    this.petals.forEach((p, i) => {
      const pool = this.pools[i % this.pools.length]
      const slot = Math.floor(i / this.pools.length)
      if (p.active) {
        p.vel.y += (-p.fall - p.vel.y) * dt * 1.5
        p.vel.x += (0.22 + Math.sin(t * 1.4 + p.phase) * p.sway - p.vel.x) * dt * 1.2
        p.vel.z += (Math.cos(t * 1.1 + p.phase) * 0.15 - p.vel.z) * dt
        p.pos.addScaledVector(p.vel, dt)
        p.rot.x += p.spin.x * dt
        p.rot.y += p.spin.y * dt
        p.rot.z += p.spin.z * dt
        if (p.pos.y < -this.halfH - 0.5 || p.pos.x > this.halfW + 0.6) p.active = false
      }
      d.position.copy(p.pos)
      d.rotation.copy(p.rot)
      d.scale.setScalar(p.active ? this.petalScale : 0)
      d.updateMatrix()
      pool.setMatrixAt(slot, d.matrix)
    })
    for (const pool of this.pools) pool.instanceMatrix.needsUpdate = true
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }

  // ----------------------------------------------------------- cleanup
  dispose() {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.nudgeTimer)
    this.io.disconnect()
    this.ro.disconnect()
    document.removeEventListener('visibilitychange', this.updateRunning)
    this.host.removeEventListener('pointermove', this.onPointerMove)
    this.host.removeEventListener('pointerleave', this.onPointerLeave)
    this.host.removeEventListener('pointerdown', this.onPointerDown)
    this.host.style.cursor = ''

    const geos = new Set<THREE.BufferGeometry>()
    const mats = new Set<THREE.Material>()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) geos.add(m.geometry)
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x))
      if (o instanceof THREE.InstancedMesh) o.dispose()
    })
    geos.forEach((g) => g.dispose())
    mats.forEach((mat) => {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
      mat.dispose()
    })
    this.renderer.dispose()
  }
}
