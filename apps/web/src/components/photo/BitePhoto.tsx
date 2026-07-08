import { useEffect, useState } from 'react'

/**
 * The meal photo shown while the AI analyses it, getting eaten alive. A fresh
 * chomp lands roughly once a second — each one a scalloped bite mark (a cluster
 * of overlapping "teeth", not a clean circle) — and they accumulate, marching
 * across the photo and escalating in size so it's fully devoured if the analysis
 * runs long. In practice the result returns after only the first few bites.
 * Does not loop. Falls back to a plain image when the user prefers reduced motion.
 */

interface BitePhotoProps {
  src: string
  alt: string
  className?: string
}

const STEP = 0.9 // seconds between chomps
const CHOMP_DUR = 0.32 // seconds for a single chomp to snap open
const TEETH = 7 // scallops per bite — the more, the more "gnawed" the rim
const TOOTH_RATIO = 0.34 // tooth radius as a fraction of the bite radius
const BITE_R = 17 // radius of each bite in the 0–100 viewBox space

// Bite centres trace a zig-zag sweep that starts just off the top-left edge and
// chews row by row across the photo. Consecutive bites overlap, so the eaten
// area is one connected, advancing frontier (photo being devoured) rather than
// scattered holes. The first couple of bites only nibble the corner; it takes
// the whole path to finish the photo — longer than any normal analysis.
const CENTERS: [number, number][] = (() => {
  const rows = [8, 36, 64, 92]
  const xs = [-6, 20, 46, 72, 98]
  return rows.flatMap((y, r) => {
    const order = r % 2 === 0 ? xs : [...xs].reverse()
    return order.map((x) => [x, y] as [number, number])
  })
})()

/** A chomp: a main circle plus a ring of teeth, all snapping open together. */
function Chomp({ cx, cy, r, begin }: { cx: number; cy: number; r: number; begin: number }) {
  // Grow with a slight overshoot for a "snap", then freeze — never reset.
  const grow = (target: number) => (
    <animate
      attributeName="r"
      values={`0;${(target * 1.08).toFixed(1)};${target}`}
      keyTimes="0;0.7;1"
      keySplines="0.2 0.8 0.3 1;0.4 0 0.6 1"
      calcMode="spline"
      dur={`${CHOMP_DUR}s`}
      begin={`${begin}s`}
      fill="freeze"
    />
  )

  const toothR = r * TOOTH_RATIO
  const teeth = Array.from({ length: TEETH }, (_, t) => {
    const angle = (t / TEETH) * Math.PI * 2
    const tx = cx + Math.cos(angle) * r
    const ty = cy + Math.sin(angle) * r
    return (
      <circle key={t} cx={tx.toFixed(1)} cy={ty.toFixed(1)} r="0" fill="black">
        {grow(toothR)}
      </circle>
    )
  })

  return (
    <>
      <circle cx={cx} cy={cy} r="0" fill="black">
        {grow(r)}
      </circle>
      {teeth}
    </>
  )
}

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
          {CENTERS.map(([cx, cy], i) => (
            <Chomp key={i} cx={cx} cy={cy} r={BITE_R} begin={i * STEP} />
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
