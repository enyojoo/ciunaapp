/**
 * Dev only. Drops two console messages that cannot be acted on, and nothing else:
 *
 * - "ImageBackground is deprecated": `react-native-css-interop` (inside NativeWind 4) reads React Native's deprecated
 *   `ImageBackground` while it loads. This app never uses it. Remove the entry once NativeWind stops triggering it.
 * - "[expo-notifications] Error reading persisted server registration info": an iOS simulator build that is not signed
 *   with the app's entitlements has no Keychain access, so expo-notifications logs this as a red full-screen error on every
 *   launch. Signed builds on a device have the entitlement and do not log it.
 *
 * It has to run before NativeWind and expo-notifications load, so `index.js` imports it first.
 */
declare const __DEV__: boolean

const SILENCED = [
  "ImageBackground is deprecated",
  "[expo-notifications] Error reading persisted server registration info",
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
