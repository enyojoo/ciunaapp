export type ReceiptDoc = {
  brand: string
  number: string
  date: string
  status: string
  /** "neutral" (grey) for a refunded receipt, "ok" (green) otherwise. */
  statusTone?: "ok" | "neutral"
  rows: { label: string; value: string }[]
  itemsTitle?: string
  items: { text: string; amount: string }[]
  totals: { label: string; value: string; strong?: boolean }[]
  footers: string[]
}

/** Escapes text for HTML. Names, addresses and product titles come from users, so nothing is inserted raw. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/** One A4-friendly page for the receipt PDF. Plain HTML and inline CSS, so the print engine on every platform renders it the same. */
export function receiptHtml(d: ReceiptDoc): string {
  const e = escapeHtml
  const rows = d.rows.map((r) => `<div class="row"><div class="k">${e(r.label)}</div><div class="v">${e(r.value)}</div></div>`).join("")
  const items = d.items.length
    ? `<div class="block">${d.itemsTitle ? `<div class="k">${e(d.itemsTitle)}</div>` : ""}${d.items.map((i) => `<div class="line"><span>${e(i.text)}</span><b>${e(i.amount)}</b></div>`).join("")}</div>`
    : ""
  const totals = `<div class="block">${d.totals.map((t) => `<div class="line${t.strong ? " total" : ""}"><span>${e(t.label)}</span><b>${e(t.value)}</b></div>`).join("")}</div>`
  const foot = d.footers.map((f) => `<p class="foot">${e(f)}</p>`).join("")
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(d.number)}</title><style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111827;margin:0;padding:32px;max-width:560px}
h1{font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#6B7280;margin:0 0 20px}
.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.num{font-size:20px;font-weight:700}.date{font-size:13px;color:#6B7280;margin-top:2px}
.status{font-size:12px;font-weight:700;color:#065F46;background:#ECFDF5;border-radius:99px;padding:4px 10px}.status.neutral{color:#374151;background:#F3F4F6}
.row{margin:10px 0}.k{font-size:12px;font-weight:600;color:#6B7280}.v{font-size:15px}
.block{border-top:1px solid #E5E7EB;margin-top:14px;padding-top:12px}
.line{display:flex;justify-content:space-between;gap:16px;font-size:15px;margin:6px 0}
.total{font-size:18px;font-weight:800;margin-top:10px}
.foot{font-size:12px;color:#6B7280;margin:6px 0}
</style></head><body><h1>${e(d.brand)}</h1><div class="head"><div><div class="num">${e(d.number)}</div><div class="date">${e(d.date)}</div></div><div class="status${d.statusTone === "neutral" ? " neutral" : ""}">${e(d.status)}</div></div>${rows}${items}${totals}${foot}</body></html>`
}
