// SKIP_YOOKASSA=1 (see app.config.js) stops autolinking react-native-yookassa, whose iOS pods come from YooMoney's own
// spec server. Off by default.
module.exports =
  process.env.SKIP_YOOKASSA === "1"
    ? { dependencies: { "react-native-yookassa": { platforms: { ios: null, android: null } } } }
    : {}
