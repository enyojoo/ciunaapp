#!/usr/bin/env node
// Writes docs/build-plan/strings-to-review.md: every translated string written by agents (not yet reviewed by a
// native speaker), with file, key, and the English source. Re-run after edits; the list is the review checklist.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sources = [
  { dir: "seller/locales", langs: ["ru", "fr", "es", "zh", "pt"], ext: "json", note: "Seller portal" },
  { dir: "packages/shared/src/locales", langs: ["zh", "pt"], ext: "json", note: "Customer app (web and Expo)" },
  { dir: "api/locales", langs: ["zh", "pt"], ext: "json", note: "Customer email templates" },
]
const flat = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out)
    else out[key] = String(v)
  }
  return out
}
const lines = [
  "# Strings to review (V4)",
  "",
  "Agent-written translations. Each file below is the single source for its strings: edit the JSON to change a string, no code change needed. After edits run `npm run locales:check` (must print `locales ok`).",
  "",
  "Regenerate with `node scripts/list-strings-to-review.mjs`.",
  "",
]
let total = 0
for (const src of sources) {
  const en = path.join(root, src.dir, "en")
  const enFiles = fs.existsSync(en) ? fs.readdirSync(en).filter((f) => f.endsWith(".json")) : [`emails.json`]
  lines.push(`## ${src.note}`, "")
  for (const lang of src.langs) {
    const base = fs.existsSync(path.join(root, src.dir, lang)) ? path.join(root, src.dir, lang) : path.join(root, src.dir)
    const files = fs.existsSync(path.join(root, src.dir, lang))
      ? fs.readdirSync(base).filter((f) => f.endsWith(".json"))
      : [`${lang}/emails.json`].filter((f) => fs.existsSync(path.join(root, src.dir, f)))
    for (const f of files) {
      const rel = fs.existsSync(path.join(root, src.dir, lang)) ? path.join(src.dir, lang, f) : path.join(src.dir, f)
      const enRel = fs.existsSync(path.join(root, src.dir, lang)) ? path.join(root, src.dir, "en", f) : path.join(root, src.dir, "en", "emails.json")
      if (!fs.existsSync(enRel)) continue
      const text = flat(JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")))
      const eng = flat(JSON.parse(fs.readFileSync(enRel, "utf8")))
      const keys = Object.keys(text).filter((k) => text[k] && text[k] !== "{}")
      if (!keys.length) continue
      lines.push(`### \`${rel}\` (${keys.length} strings)`, "", "| Key | Text | English source |", "| --- | --- | --- |")
      for (const k of keys) {
        const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")
        lines.push(`| \`${k}\` | ${cell(text[k])} | ${cell(eng[k])} |`)
        total++
      }
      lines.push("")
    }
  }
}
lines.splice(5, 0, `Total strings: ${total}.`, "")
fs.mkdirSync(path.join(root, "docs/build-plan"), { recursive: true })
fs.writeFileSync(path.join(root, "docs/build-plan/strings-to-review.md"), lines.join("\n") + "\n")
console.log(`strings to review: ${total}`)
