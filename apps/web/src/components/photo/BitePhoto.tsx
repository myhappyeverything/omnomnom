import { useEffect, useState } from 'react'

/**
 * The meal photo shown while the AI analyses it, with playful "bites" taken out
 * of the edges — one roughly every second, cycling through a handful of modest
 * bites (never clearing the photo), then refilling and looping until analysis
 * returns. Falls back to a plain image when the user prefers reduced motion.
 */

interface BitePhotoProps {
  src: string
  alt: string
  className?: string
}

// Each bite: a circle mostly off-canvas so only a crescent eats into the edge.
// `at` is the fraction of the cycle when the bite appears (~1s apart over CYCLE).
const BITES = [
  { cx: 50, cy: 2, r: 16, at: 0.14 },
  { cx: 98, cy: 42, r: 16, at: 0.38 },
  { cx: 40, cy: 98, r: 16, at: 0.62 },
  { cx: 3, cy: 64, r: 16, at: 0.85 },
]
const CYCLE = 4.4 // seconds for a full bite-and-refill loop
const CHOMP = 0.09 // fraction of the cycle each bite takes to open

export function BitePhoto({ src, alt, className }: BitePhotoProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  if (reducedMotion) {
    return <img src={src} alt={alt} className={`object-cover ${className ?? ''}`} />
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`overflow-hidden ${className ?? ''}`}
      role="img"
      aria-label={alt}
    >
      <defs>
        <mask id="bite-photo-mask">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {BITES.map((bite, i) => (
            <circle key={i} cx={bite.cx} cy={bite.cy} r="0" fill="black">
              <animate
                attributeName="r"
                values={`0;0;${bite.r};${bite.r}`}
                keyTimes={`0;${bite.at};${Math.min(bite.at + CHOMP, 1)};1`}
                dur={`${CYCLE}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </mask>
      </defs>
      <image
        href={src}
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid slice"
        mask="url(#bite-photo-mask)"
      />
    </svg>
  )
}
