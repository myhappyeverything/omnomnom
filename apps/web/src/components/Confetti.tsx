import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLORS = [
  'var(--color-burnt-orange)',
  'var(--color-terracotta)',
  'var(--color-dusty-coral)',
  'var(--color-sage)',
  'var(--color-olive)',
  'var(--color-mustard)',
  'var(--color-sky-blue)',
]

const PARTICLE_COUNT = 18

interface Particle {
  id: number
  color: string
  angle: number
  distance: number
  size: number
  rotation: number
  delay: number
}

/** A small, tasteful burst — not a flashy full-screen effect — that fires once when the nutrition score crosses 90. */
export function Confetti() {
  const prefersReducedMotion = useReducedMotion()

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
        id,
        // Safe: `id % COLORS.length` is always a valid index into COLORS.
        color: COLORS[id % COLORS.length]!,
        angle: (id / PARTICLE_COUNT) * 360 + (Math.random() * 20 - 10),
        distance: 60 + Math.random() * 50,
        size: 5 + Math.random() * 4,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.08,
      })),
    [],
  )

  if (prefersReducedMotion) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {particles.map((particle) => {
        const radians = (particle.angle * Math.PI) / 180
        const x = Math.cos(radians) * particle.distance
        const y = Math.sin(radians) * particle.distance
        return (
          <motion.span
            key={particle.id}
            className="absolute rounded-sm"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{ x, y, opacity: 0, rotate: particle.rotation, scale: 1 }}
            transition={{ duration: 0.9, delay: particle.delay, ease: [0.16, 1, 0.3, 1] }}
          />
        )
      })}
    </div>
  )
}
