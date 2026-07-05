import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/** Animates a displayed number toward `value` whenever it changes — used for
 * the calorie/macro/score numbers so they visibly count up rather than jump. */
export function useCountUp(value: number, durationSeconds = 0.6): number {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value)
      previous.current = value
      return
    }

    const controls = animate(previous.current, value, {
      duration: durationSeconds,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    })
    previous.current = value
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-animate when the target value changes
  }, [value])

  return display
}
