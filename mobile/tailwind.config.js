/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        "primary-hover": "#EA580C",
        "primary-deep": "#C2410C",
        paper: "#FAFAF8",
        surface: "#FFFFFF",
        muted: "#6B7280",
        border: "#E8E4DC",
        success: "#059669",
        danger: "#DC2626",
        refer: "#059669",
      },
    },
  },
  plugins: [],
}
