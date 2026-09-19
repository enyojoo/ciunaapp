import { useCallback, useRef } from "react"
import { useFocusEffect } from "expo-router"

/**
 * Silently revalidates on screen focus (tab switch, back-navigation) — never
 * a full reload with a spinner over content that's already on screen. Skips
 * the very first focus, since the mount effect in `useCachedQuery` already
 * covers it; without that guard every screen double-fetches on first visit.
 */
export function useFocusRevalidate(revalidate: () => void): void {
  const revalidateRef = useRef(revalidate)
  revalidateRef.current = revalidate
  const mounted = useRef(false)

  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true
        return
      }
      revalidateRef.current()
    }, []),
  )
}
