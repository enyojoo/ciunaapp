import { type ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppText } from "@/components/ui/app-text"
import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { WebAwareModal } from "@/components/web-aware-modal"
import { useWebCenteredModal } from "@/lib/web-centered-modal"
import { colors, radius, space } from "@/lib/theme"

/**
 * Bottom sheet with a grabber, title, close button, scrolling body and an optional pinned footer. `auto` hugs
 * its content up to 75% of the screen; `tall` goes to 92%. Centres as a dialog on wide web screens.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
  size = "auto",
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: "auto" | "tall"
}) {
  const dialog = useWebCenteredModal()
  return (
    <WebAwareModal visible={open} onRequestClose={onClose} sheetStyle={[styles.sheet, size === "tall" && styles.tall]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SafeAreaView edges={dialog ? [] : ["bottom"]}>
          {dialog ? null : <View style={styles.grabber} />}
          {title ? (
            <View style={styles.head}>
              <AppText variant="headline" style={styles.title} numberOfLines={2} accessibilityRole="header">
                {title}
              </AppText>
              <IconButton label="Close" onPress={onClose} size={36}>
                <Icon name="close" size={16} color={colors.text} />
              </IconButton>
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </WebAwareModal>
  )
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  tall: { maxHeight: "92%", height: "92%" },
  grabber: { alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: space.sm },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.sm },
  title: { flex: 1 },
  body: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
})
