import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { Platform, useWindowDimensions } from "react-native"
import {
  CONTENT_MAX_WIDTH,
  CONTENT_MAX_WIDTH_DESKTOP,
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
  getLayoutMode,
  type LayoutMode,
} from "@/lib/layout-metrics"

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

function resolveContentMaxWidth(mode: LayoutMode, viewportWidth: number): number {
  if (mode === "desktop") {
    const available = Math.max(0, viewportWidth - SIDEBAR_WIDTH)
    return Math.min(available, CONTENT_MAX_WIDTH_DESKTOP)
  }
  if (mode === "tablet") {
    return Math.max(0, viewportWidth - SIDEBAR_WIDTH)
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
    const mode = getLayoutMode(width)
    const isWeb = Platform.OS === "web"
    const showSidebarShell = isWeb && (mode === "tablet" || mode === "desktop")

    return {
      mode,
      width,
      height,
      isWeb,
      showSidebarShell,
      contentMaxWidth: resolveContentMaxWidth(mode, width),
      sidebarWidth: SIDEBAR_WIDTH,
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

/** Product / expert-service catalog: 4-up on Expo web tablet/desktop, 2-up on native and phone-width web. */
export function useCatalogGridColumns(): 2 | 4 {
  const layout = useOptionalResponsiveLayout()
  if (layout?.isWeb && layout.mode !== "mobile") return 4
  return 2
}

export function catalogCardWidth(columns: 2 | 4): `${number}%` {
  return columns === 4 ? "23.5%" : "48.5%"
}

export function isAppShellPath(pathname: string): boolean {
  if (pathname.startsWith("/auth")) return false
  if (pathname === "/pin" || pathname === "/pin-setup") return false
  return true
}
