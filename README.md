# ORRERY — Immersive WebGL Portfolio

A scroll-driven, experimental creative-technology site. One fixed Three.js canvas sits behind the HTML and is choreographed by scroll position and mouse movement. The scenes are all procedural: no models, textures or external assets.

## Stack

- Vite + React + TypeScript
- Three.js, used directly (no React Three Fiber)
- Custom GLSL shaders
- Plain CSS (no Tailwind or Bootstrap)

## Getting started

```bash
npm install three
npm install -D @types/three
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

If your project came from the Vite template, remove any leftover `import './index.css'` or `import './App.css'`. The template's `#root` styles will break the layout. All styling lives in `src/styles/global.css`.

## Structure

```
src/
  main.tsx                  Entry point, imports global.css
  App.tsx                   Mounts the Experience, reveal observer, wires the intensity slider
  components/
    Sections.tsx            Nav, Hud (cards pinned to 3D panels) and all page sections
  three/
    Experience.ts           Renderer, camera, scene objects, scroll/mouse choreography, disposal
    shaders.ts              All GLSL (blob, particles, shards, curves, panels)
  styles/
    global.css              Typography, layout, HUD cards, caption phases
```

## How it works

**One canvas, many stages.** The scene contains every object at a different world position (hero blob at y=0, shards at y=-12, curves at y=-24, particles at y=-36, panels at y=-48, CTA blob at y=-60). The camera flies between them.

**Scroll to section index.** Every element marked `data-stage` is a stage, in DOM order. Each frame, `Experience` computes a continuous index `cur` (for example `2.4` means 40% through the third section), smoothed with frame-rate independent damping.

- **Camera:** interpolates between the entries of `POSES` using `cur`, with mouse parallax added.
- **Visibility:** each stage gets a weight from `cur`, used to fade and show or hide objects.

**Particle choreography.** The `#particles` section is 440vh tall with a sticky inner container. Its scroll progress drives a single uniform, `uP` (0 to 1):

| Progress | Phase |
|---|---|
| 0.00–0.30 | Scattered, then converging into a shell with three orbital rings |
| 0.30–0.45 | Structure holds and slowly rotates |
| 0.45–0.72 | Deform (fbm noise displacement and twist) |
| 0.70–0.88 | Fragment (particles break outward) |
| 0.86–1.00 | Disperse and fade |

The active phase is written to `data-phase` on the section, and CSS shows the matching caption.

**3D-anchored UI.** In the Interface section, each `.card[data-anchor="n"]` is positioned every frame by projecting panel `n`'s world position to screen space. Its scale follows the panel's on-screen width. The "Field intensity" slider calls `Experience.setIntensity()` and changes the blob displacement, particle opacity and panel glow.

## Customising

| Want to change | Where |
|---|---|
| Camera path | `POSES` in `Experience.ts`: `[posX, posY, posZ, targetX, targetY, targetZ]` per section |
| Colours | `makeBlob(detail, colorA, colorB)` calls, plus the vec3 colours in the shader strings |
| Particle count | `makeDust(m ? 16000 : 48000)` |
| Shard count | `makeRing(m ? 420 : 1000)` |
| Curve count | `makeWeave(curves, segments)` |
| Particle end-structure | The `struct` generation loop in `makeDust` |
| Timing of particle phases | `smoothstep` ranges in `dustVert`, and the phase thresholds in `tick()` |
| Copy and section order | `Sections.tsx`. Keep `data-stage` on each section and keep `Experience`'s `POSES` and weight count in step with the number of stages |
| Branding | Replace "Orrery" in `Sections.tsx` |

If you add or remove a section, update `POSES` to match (one pose per `data-stage` element) and the stage weight loop in `tick()`.

## Performance

- **Mobile fallback:** on narrow or touch devices, particles drop to about a third, shards to about 40%, and the blob mesh is simplified. The pixel ratio is capped at 1.5, and cursor parallax is replaced by a slow idle drift.
- **Adaptive pixel ratio:** if the smoothed frame time stays above ~28ms, the pixel ratio steps down (floor 0.8).
- **Geometry and GPU work:** instanced shards and GPU-side particle and curve animation. Hidden stages are skipped via `visible`.
- **Cleanup:** `Experience.dispose()` cancels the render loop, removes listeners, disposes geometries and materials, and removes the canvas. It is safe under React StrictMode.

## Troubleshooting

- **Blank or black canvas:** check the console for shader compile errors and confirm WebGL2 is enabled in the browser.
- **Layout looks centred or padded:** a template stylesheet is still imported. See Getting started.
- **Cards not following panels:** make sure `Hud` is rendered and each card has a `data-anchor` of 0 to 3.
- **Low frame rate:** lower the particle count and the blob detail (40) in `Experience.ts`.

## Browser support

Current Chrome, Edge, Safari and Firefox with WebGL2. Respects `prefers-reduced-motion` for the hero intro animation only; the WebGL motion is not reduced.

## Credits

Design direction inspired by the visual quality of contemporary experimental web studios. All code, copy and graphics are original.