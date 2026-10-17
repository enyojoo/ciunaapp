import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

const enabled = Platform.OS === "ios" || Platform.OS === "android"

function run(fn: () => Promise<void>): void {
  if (!enabled) return
  fn().catch(() => {})
}

/** Tactile feedback. Light on add and press, selection on chips and steppers, success on pay and send, warning on errors. */
export const haptic = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
