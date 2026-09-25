import { Platform } from "react-native"
import { DESKTOP_MIN_WIDTH, type LayoutMode } from "@/lib/layout-metrics"

const VIEWPORT_KEY = "ciuna.webChrome"

type StoredViewport = { width: number; height: number; mode: LayoutMode }

export function persistWebViewport(input: { width: number; height: number; mode: LayoutMode }) {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(VIEWPORT_KEY, JSON.stringify(input))
  } catch {
    /* private mode */
  }
}

function readStoredViewport(): StoredViewport | null {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return null
  try {
    const parsed = JSON.parse(sessionStorage.getItem(VIEWPORT_KEY) || "null") as StoredViewport | null
    if (!parsed?.width || parsed.width < 1) return null
    return parsed
  } catch {
    return null
  }
}

function measureBrowserViewport(): { width: number; height: number } | null {
  if (typeof window === "undefined") return null
  const width = Math.max(window.innerWidth || 0, document.documentElement?.clientWidth || 0)
  const height = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0)
  if (width < 1) return null
  return { width, height }
}

/**
 * On Expo web, `useWindowDimensions` often starts at a phone size (or 0).
 * Always trust the browser. If it is not available yet, reuse the last
 * viewport or assume desktop — never invent a mobile frame on a large screen.
 */
export function readWebViewport(rnWidth: number, rnHeight: number): { width: number; height: number } {
  if (Platform.OS !== "web") return { width: rnWidth, height: rnHeight }

  const live = measureBrowserViewport()
  if (live) return live

  const stored = readStoredViewport()
  if (stored) return { width: stored.width, height: stored.height }

  return { width: DESKTOP_MIN_WIDTH, height: 800 }
}

/**
 * Decorative phone chrome is for desktop browsers resized to mobile width.
 * Real phones/tablets (coarse pointer / no hover) should fill the viewport.
 */
export function isDesktopLikeWebBrowser(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  try {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches
  } catch {
    return false
  }
}
