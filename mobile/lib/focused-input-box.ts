import { useCallback, useState } from "react"
import { Platform, type ViewStyle } from "react-native"
import { colors } from "@/lib/theme"

const FOCUS_RING =
  Platform.OS === "web" ? ("0 0 0 3px rgba(249, 115, 22, 0.2)" as const) : undefined

/** Border + soft ring on the input container (web); primary border on native. */
export function inputBoxFocusStyle(focused: boolean): ViewStyle {
  if (!focused) return {}
  if (Platform.OS === "web") {
    return {
      borderColor: colors.primary,
      boxShadow: FOCUS_RING,
    } as ViewStyle
  }
  return { borderColor: colors.primary }
}

export function useInputFocusRing() {
  const [focused, setFocused] = useState(false)
  const onFocus = useCallback(() => setFocused(true), [])
  const onBlur = useCallback(() => setFocused(false), [])
  const boxStyle = inputBoxFocusStyle(focused)
  return { focused, onFocus, onBlur, boxStyle }
}
