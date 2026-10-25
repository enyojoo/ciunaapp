#!/usr/bin/env node
// Screen-reader labels in the customer app: a pressable whose content has no text (an icon button) must carry an
// accessibilityLabel, or its parent component must pass one. Heuristic, so it only looks at Pressable, PressableScale
// and TouchableOpacity written inline. Fails on a missing label.
import fs from "node:fs"
import path from "node:path"

const bad = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { walk(p); continue }
    if (!p.endsWith(".tsx")) continue
    const s = fs.readFileSync(p, "utf8")
    for (const m of s.matchAll(/<(Pressable|PressableScale|TouchableOpacity)\b((?:=>|[^>])*?)>([\s\S]*?)<\/\1>/g)) {
      const props = m[2]
      const body = m[3]
      if (/accessibilityLabel|aria-label|\{\.\.\./.test(props)) continue
      if (/<Text\b|<AppText\b|\{t\(|<Amount\b|\{[a-zA-Z.]*(label|title|name|text)[a-zA-Z]*\}/i.test(body)) continue
      bad.push(`${p}:${s.slice(0, m.index).split("\n").length}`)
    }
  }
}
for (const d of ["mobile/app", "mobile/components"]) walk(d)
bad.forEach((b) => console.error(`icon-only pressable without a label: ${b}`))
console.log(bad.length ? `${bad.length} unlabeled icon button(s)` : "all icon-only pressables are labelled")
process.exit(bad.length ? 1 : 0)
