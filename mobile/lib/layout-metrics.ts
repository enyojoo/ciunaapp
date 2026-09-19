export const CONTENT_MAX_WIDTH = 428
export const REGULAR_WIDTH_BREAKPOINT = 600
export const TABLET_MAX_WIDTH = 480
export const DESKTOP_MIN_WIDTH = 1024
export const SIDEBAR_WIDTH = 256
export const TABLET_SIDEBAR_WIDTH = 200
export const HEADER_HEIGHT = 64
export const CONTENT_MAX_WIDTH_DESKTOP = 1440

export type LayoutMode = "mobile" | "tablet" | "desktop"

export function getLayoutMode(width: number): LayoutMode {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop"
  if (width >= REGULAR_WIDTH_BREAKPOINT) return "tablet"
  return "mobile"
}
