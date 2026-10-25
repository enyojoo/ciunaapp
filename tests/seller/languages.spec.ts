import { test, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

// Every Seller screen in every language: no horizontal overflow, no raw translation key showing, no console errors.
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
const LANGS = ["ru", "fr", "es", "pt", "zh"]
// A dotted key such as expert.cred.title shown as text means a string is missing from that language.
const RAW_KEY = /(^|\s)[a-z]+(\.[a-zA-Z]+){2,}(\s|$)/

for (const lang of LANGS) {
  test.describe(`language ${lang}`, () => {
    for (const route of routes) {
      test(`${route}`, async ({ page }, info) => {
        test.skip(info.project.name.endsWith("768"), "phone and desktop widths only")
        const errors: string[] = []
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
        page.on("pageerror", (e) => errors.push(String(e)))
        await page.addInitScript((l) => { try { localStorage.setItem("ciuna.seller.locale", l) } catch {} }, lang)
        await page.goto(`${route}${route.includes("?") ? "&" : "?"}as=expert`, { waitUntil: "domcontentloaded", timeout: 90_000 })
        await page.waitForLoadState("networkidle")
        await page.locator("main").first().waitFor()
        expect(await page.evaluate(() => document.documentElement.lang)).toBeTruthy()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0)
        const text = (await page.locator("main").first().innerText()).split("\n")
        expect(text.filter((l) => RAW_KEY.test(l)), "raw translation keys").toEqual([])
        expect(errors, "console errors").toEqual([])
      })
    }
  })
}
