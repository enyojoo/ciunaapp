/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json")
const os = require("os")

function pickLanIpv4() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address
    }
  }
  return null
}

/** Expo Go on a phone cannot reach the dev machine via localhost. */
function resolveDevApiUrl() {
  const explicit = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3002").trim().replace(/\/+$/, "")
  if (process.env.EXPO_PUBLIC_DEV_USE_LOCALHOST === "1") return explicit
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(explicit)) {
    const lan = pickLanIpv4()
    if (lan) return `http://${lan}:3002`
  }
  return explicit
}

module.exports = () => {
  const apiUrl = resolveDevApiUrl()
  if (process.env.NODE_ENV !== "production") {
    console.log("[expo] EXPO_PUBLIC_API_URL resolved to", apiUrl)
  }
  return {
    expo: {
      ...appJson.expo,
      extra: {
        ...appJson.expo.extra,
        apiUrl,
      },
    },
  }
}
