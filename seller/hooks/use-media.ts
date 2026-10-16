"use client"
import * as React from "react"

/** True when the media query matches. False on the server and first paint, so layout never flashes the wrong branch into hydration. */
export function useMedia(query: string): boolean {
  const [match, setMatch] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return match
}
