import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { Platform, useWindowDimensions } from "react-native"
import {
  CONTENT_MAX_WIDTH,
  CONTENT_MAX_WIDTH_DESKTOP,
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
  TABLET_SIDEBAR_WIDTH,
  getLayoutMode,
  type LayoutMode,
} from "@/lib/layout-metrics"
import { readWebViewport } from "@/lib/web-viewport"

type ResponsiveLayoutValue = {
  mode: LayoutMode
  width: number
  height: number
  isWeb: boolean
  showSidebarShell: boolean
  contentMaxWidth: number
  sidebarWidth: number
  headerHeight: number
}

const ResponsiveLayoutContext = createContext<ResponsiveLayoutValue | null>(null)

function sidebarWidthForMode(mode: LayoutMode): number {
  if (mode === "tablet") return TABLET_SIDEBAR_WIDTH
  return SIDEBAR_WIDTH
}

function resolveContentMaxWidth(mode: LayoutMode, viewportWidth: number): number {
  if (mode === "desktop") {
    const available = Math.max(0, viewportWidth - SIDEBAR_WIDTH)
    return Math.min(available, CONTENT_MAX_WIDTH_DESKTOP)
  }
  if (mode === "tablet") {
    return Math.max(0, viewportWidth - TABLET_SIDEBAR_WIDTH)
  }
  return CONTENT_MAX_WIDTH
}

export function ResponsiveLayoutProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions()
  const [resizeTick, setResizeTick] = useState(0)

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return
    let timer: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setResizeTick((t) => t + 1), 100)
    }
    window.addEventListener("resize", onResize)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  const value = useMemo(() => {
    void resizeTick
    const viewport = readWebViewport(width, height)
    const mode = getLayoutMode(viewport.width)
    const isWeb = Platform.OS === "web"
    const showSidebarShell = isWeb && (mode === "tablet" || mode === "desktop")

    return {
      mode,
      width: viewport.width,
      height: viewport.height,
      isWeb,
      showSidebarShell,
      contentMaxWidth: resolveContentMaxWidth(mode, viewport.width),
      sidebarWidth: sidebarWidthForMode(mode),
      headerHeight: HEADER_HEIGHT,
    }
  }, [height, resizeTick, width])

  return <ResponsiveLayoutContext.Provider value={value}>{children}</ResponsiveLayoutContext.Provider>
}

export function useResponsiveLayout(): ResponsiveLayoutValue {
  const ctx = useContext(ResponsiveLayoutContext)
  if (!ctx) {
    throw new Error("useResponsiveLayout must be used within ResponsiveLayoutProvider")
  }
  return ctx
}

export function useOptionalResponsiveLayout(): ResponsiveLayoutValue | null {
  return useContext(ResponsiveLayoutContext)
}

/** Catalog: 4-up desktop web, 3-up tablet web, 2-up native and phone-width web. */
export function useCatalogGridColumns(): 2 | 3 | 4 {
  const layout = useOptionalResponsiveLayout()
  if (layout?.isWeb && layout.mode === "desktop") return 4
  if (layout?.isWeb && layout.mode === "tablet") return 3
  return 2
}

export function catalogCardWidth(columns: 2 | 3 | 4): `${number}%` {
  if (columns === 4) return "23.5%"
  if (columns === 3) return "31.5%"
  return "48.5%"
}

export function isAppShellPath(pathname: string): boolean {
  if (pathname.startsWith("/auth")) return false
  if (pathname === "/pin" || pathname === "/pin-setup") return false
  return true
}
