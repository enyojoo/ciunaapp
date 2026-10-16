import { test, expect, type Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

// Routes are discovered from seller/app/(shell); dynamic segments get a sample id (mock API returns canned data).
const shell = path.resolve(__dirname, "../../seller/app/(shell)")
function walk(dir: string, rel = ""): string[] {
  const out: string[] = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), `${rel}/${e.name}`))
    else if (e.name === "page.tsx") out.push(rel || "/")
  }
  return out
}
const routes = walk(shell).map((r) => r.replace(/\[[^\]]+\]/g, "o1")).sort()

async function open(page: Page, url: string, as: "store" | "expert") {
  const errors: string[] = []
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto(`${url}${url.includes("?") ? "&" : "?"}as=${as}`, { waitUntil: "domcontentloaded", timeout: 90_000 })
  await page.waitForLoadState("networkidle")
  await page.locator("main").first().waitFor()
  return errors
}

for (const as of ["store", "expert"] as const) {
  test.describe(`${as} owner`, () => {
    for (const route of routes) {
      test(`${route} renders cleanly`, async ({ page }) => {
        const errors = await open(page, route, as)
        await expect(page.locator("main")).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0)
        expect(errors, "console errors").toEqual([])
      })
    }

    test("navigation", async ({ page }, info) => {
      await open(page, "/", as)
      const width = info.project.use.viewport!.width
      const bottom = page.locator('nav[aria-label="Main"]:visible')
      if (width < 768) {
        const items = bottom.locator("a")
        await expect(items).toHaveCount(5)
        await expect(items.last()).toHaveAttribute("href", "/more")
        await items.last().click()
        await expect(page).toHaveURL(/\/more/, { timeout: 60_000 })
        await expect(page.locator('main a[href="/earnings"]')).toBeVisible()
        await expect(page.locator('main a[href="/reviews"]')).toBeVisible()
      } else {
        // sidebar from md: all items plus More
        await expect(page.locator("aside")).toBeVisible()
        const links = page.locator('aside nav[aria-label="Main"] a')
        expect(await links.count()).toBeGreaterThanOrEqual(5)
        await expect(page.locator('aside nav a[href="/earnings"]')).toBeVisible()
        await expect(page.locator('aside nav a[href="/reviews"]')).toBeVisible()
        await expect(page.locator('aside nav a[href="/more"]')).toBeVisible()
        // the phone bottom bar is hidden
        await expect(page.locator('nav[aria-label="Main"]:visible')).toHaveCount(1)
      }
    })
  })
}
