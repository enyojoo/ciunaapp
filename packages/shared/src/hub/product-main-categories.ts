/**
 * Fixed categories the customer apps browse Food and Mart by: six meal types for Food, six aisles (plus "other")
 * for Mart. Stored on hub_products.main_category (the database check lists the union of these ids) and set in
 * Office and the seller portal. `category` stays as the store's own menu section ("Breakfast", "Grill").
 * Customer-facing names live in the app locales under `hub.cat.<line>.<id>`; the English labels here are for
 * Office and sellers.
 */
export const HUB_PRODUCT_MAIN_CATEGORIES = {
  food: [
    { id: "mains", label: "Mains" },
    { id: "soups", label: "Soups and stews" },
    { id: "grill", label: "Grill" },
    { id: "snacks", label: "Snacks and pastries" },
    { id: "breakfast", label: "Breakfast" },
    { id: "drinks", label: "Drinks" },
  ],
  mart: [
    { id: "staples", label: "Pantry staples" },
    { id: "sauces", label: "Sauces and spices" },
    { id: "snacks", label: "Snacks and sweets" },
    { id: "drinks", label: "Drinks" },
    { id: "fresh", label: "Fresh and frozen" },
    { id: "digital", label: "Digital services" },
    { id: "other", label: "Other" },
  ],
} as const

export type HubProductLine = keyof typeof HUB_PRODUCT_MAIN_CATEGORIES
export type HubProductMainCategoryId = (typeof HUB_PRODUCT_MAIN_CATEGORIES)[HubProductLine][number]["id"]

/** True when `id` is one of `line`'s categories. */
export function isHubProductMainCategory(line: string | null | undefined, id: unknown): id is HubProductMainCategoryId {
  if (line !== "food" && line !== "mart") return false
  return typeof id === "string" && HUB_PRODUCT_MAIN_CATEGORIES[line].some((c) => c.id === id)
}
