import { useEffect, useRef } from "react"
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, radius, type as typeSize } from "@/lib/theme"

const USE_NATIVE_DRIVER = Platform.OS !== "web"

export type ToastType = "success" | "error" | "info" | "warning"

export function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
  action,
}: {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
  action?: { label: string; onPress: () => void }
}) {
  const insets = useSafeAreaInsets()
  const slide = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start()
    const timer = setTimeout(dismiss, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per toast instance
  }, [])

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -100, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start(() => onClose())
  }

  // Ink toast: light icon and text on a dark plate, so it reads on any screen and never competes with the orange action.
  const accent =
    type === "success" ? colors.successBorder : type === "error" ? colors.dangerBorder : type === "warning" ? colors.warningBorder : colors.primaryBorder
  const TypeIcon = type === "success" ? CircleCheck : type === "error" ? CircleX : type === "warning" ? TriangleAlert : Info

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: insets.top + TOAST_TOP_OFFSET, transform: [{ translateY: slide }], opacity },
      ]}
    >
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <TypeIcon size={20} color={accent} strokeWidth={2} />
        <Text style={styles.message}>{message}</Text>
        {action ? (
          <Pressable
            onPress={() => {
              action.onPress()
              dismiss()
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={8}
          >
            <View style={styles.actionHit}>
              <Text style={styles.action}>{action.label}</Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <View style={styles.closeHit}>
            <X size={18} color={colors.subtle} strokeWidth={2} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  )
}

/** Clears the 56pt navigation header so toasts never cover the back button. */
const TOAST_TOP_OFFSET = 56 + 8

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.text,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    boxShadow: "0 8px 16px rgba(17, 24, 39, 0.12)",
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: typeSize.body,
    lineHeight: 22,
    color: colors.surface,
  },
  actionHit: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 44, justifyContent: "center" },
  action: { fontSize: typeSize.meta, fontWeight: "700", color: colors.surface, textDecorationLine: "underline" },
  closeHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
})
