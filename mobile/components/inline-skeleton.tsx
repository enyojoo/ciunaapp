import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const SHIMMER_BAND = 96

/** Inline placeholder for short text (amounts, labels). Warm tones match quote `paper` surfaces. */
export function InlineSkeleton({
  width = 88,
  height = 16,
  style,
}: {
  width?: number
  height?: number
  style?: ViewStyle
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [progress])

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_BAND, width + SHIMMER_BAND * 0.35],
  })

  return (
    <View style={[styles.track, { width, height }, style]}>
      <Animated.View style={[styles.shimmer, { width: SHIMMER_BAND, height, transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#E5E1D8",
    flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DDD8CE",
  },
  shimmer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
})
