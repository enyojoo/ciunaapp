/**
 * Expo config plugin: wire YooKassa CocoaPods source for react-native-yookassa.
 * Runs at `expo prebuild` / EAS Build — no effect in Expo Go.
 *
 * Android: react-native-yookassa 3.7+ resolves
 * `ru.yoomoney.sdk.kassa.payments:yookassa-android-sdk` from Maven Central.
 * The old `nexus.yoomoney.ru` host is NXDOMAIN (retired); do not inject it.
 */

const {
  withPodfile,
  createRunOncePlugin,
} = require("@expo/config-plugins")

const YOO_POD_SOURCE = "https://git.yoomoney.ru/scm/sdk/cocoa-pod-specs.git"
// CocoaPods CDN: a Podfile that lists any `source` stops using the default, and the old `Specs.git` source made
// `pod install` clone the whole multi-gigabyte spec repo from GitHub.
const COCOAPODS_CDN = "https://cdn.cocoapods.org/"
// react-native-yookassa 3.7.x targets iOS SDK 11.0.1 (see its README). Unpinned
// `s.dependency "YooKassaPayments"` resolves 12.x, which replaced
// TokenizationModuleInput/Output with YooKassaDelegate and breaks the bridge.
const YOO_PAYMENTS_POD_VERSION = "11.0.1"
const YOO_PAYMENTS_POD_LINE = `pod 'YooKassaPayments', '${YOO_PAYMENTS_POD_VERSION}'`

function ensurePodSources(podfileContents) {
  let next = podfileContents
  if (!next.includes(YOO_POD_SOURCE)) {
    next = `source '${COCOAPODS_CDN}'\nsource '${YOO_POD_SOURCE}'\n${next}`
  }
  if (!/use_frameworks!/.test(next)) {
    next = next.replace(
      /(platform\s+:ios[^\n]*\n)/,
      `$1\nuse_frameworks!\n`,
    )
  }
  return next
}

function ensureYooKassaPaymentsPin(podfileContents) {
  if (podfileContents.includes(`pod 'YooKassaPayments'`)) {
    return podfileContents.replace(
      /pod\s+'YooKassaPayments'[^\n]*/,
      YOO_PAYMENTS_POD_LINE,
    )
  }
  // Prefer anchoring after use_native_modules! inside the app target.
  if (/config\s*=\s*use_native_modules!/.test(podfileContents)) {
    return podfileContents.replace(
      /(config\s*=\s*use_native_modules![^\n]*\n)/,
      `$1\n  ${YOO_PAYMENTS_POD_LINE}\n`,
    )
  }
  return podfileContents.replace(
    /(target\s+'[^']+'\s+do\n)/,
    `$1  ${YOO_PAYMENTS_POD_LINE}\n`,
  )
}

function withYooKassaIos(config) {
  return withPodfile(config, (cfg) => {
    let contents = ensurePodSources(cfg.modResults.contents)
    contents = ensureYooKassaPaymentsPin(contents)
    cfg.modResults.contents = contents
    return cfg
  })
}

function withYooKassa(config) {
  return withYooKassaIos(config)
}

module.exports = createRunOncePlugin(withYooKassa, "with-yookassa", "1.0.0")
