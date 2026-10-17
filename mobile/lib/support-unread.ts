import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { authJson } from "./social-api"

/** Support threads with a reply the customer has not read. Polls gently; failures are silent. */
export function useSupportUnread(enabled = true) {
  const [count, setCount] = useState(0)
  const load = useCallback(async () => {
    try {
      setCount((await authJson<{ count: number }>("/api/support/unread")).count || 0)
    } catch {
      /* a badge is a nicety */
    }
  }, [])
  useEffect(() => {
    if (!enabled) return
    void load()
    const timer = setInterval(() => void load(), 60_000)
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void load()
    })
    return () => {
      clearInterval(timer)
      sub.remove()
    }
  }, [enabled, load])
  return { count, reload: load }
}
