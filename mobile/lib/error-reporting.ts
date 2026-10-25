import Constants from "expo-constants"
import { Platform } from "react-native"
import { apiUrl } from "@/lib/api"

let installed = false
let lastSent = 0

/**
 * Sends a crash or error to the API (which scrubs it and forwards to the error tracker). Fire and forget: reporting must
 * never throw or block the app, and at most one report goes out every 5 seconds from one device.
 */
export function reportClientError(error: unknown, opts: { fatal?: boolean; route?: string } = {}): void {
  const now = Date.now()
  if (now - lastSent < 5000) return
  lastSent = now
  const e = error instanceof Error ? error : new Error(String(error))
  try {
    void fetch(apiUrl("/api/client-errors"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "mobile",
        message: e.message,
        stack: e.stack,
        fatal: !!opts.fatal,
        route: opts.route || Platform.OS,
        release: Constants.expoConfig?.version,
      }),
    }).catch(() => {})
  } catch {
    // ignore
  }
}

/** Reports uncaught errors and unhandled promise rejections. Safe to call more than once. */
export function installErrorReporting(): void {
  if (installed || __DEV__) return
  installed = true
  const g = globalThis as unknown as { ErrorUtils?: { getGlobalHandler: () => (e: unknown, fatal?: boolean) => void; setGlobalHandler: (h: (e: unknown, fatal?: boolean) => void) => void } }
  const previous = g.ErrorUtils?.getGlobalHandler()
  g.ErrorUtils?.setGlobalHandler((error, fatal) => {
    reportClientError(error, { fatal })
    previous?.(error, fatal)
  })
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (ev) => reportClientError(ev.reason))
  }
}
