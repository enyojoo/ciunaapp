import type { ReactNode } from "react"

/**
 * Previously wrapped mobile-width web in a decorative phone chrome.
 * Real phones and in-IDE mobile previews both need edge-to-edge fill, so
 * this is now a pass-through. Keep the export so root layout stays stable.
 */
export function WebViewportFrame({ children }: { children: ReactNode }) {
  return <>{children}</>
}
