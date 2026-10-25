import { test, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

// Every Office page is opened as a mock super admin (office/public/dev-mock.js) and must render without console errors.
const app = path.resolve(__dirname, "../../office/app")
function walk(dir: string, rel = ""): string[] {
  const out: string[] = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), `${rel}/${e.name}`))
    else if (e.name === "page.tsx") out.push(rel || "/")
  }
  return out
}
const routes = walk(app)
  .filter((r) => !r.startsWith("/auth"))
  .map((r) => r.replace(/\[[^\]]+\]/g, "sample"))
  .sort()

// Errors that come from the mock itself or from the browser, not from the page.
const IGNORE = [/favicon/i, /Failed to load resource/i, /ERR_NAME_NOT_RESOLVED/i, /ERR_INTERNET_DISCONNECTED/i]

for (const route of routes) {
  test(`${route} renders cleanly`, async ({ page }) => {
    const errors: string[] = []
    page.on("console", (m) => { if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text()) })
    page.on("pageerror", (e) => errors.push(String(e)))
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 90_000 })
    await page.waitForLoadState("networkidle")
    await expect(page.locator("main, [role=main], body").first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(await page.locator("text=Application error").count()).toBe(0)
    expect(errors, errors.join("\n")).toEqual([])
  })
}
