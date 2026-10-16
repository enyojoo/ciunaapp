#!/usr/bin/env node
// Renders every card in cards.json at its header width/height and fails on: horizontal overflow, document taller than
// header height + 4, console errors, failed image/font/other requests. Screenshots go to design-system/.audit/ (gitignored).
// Needs: npx playwright install chromium
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const out = path.join(root, ".audit")
const DEFAULT_WIDTH = 1250
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".ico": "image/x-icon", ".md": "text/markdown" }

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname))
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found") }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p).toLowerCase()] || "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
const { cards } = JSON.parse(fs.readFileSync(path.join(root, "cards.json"), "utf8"))
const only = process.argv.slice(2)
const list = only.length ? cards.filter((c) => only.includes(c.name)) : cards

let browser
try { browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined }) } catch (e) {
  console.error("Could not start Chromium. Run: npx playwright install chromium\n" + e.message)
  server.close(); process.exit(2)
}
const failures = []
for (const card of list) {
  const width = card.width || DEFAULT_WIDTH
  const height = card.height
  const problems = []
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text().slice(0, 120)}`) })
  page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 120)}`))
  page.on("requestfailed", (r) => problems.push(`request failed: ${r.url().replace(base, "")}`))
  page.on("response", (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url().replace(base, "")}`) })
  try {
    await page.goto(`${base}/components/${card.name}/preview.html`, { waitUntil: "load" })
    await page.evaluate(() => document.fonts && document.fonts.ready)
    await page.waitForTimeout(100)
    const m = await page.evaluate(() => {
      const d = document.documentElement
      const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src"))
      return { sw: d.scrollWidth, cw: d.clientWidth, sh: Math.max(d.scrollHeight, document.body.scrollHeight), broken }
    })
    if (m.sw > m.cw) problems.push(`overflow-x: content ${m.sw}px > width ${m.cw}px`)
    if (m.sh > height + 4) problems.push(`too tall: document ${m.sh}px > height ${height}px (+4)`)
    for (const b of m.broken) problems.push(`broken image: ${b}`)
    await page.screenshot({ path: path.join(out, `${card.name}.png`), fullPage: true })
    card._measured = { width, height, docHeight: m.sh, docWidth: m.sw }
  } catch (e) { problems.push(`load: ${e.message.split("\n")[0]}`) }
  await ctx.close()
  const uniq = [...new Set(problems)]
  if (uniq.length) failures.push({ name: card.name, width, height, doc: card._measured ? `${card._measured.docWidth}x${card._measured.docHeight}` : "-", problems: uniq })
}
await browser.close()
server.close()

console.log(`audited ${list.length} cards, screenshots in design-system/.audit/`)
if (failures.length) {
  console.log(`\n${failures.length} failing:`)
  console.table(failures.map((f) => ({ card: f.name, header: `${f.width}x${f.height}`, document: f.doc, problems: f.problems.slice(0, 3).join(" | ") + (f.problems.length > 3 ? ` (+${f.problems.length - 3})` : "") })))
  fs.writeFileSync(path.join(out, "failures.json"), JSON.stringify(failures, null, 1))
  process.exit(1)
}
console.log("design audit ok")
