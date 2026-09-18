import { type ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ViewStyle } from "react-native"
import { SafeAreaView, type Edge } from "react-native-safe-area-context"
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
  const inner = (
    <SafeAreaView style={[styles.screen, padded && styles.padded, style]} edges={edges}>
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
}: {
  children: ReactNode
  keyboard?: boolean
  contentStyle?: ViewStyle
}) {
  return (
    <Screen keyboard={keyboard}>
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
