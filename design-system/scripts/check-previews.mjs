#!/usr/bin/env node
// Static checks for preview cards: header, README, icons exist, classes are defined, no stray hex colours, no emoji.
//   node design-system/scripts/check-previews.mjs [CardName ...]
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dir = path.join(root, "components")
const only = process.argv.slice(2)
const css = fs.readFileSync(path.join(dir, "bundle.css"), "utf8")
const icons = Function("window", fs.readFileSync(path.join(dir, "icons.js"), "utf8") + "; return window.CZ_ICONS")({})
const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))
const tokenNames = new Set([...fs.readFileSync(path.join(dir, "tokens.css"), "utf8").matchAll(/--([\w-]+):/g)].map((m) => m[1]))
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
const ALLOWED_HEX = new Set(["#fff", "#ffffff", "#000", "#000000"])
let bad = 0, checked = 0
const fail = (n, m) => { console.error(`${n}: ${m}`); bad++ }
for (const name of fs.readdirSync(dir).sort()) {
  const f = path.join(dir, name, "preview.html")
  if (!fs.existsSync(f) || (only.length && !only.includes(name))) continue
  checked++
  const html = fs.readFileSync(f, "utf8")
  if (!/^<!--\s*@dsCard\b[\s\S]*?-->/.test(html)) fail(name, "first line must be the @dsCard header")
  if (!/group="/.test(html.split("\n", 1)[0])) fail(name, "header needs group=")
  if (!fs.existsSync(path.join(dir, name, "README.md"))) fail(name, "missing README.md")
  if (!html.includes('href="../bundle.css"')) fail(name, "must link ../bundle.css")
  for (const m of html.matchAll(/data-i="([^"']+)"/g)) if (!icons[m[1]]) fail(name, `unknown icon "${m[1]}"`)
  const localCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n")
  const localDefined = new Set([...localCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))
  const unknown = new Set()
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c && !c.includes("'") && !defined.has(c) && !localDefined.has(c) && !/^(is-|ph-|on$|off$)/.test(c)) unknown.add(c)
  if (unknown.size) fail(name, `classes not defined in bundle.css or the card's <style>: ${[...unknown].slice(0, 12).join(", ")}`)
  for (const m of html.matchAll(/var\(--([\w-]+)/g)) if (!tokenNames.has(m[1]) && !/^(s|ph-bg)$/.test(m[1]) && !localCss.includes(`--${m[1]}:`) && !html.includes(`--${m[1]}:`)) fail(name, `unknown token var(--${m[1]})`)
  const hexes = [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase()).filter((h) => !ALLOWED_HEX.has(h))
  // hex is allowed only for the Colour card (documents the palette) and inside SVG/data URIs
  if (hexes.length && name !== "Colour" && name !== "Contrast") fail(name, `hardcoded colours (use var(--token)): ${[...new Set(hexes)].slice(0, 6).join(", ")}`)
  if (emoji.test(html)) fail(name, "emoji in a product UI card")
  if (/<!--\s*@dsCard[^>]*-->/.test(html) && !/subtitle="/.test(html.split("\n", 1)[0])) fail(name, "header needs subtitle=")
}
console.log(`checked ${checked} previews, ${bad} problem(s)`)
process.exit(bad ? 1 : 0)
