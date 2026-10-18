import { useEffect, useRef, useState, type ReactNode } from "react"
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
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
  // Bottom sheet: the system "slide" animation carries the dark backdrop down with the sheet, which looks abrupt. Run our
  // own: the backdrop fades while the sheet slides, and the Modal stays mounted until the exit has finished.
  const [mounted, setMounted] = useState(visible)
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current
  useEffect(() => {
    if (centered) return
    if (visible) {
      setMounted(true)
      Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    } else {
      Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
  }, [visible, centered, progress])

  if (centered) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
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

  const travel = Dimensions.get("window").height
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.sheetOverlay}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="Close" />
        <Animated.View style={[styles.sheet, sheetStyle, { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] }) }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: { backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    maxHeight: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
})
