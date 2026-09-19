import { type ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ViewStyle } from "react-native"
import { SafeAreaView, type Edge } from "react-native-safe-area-context"
import { useOptionalResponsiveLayout } from "@/lib/responsive-layout"
import { colors } from "@/lib/theme"

export function Screen({
  children,
  edges = ["top", "left", "right"],
  keyboard = false,
  padded = false,
  style,
}: {
  children: ReactNode
  edges?: Edge[]
  keyboard?: boolean
  padded?: boolean
  style?: ViewStyle
}) {
  const layout = useOptionalResponsiveLayout()
  const resolvedEdges = layout?.showSidebarShell
    ? edges.filter((edge) => edge !== "top" && edge !== "bottom")
    : edges
  const inner = (
    <SafeAreaView style={[styles.screen, padded && styles.padded, style]} edges={resolvedEdges}>
      {children}
    </SafeAreaView>
  )
  if (!keyboard) return inner
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {inner}
    </KeyboardAvoidingView>
  )
}

export function ScreenScroll({
  children,
  keyboard = false,
  contentStyle,
  /** Pass `["left", "right"]` on a screen rendered under a native header (`headerShown: true`) — the header already owns the top safe area, so the default `"top"` edge would double it up. */
  edges,
}: {
  children: ReactNode
  keyboard?: boolean
  contentStyle?: ViewStyle
  edges?: Edge[]
}) {
  return (
    <Screen keyboard={keyboard} edges={edges}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  padded: { paddingHorizontal: 24 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
})
