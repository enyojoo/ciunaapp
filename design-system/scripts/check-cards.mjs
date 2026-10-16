#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../components")
const required = ["## Purpose", "## Anatomy", "## States", "## Rules", "## Upgrade"]
let bad = 0
for (const name of fs.readdirSync(dir)) {
  const readme = path.join(dir, name, "README.md")
  if (!fs.statSync(path.join(dir, name)).isDirectory()) continue
  if (!fs.existsSync(readme)) { console.error(`${name}: missing README.md`); bad++; continue }
  const s = fs.readFileSync(readme, "utf8")
  for (const h of required) if (!s.includes(h)) { console.error(`${name}: missing "${h}"`); bad++ }
  if (/text-white[^\n]*bg-primary|bg-primary[^\n]*text-white/.test(s)) { console.error(`${name}: white text on orange`); bad++ }
}
if (bad) process.exit(1)
console.log("component specs ok")
