import type { ReactNode } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { CONTENT_MAX_WIDTH, WEB_PHONE_FRAME_PADDING } from "@/lib/layout-metrics"
import { colors, shadow } from "@/lib/theme"

/**
 * Phone chrome only on confirmed mobile web.
 * Tablet/desktop pass through so DesktopShell owns the structure.
 */
export function WebViewportFrame({ children }: { children: ReactNode }) {
  const { mode, isWeb } = useResponsiveLayout()

  if (!isWeb || Platform.OS !== "web" || mode === "desktop" || mode === "tablet") {
    return <>{children}</>
  }

  return (
    <View style={[styles.outer, { backgroundColor: colors.border }]}>
      <View style={[styles.inner, styles.phoneChrome, { maxWidth: CONTENT_MAX_WIDTH }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "100%",
    paddingVertical: WEB_PHONE_FRAME_PADDING,
    paddingHorizontal: WEB_PHONE_FRAME_PADDING,
  },
  inner: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    maxHeight: "100%",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.paper,
    paddingBottom: 2,
  },
  phoneChrome: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 17, 16, 0.12)",
    borderRadius: 20,
    ...shadow({ opacity: 0.08, radius: 16, offsetY: 8, elevation: 4 }),
  },
})
