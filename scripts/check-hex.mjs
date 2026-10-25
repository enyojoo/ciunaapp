#!/usr/bin/env node
// Customer-app screens take colour from lib/theme (design tokens). Raw hex is allowed only in files that are data or art:
// flag artwork, category palettes, the logo, brand marks, the receipt HTML export and dev screens.
import fs from "node:fs"
import path from "node:path"

const ALLOW = [/nucleo-flags/, /lib\/theme\.ts$/, /hub-category/, /expert-category/, /receipt-html/, /ciuna-logo-svg/, /auth-chrome/, /yookassa/, /app\/dev\//, /\+html/]
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g
const bad = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); continue }
    if (!/\.(tsx?|jsx?)$/.test(e.name) || ALLOW.some((r) => r.test(p))) continue
    fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      if (line.match(HEX) && !/^\s*(\/\/|\*)/.test(line)) bad.push(`${p}:${i + 1}: ${line.trim().slice(0, 100)}`)
    })
  }
}
for (const d of ["mobile/app", "mobile/components", "mobile/lib"]) walk(d)
bad.forEach((b) => console.error(b))
console.log(bad.length ? `${bad.length} raw colour(s) outside the design tokens` : "no raw colours outside the allowlist")
process.exit(bad.length ? 1 : 0)
