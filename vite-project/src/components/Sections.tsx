import type { CSSProperties } from 'react'

export function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="logo">Orrery<sup>®</sup></a>
      <div>
        <a href="#intro">Studio</a>
        <a href="#matter">Matter</a>
        <a href="#particles">Field</a>
        <a href="#interface">Interface</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

export function Hud({ onIntensity }: { onIntensity: (v: number) => void }) {
  return (
    <div className="hud">
      <div className="card" data-anchor="0">
        <span className="mono">Signal</span>
        <b>98.2<i>%</i></b>
        <div className="bars">
          {Array.from({ length: 20 }, (_, k) => (
            <em key={k} style={{ height: `${20 + ((k * 37) % 70)}%` }} />
          ))}
        </div>
      </div>
      <div className="card" data-anchor="1">
        <span className="mono">Particles</span>
        <b>48,000</b>
        <p>Streaming from a single GPU buffer, re-shaped every frame.</p>
      </div>
      <div className="card" data-anchor="2">
        <span className="mono">Latency</span>
        <b>12<i>ms</i></b>
        <p><span className="dot" /> Live — orbit mode</p>
      </div>
      <div className="card" data-anchor="3">
        <span className="mono">Field intensity</span>
        <input
          type="range"
          min="0.2"
          max="1.5"
          step="0.01"
          defaultValue="1"
          onChange={(e) => onIntensity(parseFloat(e.target.value))}
          aria-label="Field intensity"
        />
        <p>Drag to re-tune the whole scene.</p>
      </div>
    </div>
  )
}

export default function Sections() {
  return (
    <main>
      <section className="sec hero" id="top" data-stage>
        <p className="mono rv">Studio for spatial interfaces — Dubai / Remote</p>
        <h1>
          {[...'ORRERY'].map((c, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties}>{c}</span>
          ))}
        </h1>
        <div className="heroRow">
          <p className="serif">Form, made of light.</p>
          <p className="mono cue">Scroll ↓</p>
        </div>
      </section>

      <section className="sec intro" id="intro" data-stage>
        <div className="col rv">
          <p className="mono">(01) — Studio</p>
          <p className="big serif">
            We build digital objects that behave like <em>weather</em> — slow, atmospheric and impossible to hold still.
          </p>
          <p className="small">
            Every surface is procedural. Every motion is computed. The result is an interface that feels grown rather than drawn.
          </p>
        </div>
      </section>

      <section className="sec feat left" id="matter" data-stage>
        <div className="col rv">
          <p className="mono">(02) — Kinetic matter</p>
          <h2 className="serif">A thousand <em>shards</em>, one gesture.</h2>
          <p className="small">Instanced geometry orbiting a void, displaced by shader waves and steered by your cursor.</p>
        </div>
      </section>

      <section className="sec feat right" data-stage>
        <div className="col rv">
          <p className="mono">(03) — Signal weave</p>
          <h2 className="serif">Curves that <em>remember</em> motion.</h2>
          <p className="small">Fifty-odd ribbons solved entirely in the vertex shader — no CPU, no keyframes.</p>
        </div>
      </section>

      <section className="sec parts" id="particles" data-stage data-phase="0">
        <div className="sticky">
          <p className="mono">(04) — The field</p>
          <div className="caps">
            <h2 className="serif cap c0">Scattered dust, <em>converging.</em></h2>
            <h2 className="serif cap c1">A structure <em>takes form.</em></h2>
            <h2 className="serif cap c2">Then it <em>deforms.</em></h2>
            <h2 className="serif cap c3">Fragmenting into <em>light.</em></h2>
            <h2 className="serif cap c4">And disperses <em>to nothing.</em></h2>
          </div>
          <div className="pbar"><i /></div>
        </div>
      </section>

      <section className="sec ui" id="interface" data-stage>
        <div className="col rv">
          <p className="mono">(05) — Interface</p>
          <h2 className="serif">Interface as <em>environment.</em></h2>
          <p className="small">These panels live in 3D space. The HTML on top is pinned to them, frame by frame.</p>
        </div>
      </section>

      <section className="sec cta" id="contact" data-stage>
        <p className="mono rv">(06) — Contact</p>
        <h2 className="serif rv">Let’s build something that <em>moves.</em></h2>
        <a className="btn rv" href="mailto:hello@orrery.studio">hello@orrery.studio <span>→</span></a>
      </section>

      <footer className="sec foot" data-stage>
        <span className="mono">© 2026 Orrery Studio</span>
        <span className="mono">Built with Three.js + GLSL</span>
      </footer>
    </main>
  )
}