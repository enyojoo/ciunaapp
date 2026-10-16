// Scans components/*/preview.html for `<!-- @dsCard group="" height= width= subtitle="" [page] -->` and writes cards.json for the viewer.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dir = path.join(root, "components")
const ORDER = ["Foundations", "Actions", "Forms", "Feedback", "Data display", "Navigation", "Marketplace", "Money", "Customer app · Screens", "Seller · Screens", "Office · Screens", "Documents and email"]
const cards = []
for (const name of fs.readdirSync(dir).sort()) {
  const f = path.join(dir, name, "preview.html")
  if (!fs.existsSync(f)) continue
  const head = fs.readFileSync(f, "utf8").split("\n", 1)[0]
  const m = head.match(/<!--\s*@dsCard\s+([\s\S]*?)-->/)
  if (!m) { console.warn(`${name}: no @dsCard header`); continue }
  const attr = (k) => (m[1].match(new RegExp(`${k}="([^"]*)"`)) || m[1].match(new RegExp(`${k}=(\\S+)`)) || [])[1]
  cards.push({
    name,
    group: attr("group") || "Other",
    subtitle: attr("subtitle") || "",
    height: Number(attr("height")) || 400,
    width: attr("width") ? Number(attr("width")) : null,
    page: /\bpage\b/.test(m[1].replace(/subtitle="[^"]*"/, "")),
    readme: fs.existsSync(path.join(dir, name, "README.md")),
  })
}
cards.sort((a, b) => (ORDER.indexOf(a.group) - ORDER.indexOf(b.group)) || a.name.localeCompare(b.name))
const unknown = [...new Set(cards.map((c) => c.group).filter((g) => !ORDER.includes(g)))]
if (unknown.length) console.warn("unknown groups:", unknown.join(", "))
fs.writeFileSync(path.join(root, "cards.json"), JSON.stringify({ groups: ORDER, cards }, null, 1) + "\n")
console.log(`cards: ${cards.length}`)
