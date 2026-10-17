import { type ReactNode } from "react"
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated"
import { haptic } from "@/lib/haptics"
import { motion } from "@/lib/theme"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 }

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  /** Scale while held. Default `motion.pressScale`. Pass 1 to disable the scale. */
  scaleTo?: number
  /** Fire a light haptic on press. Default off; buttons turn it on. */
  haptics?: boolean
}

/**
 * Pressable that settles to a smaller scale while held. Respects reduced motion (no scale, opacity only).
 * Use it for cards, tiles and rows; buttons use it through `Button`.
 */
export function PressableScale({ children, style, scaleTo = motion.pressScale, haptics, onPressIn, onPressOut, onPress, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1)
  const pressed = useSharedValue(0)
  const reduced = useReducedMotion()
  // Opacity is only animated under reduced motion, so a caller's own `opacity` (disabled state) is never overridden.
  const animated = useAnimatedStyle(() => (reduced ? { opacity: 1 - pressed.value * 0.15 } : { transform: [{ scale: scale.value }] }))
  return (
    <AnimatedPressable
      {...rest}
      onPress={(e) => {
        if (haptics) haptic.light()
        onPress?.(e)
      }}
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(scaleTo, SPRING)
        pressed.value = 1
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, SPRING)
        pressed.value = 0
        onPressOut?.(e)
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  )
}
