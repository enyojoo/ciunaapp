import { CATEGORIES } from "./csv"

export interface Product {
  id: string
  title: string
  short_description: string | null
  long_description: string | null
  category: string
  status: "draft" | "live" | "archived"
  list_price: number | string | null
  sale_price: number | string | null
  fixed_currency: string
  stock_quantity: number | null
  sold_out: boolean
  fulfillment_mode: "delivery" | "pickup" | "digital"
  image_url: string | null
  gallery: string[] | null
  translations: Record<string, { title?: string; short_description?: string; long_description?: string }> | null
  review_status: "pending" | "approved" | "rejected" | null
  review_note: string | null
}

export interface FulfillmentData {
  pickup: { location: string | null; hours: string | null }
  notes: string | null
  /** Weekly schedule: a missing day is closed; an empty object means no hours are shown. */
  hours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", Array<{ open: string; close: string }>>>
  timeZone?: string
  paused?: boolean
  minOrder?: { amount: number; currency: string | null } | null
  zones: Array<{ id?: string; city: string; district: string; fee: number | string; currency: string; active: boolean; eta_minutes?: number | null }>
}

/** Category list for the merchant's section (service_line comes from the session). Null when the section is unknown. */
export function categoriesFor(line: "food" | "mart" | null | undefined): readonly string[] {
  return line ? CATEGORIES[line] : []
}

export const num = (s: string) => {
  const v = s.trim().replace(",", ".")
  return /^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN
}
export const PRODUCTS_KEY = "products"
