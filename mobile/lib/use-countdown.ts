import { useEffect, useState } from "react"
import { msUntil } from "./countdown"

/** Milliseconds left until `iso`, ticking each second; null when there is no deadline. */
export function useCountdown(iso: string | null | undefined): number | null {
  const [left, setLeft] = useState<number | null>(() => msUntil(iso))
  useEffect(() => {
    setLeft(msUntil(iso))
    if (!iso) return
    const id = setInterval(() => setLeft(msUntil(iso)), 1000)
    return () => clearInterval(id)
  }, [iso])
  return left
}
