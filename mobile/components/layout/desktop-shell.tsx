import type { ReactNode } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { DesktopHeader } from "@/components/layout/desktop-header"
import { DesktopNav } from "@/components/layout/desktop-nav"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { CONTENT_MAX_WIDTH_DESKTOP } from "@/lib/layout-metrics"
import { colors } from "@/lib/theme"

export function DesktopShell({ children }: { children: ReactNode }) {
  const { contentMaxWidth } = useResponsiveLayout()

  return (
    <View style={styles.root}>
      <DesktopNav />
      <View style={styles.contentColumn}>
        <DesktopHeader />
        <View style={styles.main}>
          <View style={[styles.mainInner, { maxWidth: Math.min(contentMaxWidth, CONTENT_MAX_WIDTH_DESKTOP) }]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    height: Platform.OS === "web" ? "100%" : undefined,
    minHeight: "100%",
    backgroundColor: colors.paper,
  },
  contentColumn: { flex: 1, minWidth: 0, minHeight: 0 },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  mainInner: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    minWidth: 0,
  },
})
