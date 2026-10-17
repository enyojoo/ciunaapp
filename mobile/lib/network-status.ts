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

let failures = 0

/** Offline only when the evidence says so: the browser itself reports offline, or (phones) two requests in a row fail at the network level. */
export function shouldMarkOffline(isWeb: boolean, browserOnline: boolean | null, consecutiveFailures: number): boolean {
  if (isWeb) return browserOnline === false
  return consecutiveFailures >= 2
}

/**
 * Wraps a request: a response marks the app online. A thrown network error only counts when shouldMarkOffline agrees,
 * because on the web a cancelled request, a blocked cross-origin call or one failing endpoint throws the same error
 * while the person is online.
 */
export async function tracked(request: Promise<Response>): Promise<Response> {
  try {
    const res = await request
    failures = 0
    markOnline()
    return res
  } catch (e) {
    if (e instanceof TypeError) {
      failures += 1
      const browserOnline = Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.onLine : null
      if (shouldMarkOffline(Platform.OS === "web", browserOnline, failures)) markOffline()
    }
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
