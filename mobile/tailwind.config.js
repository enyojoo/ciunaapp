/** @type {import('tailwindcss').Config} */
const tokens = require("../packages/shared/src/design/tokens.generated.json").color

module.exports = {
  // NativeWind web reads this as `--css-interop-darkMode`. Default `media` throws
  // when the runtime syncs html class → colorScheme.
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: tokens["brand-primary"],
        "on-primary": tokens["primary-foreground"],
        "primary-hover": tokens["primary-hover"],
        "primary-text": tokens["primary-text"],
        "primary-deep": tokens["primary-text"],
        "primary-tint": tokens["primary-tint"],
        paper: tokens.paper,
        surface: tokens.surface,
        ink: tokens.ink,
        muted: tokens.muted,
        border: tokens.hairline,
        success: tokens.success,
        warning: tokens.warning,
        danger: tokens.destructive,
        refer: tokens.refer,
      },
    },
  },
  plugins: [],
}
