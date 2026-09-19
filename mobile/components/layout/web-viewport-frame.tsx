import type { ReactNode } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { useAuth } from "@/lib/auth-context"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { CONTENT_MAX_WIDTH, TABLET_MAX_WIDTH } from "@/lib/layout-metrics"
import { colors, shadow } from "@/lib/theme"

export function WebViewportFrame({ children }: { children: ReactNode }) {
  const { mode, isWeb } = useResponsiveLayout()
  const { user, loading } = useAuth()
  const restoring = loading && !user

  if (!isWeb || Platform.OS !== "web" || restoring || mode !== "mobile") {
    return <>{children}</>
  }

  return (
    <View style={[styles.outer, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.inner,
          styles.phoneChrome,
          { maxWidth: mode === "tablet" ? TABLET_MAX_WIDTH : CONTENT_MAX_WIDTH },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    height: "100%",
    minHeight: "100%",
  },
  inner: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.paper,
  },
  phoneChrome: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 17, 16, 0.12)",
    borderRadius: 16,
    ...shadow({ opacity: 0.08, radius: 16, offsetY: 8, elevation: 4 }),
    marginTop: 16,
    marginBottom: 8,
    maxHeight: "100%",
    flex: 1,
  },
})
