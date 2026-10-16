import { defineConfig } from "@playwright/test"

// One-time setup on a new machine or CI runner: `npx playwright install chromium`
// Seller runs in mock mode (seller/public/dev-mock.js): no backend needed. `?as=store|expert` picks the merchant type.
const SELLER_PORT = 3003
// Offline or slow network: point PW_CHROMIUM_PATH at any Chromium binary instead of downloading the pinned one.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined
const widths = [375, 768, 1280] as const

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  timeout: 120_000,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${SELLER_PORT}`,
    trace: "off",
  },
  projects: widths.map((w) => ({
    name: `seller-${w}`,
    testDir: "./tests/seller",
    use: { browserName: "chromium" as const, launchOptions: { executablePath }, viewport: { width: w, height: w === 375 ? 812 : w === 768 ? 1024 : 800 }, baseURL: `http://localhost:${SELLER_PORT}` },
  })),
  webServer: [
    {
      // seller in mock mode
      command: "npm run dev -w seller",
      url: `http://localhost:${SELLER_PORT}/login`,
      env: { NEXT_PUBLIC_SELLER_MOCK: "1" },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
})
