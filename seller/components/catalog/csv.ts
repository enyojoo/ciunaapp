/** Small RFC 4180 CSV parser and the product-row mapping used by bulk import. No dependencies, so it runs in node tests. */

export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  let i = 0
  let touched = false
  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        quoted = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"' && field === "") { quoted = true; touched = true; i++; continue }
    if (c === ",") { row.push(field); field = ""; touched = true; i++; continue }
    if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++
      i++
      if (touched || field !== "") { row.push(field); rows.push(row) }
      row = []
      field = ""
      touched = false
      continue
    }
    field += c
    touched = true
    i++
  }
  if (touched || field !== "") { row.push(field); rows.push(row) }
  return rows
}

export function toCsv(rows: string[][]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n"
}

export const CSV_HEADERS = ["title", "short_description", "category", "list_price", "sale_price", "currency", "stock", "fulfillment_mode"] as const
export const MAX_IMPORT_ROWS = 200
export const CURRENCIES = ["RUB", "USD", "EUR", "CNY", "NGN", "GHS", "KES", "BRL"]
export const MODES = ["delivery", "pickup", "digital"] as const
export const CATEGORIES = { food: ["Meals", "Snacks", "Drinks", "Other"], mart: ["Groceries", "Household", "Electronics", "Other"] } as const

export function templateCsv(currency: string, line: "food" | "mart" | null = null) {
  const cat = (line ? CATEGORIES[line] : CATEGORIES.food)[0]
  return toCsv([
    [...CSV_HEADERS],
    ["Chicken wrap", "Grilled chicken, lettuce, garlic sauce", cat, "9.50", "8.00", currency, "20", "delivery"],
    ["Fresh juice", "Cold-pressed orange juice", (line ? CATEGORIES[line] : CATEGORIES.food)[0], "4.00", "", currency, "", "pickup"],
  ])
}

export type ImportErrorCode = "TITLE_REQUIRED" | "PRICE_REQUIRED" | "SALE_PRICE_TOO_HIGH" | "INVALID_STOCK" | "CATEGORY_OUTSIDE_LINE" | "FULFILLMENT_REQUIRED" | "CURRENCY_INVALID"

export interface ImportPayload {
  title: string
  short_description: string
  category?: string
  list_price: number
  sale_price: number | null
  fixed_currency: string
  stock_quantity: number | null
  fulfillment_mode: string
  status: "draft"
}
export interface ImportRow { line: number; raw: string[]; payload: ImportPayload | null; errors: ImportErrorCode[] }
export interface ParsedImport { rows: ImportRow[]; missingColumns: string[]; tooMany: boolean; total: number }

const num = (s: string) => (/^\s*\d+([.,]\d+)?\s*$/.test(s) ? Number(s.trim().replace(",", ".")) : NaN)

/** Validate rows the way the API does. `categories` null means the merchant's line is unknown: any category from either list passes the preview and the API decides. */
export function mapImportRows(table: string[][], opts: { defaultCurrency: string; categories: readonly string[] | null }): ParsedImport {
  const header = (table[0] || []).map((h) => h.trim().toLowerCase())
  const missing = CSV_HEADERS.filter((h) => !header.includes(h) && (h === "title" || h === "list_price"))
  const idx = (h: string) => header.indexOf(h)
  const body = table.slice(1).filter((r) => r.some((c) => c.trim() !== ""))
  const rows: ImportRow[] = body.slice(0, MAX_IMPORT_ROWS).map((raw, n) => {
    const get = (h: string) => (idx(h) >= 0 ? (raw[idx(h)] ?? "").trim() : "")
    const errors: ImportErrorCode[] = []
    const title = get("title")
    if (title.length < 2) errors.push("TITLE_REQUIRED")
    const list = num(get("list_price"))
    if (!(list > 0)) errors.push("PRICE_REQUIRED")
    const saleRaw = get("sale_price")
    let sale: number | null = null
    if (saleRaw) {
      sale = num(saleRaw)
      if (!(sale > 0) || (list > 0 && sale >= list)) errors.push("SALE_PRICE_TOO_HIGH")
    }
    const stockRaw = get("stock")
    let stock: number | null = null
    if (stockRaw) {
      stock = /^\d+$/.test(stockRaw) ? Number(stockRaw) : NaN
      if (!Number.isInteger(stock) || (stock as number) >= 1_000_000) errors.push("INVALID_STOCK")
    }
    const category = get("category")
    if (category && opts.categories && !opts.categories.includes(category)) errors.push("CATEGORY_OUTSIDE_LINE")
    const currency = (get("currency") || opts.defaultCurrency).toUpperCase()
    if (!CURRENCIES.includes(currency)) errors.push("CURRENCY_INVALID")
    const mode = (get("fulfillment_mode") || "delivery").toLowerCase()
    if (!(MODES as readonly string[]).includes(mode)) errors.push("FULFILLMENT_REQUIRED")
    const payload: ImportPayload | null = errors.length
      ? null
      : { title, short_description: get("short_description"), ...(category ? { category } : {}), list_price: list, sale_price: sale, fixed_currency: currency, stock_quantity: stock, fulfillment_mode: mode, status: "draft" }
    return { line: n + 2, raw, payload, errors }
  })
  return { rows, missingColumns: missing, tooMany: body.length > MAX_IMPORT_ROWS, total: body.length }
}
