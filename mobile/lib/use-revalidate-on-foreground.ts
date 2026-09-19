import { useEffect, useRef } from "react"
import { AppState, type AppStateStatus } from "react-native"

/**
 * Runs `onForeground` when the app comes back from background/inactive — the
 * RN analogue of web's `visibilitychange` revalidation. Pass the same
 * `revalidate` a screen's `useCachedQuery` returns; it's silent, so it never
 * flashes a spinner over content the user is already looking at.
 */
export function useRevalidateOnForeground(onForeground: () => void): void {
  const callbackRef = useRef(onForeground)
  callbackRef.current = onForeground
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        callbackRef.current()
      }
      appState.current = next
    })
    return () => subscription.remove()
  }, [])
}
