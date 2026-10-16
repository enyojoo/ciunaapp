import { useSyncExternalStore } from "react"
import { Platform } from "react-native"

/**
 * Whether the app can reach the network. No extra package: the app's own requests report it (a request that
 * fails at the network level means offline, any response means online), and on web the browser's
 * online and offline events do the same.
 */
let offline = false
const listeners = new Set<() => void>()

function set(next: boolean) {
  if (offline === next) return
  offline = next
  listeners.forEach((l) => l())
}

export const markOnline = () => set(false)
export const markOffline = () => set(true)

if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("online", markOnline)
  window.addEventListener("offline", markOffline)
  if (typeof navigator !== "undefined" && navigator.onLine === false) offline = true
}

/** Wraps a request: a thrown network error marks the app offline, a response marks it online. */
export async function tracked(request: Promise<Response>): Promise<Response> {
  try {
    const res = await request
    markOnline()
    return res
  } catch (e) {
    if (e instanceof TypeError) markOffline()
    throw e
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useOffline(): boolean {
  return useSyncExternalStore(subscribe, () => offline, () => false)
}
