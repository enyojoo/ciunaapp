/**
 * Expo config plugin: wire YooKassa CocoaPods source + Android Maven repo for react-native-yookassa.
 * Runs at `expo prebuild` / EAS Build — no effect in Expo Go.
 */

const {
  withDangerousMod,
  withPodfile,
  createRunOncePlugin,
} = require("@expo/config-plugins")
const fs = require("fs")
const path = require("path")

const YOO_POD_SOURCE = "https://git.yoomoney.ru/scm/sdk/cocoa-pod-specs.git"
// CocoaPods CDN: a Podfile that lists any `source` stops using the default, and the old `Specs.git` source made
// `pod install` clone the whole multi-gigabyte spec repo from GitHub.
const COCOAPODS_CDN = "https://cdn.cocoapods.org/"

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

function withYooKassaIos(config) {
  return withPodfile(config, (cfg) => {
    cfg.modResults.contents = ensurePodSources(cfg.modResults.contents)
    return cfg
  })
}

function withYooKassaAndroid(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const rootBuild = path.join(cfg.modRequest.platformProjectRoot, "build.gradle")
      if (fs.existsSync(rootBuild)) {
        let contents = fs.readFileSync(rootBuild, "utf8")
        if (!contents.includes("nexus.yoomoney.ru") && !contents.includes("yoomoney")) {
          contents = contents.replace(
            /allprojects\s*\{\s*repositories\s*\{/,
            `allprojects {
    repositories {
        maven { url "https://nexus.yoomoney.ru/repository/maven-releases/" }`,
          )
          fs.writeFileSync(rootBuild, contents)
        }
      }
      return cfg
    },
  ])
}

function withYooKassa(config) {
  config = withYooKassaIos(config)
  config = withYooKassaAndroid(config)
  return config
}

module.exports = createRunOncePlugin(withYooKassa, "with-yookassa", "1.0.0")
