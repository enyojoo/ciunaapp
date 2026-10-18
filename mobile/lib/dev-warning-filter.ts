/**
 * Dev only. `react-native-css-interop` (inside NativeWind 4) reads React Native's deprecated `ImageBackground` while it
 * loads, which prints "ImageBackground is deprecated" in the console and in LogBox. This app never uses `ImageBackground`
 * and the warning cannot be acted on until NativeWind drops it, so this drops that one message and nothing else.
 *
 * It has to run before NativeWind loads, so `index.js` imports it first. Remove it once NativeWind stops triggering it.
 */
declare const __DEV__: boolean

const SILENCED = ["ImageBackground is deprecated"]

if (__DEV__) {
  const warn = console.warn
  console.warn = (...args: unknown[]) => {
    const first = args[0]
    if (typeof first === "string" && SILENCED.some((s) => first.includes(s))) return
    warn(...args)
  }
}

export {}
