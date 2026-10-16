import * as React from "react"

/**
 * SSR-safe replacement for framer-motion's `useReducedMotion`.
 *
 * framer-motion's own hook reads `window.matchMedia` the first time it's
 * invoked on the client (not inside an effect), so on the client's very
 * first render it can already report `true`/`false` while the server -
 * which has no `window` - always rendered as if motion was not reduced.
 * That mismatch between the server-rendered markup and the client's first
 * render is what triggers React's hydration error for every `motion.*`
 * element whose `initial`/`animate` props branch on the reduced-motion
 * value.
 *
 * This hook always returns `false` on the first render (matching the
 * server), then updates to the real preference in an effect once the
 * component has mounted, so hydration always matches and any reduced-
 * motion handling kicks in a frame after mount instead of before it.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setPrefersReducedMotion(mql.matches)

    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return prefersReducedMotion
}
