export const CONTENT_MAX_WIDTH = 428
/** Icon + label stack (excludes tab bar top/bottom padding). */
export const TAB_BAR_CONTENT_HEIGHT = 52
export const TAB_BAR_ICON_SIZE = 22
export const TAB_BAR_LABEL_SIZE = 12
export const TAB_BAR_LABEL_LINE_HEIGHT = 16
export const WEB_PHONE_FRAME_PADDING = 12
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
