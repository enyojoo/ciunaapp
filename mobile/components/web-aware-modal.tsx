import type { ReactNode } from "react"
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { useWebCenteredModal, webCenteredModalStyles } from "@/lib/web-centered-modal"
import { colors } from "@/lib/theme"

export function WebAwareModal({
  visible,
  onRequestClose,
  children,
  wide,
  sheetStyle,
}: {
  visible: boolean
  onRequestClose: () => void
  children: ReactNode
  wide?: boolean
  sheetStyle?: StyleProp<ViewStyle>
}) {
  const centered = useWebCenteredModal()
  if (!visible) return null

  if (centered) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onRequestClose}>
        <View style={webCenteredModalStyles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onRequestClose}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />
          <View style={[webCenteredModalStyles.panel, wide && webCenteredModalStyles.panelWide]}>
            {children}
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, sheetStyle]}>{children}</View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
})
