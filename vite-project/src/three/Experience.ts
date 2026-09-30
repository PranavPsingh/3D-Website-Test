import * as THREE from 'three'
import * as S from './shaders'

const clamp = THREE.MathUtils.clamp
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const Y = new THREE.Vector3(0, 1, 0)

// camera pose per section: position xyz, target xyz
const POSES = [
  [0, 0, 7.5, 0, 0, 0],
  [-2.2, -0.3, 8.5, -2.2, -0.3, 0],
  [-3, -11, 10, -3, -12, 0],
  [3, -24, 11, 3, -24, 0],
  [0, -36, 10, 0, -36, 0],
  [0, -48, 9.5, 0, -48, 0],
  [0, -60, 8.5, 0, -60, 0],
  [0, -61.5, 11, 0, -60, 0],
].map((a) => ({ p: new THREE.Vector3(a[0], a[1], a[2]), t: new THREE.Vector3(a[3], a[4], a[5]) }))

function makeBlob(detail: number, a: number, b: number) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.blobVert,
    fragmentShader: S.blobFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.3 },
      uW: { value: 1 },
      uMouse: { value: new THREE.Vector2() },
      uA: { value: new THREE.Color(a) },
      uB: { value: new THREE.Color(b) },
    },
  })
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, detail), mat)
  mesh.frustumCulled = false
  return { mesh, mat }
}

function makeDust(n: number) {
  const scatter = new Float32Array(n * 3)
  const struct = new Float32Array(n * 3)
  const rnd = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const r = 5 + Math.pow(Math.random(), 0.6) * 17
    scatter.set([s * Math.cos(th) * r, u * r * 0.7, s * Math.sin(th) * r], i * 3)
    const k = i % 10
    if (k < 6) {
      const r2 = 2.3 + (Math.random() - 0.5) * 0.12
      struct.set([s * Math.cos(th) * r2, u * r2, s * Math.sin(th) * r2], i * 3)
    } else {
      const ring = k - 6
      const rr = 3.4 + (Math.random() - 0.5) * 0.1 + ring * 0.25
      const ph = Math.random() * Math.PI * 2
      const c = Math.cos(ph) * rr
      const d = Math.sin(ph) * rr
      const v = new THREE.Vector3(c, d, (Math.random() - 0.5) * 0.08)
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5 + ring * 0.9)
      v.applyAxisAngle(Y, ring * 1.1)
      struct.set([v.x, v.y, v.z], i * 3)
    }
    rnd.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(struct, 3))
  geo.setAttribute('aStruct', new THREE.BufferAttribute(struct, 3))
  geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.dustVert,
    fragmentShader: S.dustFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uP: { value: 0 }, uPx: { value: 1 }, uOp: { value: 0.3 } },
  })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  return { pts, mat }
}

function makeRing(n: number) {
  const geo = new THREE.BoxGeometry(0.035, 0.5, 0.035)
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.shardVert,
    fragmentShader: S.shardFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uW: { value: 0 } },
  })
  const mesh = new THREE.InstancedMesh(geo, mat, n)
  const seeds = new Float32Array(n)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 2.6 + Math.pow(Math.random(), 0.7) * 3.4
    p.set(Math.cos(a) * r, (Math.random() - 0.5) * (1.2 + (r - 2.6) * 0.3) + Math.sin(a * 3) * 0.4, Math.sin(a) * r)
    e.set(Math.random() * 3.14, -a, Math.random() * 3.14)
    q.setFromEuler(e)
    s.set(1, 0.6 + Math.random() * 2.2, 1)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
    seeds[i] = Math.random()
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  mesh.frustumCulled = false
  return { mesh, mat }
}

function makeWeave(curves: number, seg: number) {
  const n = curves * seg * 2
  const aT = new Float32Array(n)
  const aS = new Float32Array(n)
  let k = 0
  for (let c = 0; c < curves; c++) {
    const seed = c / curves
    for (let j = 0; j < seg; j++) {
      aT[k] = j / seg
      aS[k++] = seed
      aT[k] = (j + 1) / seg
      aS[k++] = seed
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aS, 1))
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.weaveVert,
    fragmentShader: S.weaveFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uW: { value: 0 } },
  })
  const lines = new THREE.LineSegments(geo, mat)
  lines.frustumCulled = false
  return { lines, mat }
}

const PW = 2.6
const PH = 1.7
const PANEL_DEFS = [
  [-3.3, 0.9, -0.8, 0.28],
  [0.2, 1.35, -2.4, 0],
  [3.4, 0.5, -0.6, -0.3],
  [-1.2, -1.5, 0.9, 0.12],
]

function makePanels() {
  const group = new THREE.Group()
  const meshes: THREE.Mesh[] = []
  const mats: THREE.ShaderMaterial[] = []
  PANEL_DEFS.forEach((d, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: S.panelVert,
      fragmentShader: S.panelFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uW: { value: 0 }, uI: { value: 1 }, uSeed: { value: i * 0.27 } },
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat)
    mesh.position.set(d[0], d[1], d[2])
    mesh.rotation.y = d[3]
    mesh.userData.by = d[1]
    group.add(mesh)
    meshes.push(mesh)
    mats.push(mat)
  })
  return { group, meshes, mats }
}

export class Experience {
  private host: HTMLElement
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
  private clock = new THREE.Clock()
  private raf = 0
  private mobile: boolean
  private dpr: number
  private maxDpr: number
  private fit = 1
  private mouse = new THREE.Vector2()
  private mouseS = new THREE.Vector2()
  private cur = 0
  private pp = 0
  private vel = 0
  private lastY = 0
  private intensity = 1
  private phase = -1
  private ema = 0.016
  private lastAdj = 0
  private sections: HTMLElement[]
  private partEl: HTMLElement | null
  private cards: { el: HTMLElement; i: number }[]
  private camP = new THREE.Vector3(0, 0, 7.5)
  private camT = new THREE.Vector3()
  private dP = new THREE.Vector3()
  private dT = new THREE.Vector3()
  private off = new THREE.Vector3()
  private tmp = new THREE.Vector3()
  private blob1 = makeBlob(40, 0x0a1030, 0x3a2a7a)
  private blob2 = makeBlob(40, 0x2a0e1e, 0x8a3a2a)
  private dust: ReturnType<typeof makeDust>
  private ring: ReturnType<typeof makeRing>
  private weave: ReturnType<typeof makeWeave>
  private panels = makePanels()

  constructor(host: HTMLElement) {
    this.host = host
    this.mobile = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches
    this.maxDpr = this.mobile ? 1.5 : 2
    this.dpr = Math.min(devicePixelRatio, this.maxDpr)
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.mobile, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x04050a, 1)
    host.appendChild(this.renderer.domElement)

    this.sections = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'))
    this.partEl = document.getElementById('particles')
    this.cards = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor]')).map((el) => ({
      el,
      i: Number(el.dataset.anchor),
    }))

    const m = this.mobile
    this.dust = makeDust(m ? 16000 : 48000)
    this.ring = makeRing(m ? 420 : 1000)
    this.weave = makeWeave(m ? 28 : 56, m ? 90 : 140)
    if (m) {
      this.blob1.mesh.geometry.dispose()
      this.blob1.mesh.geometry = new THREE.IcosahedronGeometry(1, 22)
      this.blob2.mesh.geometry.dispose()
      this.blob2.mesh.geometry = new THREE.IcosahedronGeometry(1, 22)
    }
    this.blob2.mesh.position.set(0, -60, 0)
    this.ring.mesh.position.y = -12
    this.weave.lines.position.y = -24
    this.panels.group.position.y = -48
    this.scene.add(this.dust.pts, this.blob1.mesh, this.blob2.mesh, this.ring.mesh, this.weave.lines, this.panels.group)

    this.lastY = scrollY
    this.onResize()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    this.tick()
  }

  setIntensity(v: number) {
    this.intensity = v
  }

  private onPointer = (e: PointerEvent) => {
    this.mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1))
  }

  private applyDpr() {
    this.renderer.setPixelRatio(this.dpr)
    this.dust.mat.uniforms.uPx.value = this.dpr
  }

  private onResize = () => {
    const w = innerWidth
    const h = innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.fit = Math.max(1, 1.15 / this.camera.aspect)
    this.applyDpr()
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    const vh = innerHeight

    // adaptive pixel ratio
    this.ema += (dt - this.ema) * 0.05
    if (this.ema > 0.028 && this.dpr > 0.8 && t - this.lastAdj > 1.5) {
      this.dpr = Math.max(0.8, this.dpr - 0.2)
      this.lastAdj = t
      this.renderer.setPixelRatio(this.dpr)
      this.dust.mat.uniforms.uPx.value = this.dpr
    }

    // continuous section index
    const rects = this.sections.map((s) => s.getBoundingClientRect())
    let idx = 0
    for (let i = 0; i < rects.length; i++) if (rects[i].top <= vh * 0.5) idx = i
    const frac = clamp((vh * 0.5 - rects[idx].top) / rects[idx].height, 0, 1)
    this.cur += (idx + frac - this.cur) * (1 - Math.exp(-dt * 4))
    const cur = this.cur

    // particle section progress
    if (this.partEl) {
      const r = this.partEl.getBoundingClientRect()
      const raw = clamp(-r.top / Math.max(1, r.height - vh), 0, 1)
      this.pp += (raw - this.pp) * (1 - Math.exp(-dt * 5))
      const ph = this.pp < 0.25 ? 0 : this.pp < 0.5 ? 1 : this.pp < 0.7 ? 2 : this.pp < 0.87 ? 3 : 4
      if (ph !== this.phase) {
        this.phase = ph
        this.partEl.dataset.phase = String(ph)
      }
      this.partEl.style.setProperty('--pp', this.pp.toFixed(3))
    }

    // scroll velocity
    const y = scrollY
    const v = Math.abs(y - this.lastY) / Math.max(dt, 0.001) / 1000
    this.lastY = y
    this.vel += (clamp(v, 0, 3) - this.vel) * (1 - Math.exp(-dt * 5))

    // mouse (idle drift on touch devices)
    if (this.mobile) this.mouse.set(Math.sin(t * 0.2) * 0.35, Math.cos(t * 0.17) * 0.25)
    this.mouseS.lerp(this.mouse, 1 - Math.exp(-dt * 3))
    const mx = this.mouseS.x
    const my = this.mouseS.y

    // stage weights
    const w: number[] = []
    for (let k = 0; k < 8; k++) w.push(1 - sm(0.35, 0.95, Math.abs(cur - (k + 0.5))))

    // camera
    const cc = cur - 0.5
    const i = clamp(Math.floor(cc), 0, POSES.length - 2)
    const f = sm(0, 1, clamp(cc - i, 0, 1))
    this.dP.lerpVectors(POSES[i].p, POSES[i + 1].p, f)
    this.dT.lerpVectors(POSES[i].t, POSES[i + 1].t, f)
    this.off.copy(this.dP).sub(this.dT)
    this.off.applyAxisAngle(Y, (this.pp - 0.5) * 1.4 * w[4])
    this.off.multiplyScalar((1 - 0.25 * Math.sin(this.pp * Math.PI) * w[4]) * this.fit)
    this.dP.copy(this.dT).add(this.off)
    this.dP.x += mx * 0.7
    this.dP.y += my * 0.45
    const k = 1 - Math.exp(-dt * 3)
    this.camP.lerp(this.dP, k)
    this.camT.lerp(this.dT, k)
    this.camera.position.copy(this.camP)
    this.camera.lookAt(this.camT)
    this.camera.fov = 45 + this.vel * 4
    this.camera.updateProjectionMatrix()

    // hero / intro blob
    const b1 = Math.max(w[0], w[1])
    const B1 = this.blob1
    B1.mesh.visible = b1 > 0.01
    B1.mesh.scale.setScalar(2.0 - 0.5 * sm(0.5, 1.5, cur))
    B1.mesh.rotation.set(-my * 0.4 + t * 0.05, t * 0.12 + mx * 0.6, 0)
    B1.mat.uniforms.uAmp.value = (0.28 + this.vel * 0.22) * clamp(this.intensity, 0.3, 1.4)
    B1.mat.uniforms.uW.value = b1
    B1.mat.uniforms.uMouse.value.set(mx, my)

    // CTA blob
    const b2 = Math.max(w[6], w[7])
    const B2 = this.blob2
    B2.mesh.visible = b2 > 0.01
    B2.mesh.scale.setScalar(2.5)
    B2.mesh.rotation.set(my * 0.3 + t * 0.04, t * 0.1 - mx * 0.6, 0)
    B2.mat.uniforms.uAmp.value = (0.34 + this.vel * 0.22) * clamp(this.intensity, 0.3, 1.4)
    B2.mat.uniforms.uW.value = b2
    B2.mat.uniforms.uMouse.value.set(mx, my)

    // shards
    this.ring.mesh.visible = w[2] > 0.01
    this.ring.mesh.rotation.set(0.9 - my * 0.3, t * 0.08 + mx * 0.5, (cur - 2.5) * 0.4)
    this.ring.mat.uniforms.uW.value = w[2]

    // curve bundle
    this.weave.lines.visible = w[3] > 0.01
    this.weave.lines.rotation.y = t * 0.05 + mx * 0.5 + (cur - 3.5) * 0.8
    this.weave.mat.uniforms.uW.value = w[3]

    // dust follows focus
    this.dust.pts.position.copy(this.camT)
    this.dust.mat.uniforms.uP.value = this.pp
    this.dust.mat.uniforms.uOp.value = (0.28 + 0.72 * w[4]) * clamp(this.intensity, 0, 1.5)

    // panels
    this.panels.group.visible = w[5] > 0.01
    this.panels.group.rotation.set(-my * 0.12, mx * 0.25, 0)
    this.panels.meshes.forEach((m, n) => {
      m.position.y = m.userData.by + Math.sin(t * 0.6 + n) * 0.08
      const u = this.panels.mats[n].uniforms
      u.uW.value = w[5]
      u.uI.value = this.intensity
    })

    // time uniforms
    for (const mat of [B1.mat, B2.mat, this.dust.mat, this.ring.mat, this.weave.mat, ...this.panels.mats]) {
      mat.uniforms.uTime.value = t
    }

    this.scene.updateMatrixWorld()
    this.camera.updateMatrixWorld()
    this.renderer.render(this.scene, this.camera)

    // HTML UI anchored to 3D panels
    const show = clamp((w[5] - 0.3) / 0.5, 0, 1)
    const ppu = vh / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    for (const c of this.cards) {
      const mesh = this.panels.meshes[c.i]
      if (!mesh) continue
      mesh.getWorldPosition(this.tmp)
      const dist = this.camera.position.distanceTo(this.tmp)
      this.tmp.project(this.camera)
      const px = (this.tmp.x * 0.5 + 0.5) * innerWidth
      const py = (-this.tmp.y * 0.5 + 0.5) * vh
      const s = (PW * ppu) / dist / 280
      c.el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(3)}) rotateY(${(mx * 8).toFixed(2)}deg)`
      c.el.style.opacity = show.toFixed(3)
      c.el.style.pointerEvents = show > 0.6 ? 'auto' : 'none'
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointer)
    this.scene.traverse((o) => {
      const obj = o as THREE.Mesh
      if (obj.geometry) obj.geometry.dispose()
      const m = obj.material as THREE.Material | undefined
      if (m) m.dispose()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
    void this.host
  }
}