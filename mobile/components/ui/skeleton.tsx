import { useEffect, useState } from "react"
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { colors } from "@/lib/theme"

/**
 * Loading placeholder with a soft shimmer. Use it for a true first load with no cached data; never over cached
 * content. Shapes mirror the content that will replace them (a line, a card, a circle).
 */
export function Skeleton({
  width = "100%",
  height = 16,
  rounded = 8,
  style,
}: {
  width?: DimensionValue
  height?: number
  /** Corner radius; pass `radius.card` for cards or a large number for a circle. */
  rounded?: number
  style?: StyleProp<ViewStyle>
}) {
  const [w, setW] = useState(0)
  const reduced = useReducedMotion()
  const x = useSharedValue(0)

  useEffect(() => {
    if (reduced || w === 0) return
    x.value = 0
    x.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false)
    return () => cancelAnimation(x)
  }, [reduced, w, x])

  const band = Math.max(80, w * 0.6)
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: -band + x.value * (w + band) }] }))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[styles.track, { width, height, borderRadius: rounded }, style]}
    >
      {reduced ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, { width: band }, sweep]}>
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  )
}

/** A stack of text-line skeletons; the last line is shorter. */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.fill, overflow: "hidden" },
})
