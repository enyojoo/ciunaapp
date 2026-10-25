/**
 * Dev only. Drops three console messages that cannot be acted on, and nothing else:
 *
 * - "ImageBackground is deprecated": `react-native-css-interop` (inside NativeWind 4) reads React Native's deprecated
 *   `ImageBackground` while it loads. This app never uses it. Remove the entry once NativeWind stops triggering it.
 * - "[expo-notifications] Error reading persisted server registration info": an iOS simulator build that is not signed
 *   with the app's entitlements has no Keychain access, so expo-notifications logs this as a red full-screen error on every
 *   launch. Signed builds on a device have the entitlement and do not log it.
 *
 * - "Sending `onAnimatedValueUpdate` with no listeners registered": React Native warns when a native-driven Animated
 *   value changes while nothing listens on the JS side. The animations here (sheets, skeletons, press scale) are driven
 *   natively on purpose and need no JS listener, so the warning is noise.
 *
 * It has to run before NativeWind and expo-notifications load, so `index.js` imports it first.
 */
declare const __DEV__: boolean

const SILENCED = [
  "ImageBackground is deprecated",
  "[expo-notifications] Error reading persisted server registration info",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
]

const silenced = (args: unknown[]) => typeof args[0] === "string" && SILENCED.some((s) => (args[0] as string).includes(s))

if (__DEV__) {
  const warn = console.warn
  const error = console.error
  console.warn = (...args: unknown[]) => {
    if (!silenced(args)) warn(...args)
  }
  console.error = (...args: unknown[]) => {
    if (!silenced(args)) error(...args)
  }
}

export {}
