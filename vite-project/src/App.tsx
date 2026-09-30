import { useEffect, useRef } from 'react'
import { Experience } from './three/Experience.ts'
import Sections, { Hud, Nav } from './components/Sections.tsx'

export default function App() {
  const host = useRef<HTMLDivElement>(null)
  const exp = useRef<Experience | null>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let e: Experience | null = null
    try {
      e = new Experience(el)
      exp.current = e
    } catch (err) {
      console.error('WebGL unavailable', err)
    }
    el.classList.add('ready')
    const io = new IntersectionObserver(
      (es) => es.forEach((x) => x.isIntersecting && x.target.classList.add('in')),
      { threshold: 0.2 },
    )
    document.querySelectorAll('.rv').forEach((n) => io.observe(n))
    return () => {
      io.disconnect()
      e?.dispose()
      exp.current = null
    }
  }, [])

  return (
    <>
      <div className="gl" ref={host} />
      <div className="grain" />
      <Nav />
      <Hud onIntensity={(v) => exp.current?.setIntensity(v)} />
      <Sections />
    </>
  )
}