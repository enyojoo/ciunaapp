#!/usr/bin/env node
// Locale parity: every key in en exists in every other language, placeholders ({x}, {{x}}, %s) match, no empty strings.
import fs from "node:fs"
import path from "node:path"
const flat = (o, p = "", out = {}) => { for (const [k, v] of Object.entries(o)) typeof v === "object" && v ? flat(v, p + k + ".", out) : (out[p + k] = String(v)); return out }
const ph = (s) => (s.match(/\{\{?\w+\}?\}|%[sd]/g) || []).sort().join(",")
let bad = 0
// Customer app strings, Seller portal strings and the emails the API sends: every language has every key.
for (const root of ["packages/shared/src/locales", "seller/locales", "api/locales"]) {
const dir = path.resolve(root)
const langs = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
for (const file of fs.readdirSync(path.join(dir, "en")).filter((f) => f.endsWith(".json"))) {
  const base = flat(JSON.parse(fs.readFileSync(path.join(dir, "en", file), "utf8")))
  for (const l of langs.filter((x) => x !== "en")) {
    const f = path.join(dir, l, file)
    if (!fs.existsSync(f)) { console.error(`${l}/${file}: missing file`); bad++; continue }
    const t = flat(JSON.parse(fs.readFileSync(f, "utf8")))
    for (const k of Object.keys(base)) {
      if (!(k in t)) { console.error(`${l}/${file}: missing ${k}`); bad++ }
      else if (!t[k].trim()) { console.error(`${l}/${file}: empty ${k}`); bad++ }
      else if (ph(base[k]) !== ph(t[k])) { console.error(`${l}/${file}: placeholder mismatch ${k}`); bad++ }
    }
  }
}
}
console.log(bad ? `${bad} locale problem(s)` : "locales ok")
process.exit(bad ? 1 : 0)
