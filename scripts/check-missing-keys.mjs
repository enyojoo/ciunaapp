#!/usr/bin/env node
// Every static t("key") in the customer app must exist in the English strings (app.json or common.json),
// so no screen depends on an inline English fallback. Plural keys are satisfied by key_one / key_other.
// Dynamic keys (template strings) are skipped.
import fs from "node:fs"
import path from "node:path"

const en = ["app", "common"].map((n) => JSON.parse(fs.readFileSync(`packages/shared/src/locales/en/${n}.json`, "utf8")))
const has = (key) => {
  const k = key.replace(/^(app|common):/, "")
  return en.some((tree) => {
    const get = (kk) => kk.split(".").reduce((o, p) => (o && typeof o === "object" ? o[p] : undefined), tree)
    return get(k) !== undefined || get(k + "_one") !== undefined || get(k + "_other") !== undefined
  })
}
const skip = new Set(["node_modules", "ios", "android", ".expo", "dist"])
const files = []
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (skip.has(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(e.name) && files.push(p) } }
for (const d of ["mobile/app", "mobile/components", "mobile/lib"]) walk(d)

const missing = new Map()
for (const f of files) {
  const src = fs.readFileSync(f, "utf8")
  for (const m of src.matchAll(/\bt\(\s*["']([A-Za-z0-9_.:-]+)["']/g)) {
    const key = m[1]
    if (!key.includes(".") && !key.includes(":")) continue
    if (!has(key)) missing.set(key, (missing.get(key) || new Set()).add(f))
  }
}
for (const [k, fs_] of [...missing].sort()) console.error(`missing en string: ${k}  (${[...fs_][0]})`)
console.log(missing.size ? `${missing.size} key(s) missing from the English strings` : "all translation keys exist")
process.exit(missing.size ? 1 : 0)
