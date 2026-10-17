import { HUB_PRODUCT_MAIN_CATEGORIES, isHubProductMainCategory } from "@ciuna/shared"
import type { IconName } from "@/components/ui/icon"
import type { HubProduct } from "@/lib/types"

/**
 * Food meal types and Mart aisles: the fixed categories customers browse by. Ids and Office labels come from
 * @ciuna/shared; customer names are `hub.cat.<line>.<id>`. Office and sellers set hub_products.main_category; for a
 * product without one we guess with the same keywords as supabase/migrations/20261019190000_product_main_category.sql.
 * Food matches the title first (dishes are named by what they are), Mart the store's category first.
 */
export type HubLine = "food" | "mart"

export interface HubCategory {
  id: string
  icon: IconName
  bg: string
  fg: string
}

const LOOK: Record<HubLine, Record<string, Omit<HubCategory, "id">>> = {
  food: {
    mains: { icon: "food", bg: "#FFF7ED", fg: "#9A3412" },
    soups: { icon: "soup", bg: "#FEFCE8", fg: "#854D0E" },
    grill: { icon: "flame", bg: "#FEF2F2", fg: "#991B1B" },
    snacks: { icon: "pastry", bg: "#FDF2F8", fg: "#9D174D" },
    breakfast: { icon: "sunrise", bg: "#EFF6FF", fg: "#1E40AF" },
    drinks: { icon: "drink", bg: "#ECFDF5", fg: "#065F46" },
  },
  mart: {
    staples: { icon: "grain", bg: "#FEFCE8", fg: "#854D0E" },
    sauces: { icon: "sauce", bg: "#FEF2F2", fg: "#991B1B" },
    snacks: { icon: "sweets", bg: "#FDF2F8", fg: "#9D174D" },
    drinks: { icon: "drink", bg: "#ECFDF5", fg: "#065F46" },
    fresh: { icon: "frozen", bg: "#EFF6FF", fg: "#1E40AF" },
    digital: { icon: "phone", bg: "#F5F3FF", fg: "#5B21B6" },
    other: { icon: "mart", bg: "#F3F4F6", fg: "#374151" },
  },
}

export function hubCategories(line: HubLine): HubCategory[] {
  return HUB_PRODUCT_MAIN_CATEGORIES[line].map((c) => ({ id: c.id, ...LOOK[line][c.id]! }))
}

export function hubCategory(line: HubLine, id: string): HubCategory | null {
  const look = LOOK[line][id]
  return look ? { id, ...look } : null
}

/** Mart's catch-all aisle only shows when something is in it. */
export const HIDDEN_WHEN_EMPTY: Record<HubLine, Set<string>> = { food: new Set(), mart: new Set(["other"]) }

const FOOD_RULES: [string, RegExp][] = [
  ["soups", /(soup|stew|borscht|egusi|okra|ogbono|суп|борщ|солянк|(^|\s)щи(\s|$)|sopa|soupe|汤)/],
  ["grill", /(grill|suya|kebab|shawarma|bbq|barbecue|skewer|шашлык|гриль|шаурм|asado|parrilla|烧烤|串)/],
  ["snacks", /(snack|pastr|puff|chin chin|meat pie|samosa|пирож|выпечк|закуск|empanada|点心|小吃)/],
  ["breakfast", /(breakfast|syrnik|porridge|pancake|omelet|завтрак|сырник|каша|desayuno|petit-d|café da manhã|早餐)/],
  ["drinks", /(drink|juice|zobo|\btea\b|coffee|smoothie|kvass|напит|(^|\s)сок|(^|\s)чай|кофе|квас|bebida|boisson|饮)/],
  ["mains", /(main|meal|rice|jollof|dish|основн|блюд|обед|plato|plat|prato|主食|套餐)/],
]

const MART_RULES: [string, RegExp][] = [
  ["digital", /(digital|vpn|netflix|chatgpt|gamma|subscription|virtual card|card payment|esim|ai tool|entertainment|connectivity|подписк|виртуальн|цифров|suscrip|abonnement|assinatura|订阅|会员)/],
  ["sauces", /(sauce|spice|chili|chilli|seasoning|curry|соус|специ|припра|salsa|épice|tempero|酱|调料)/],
  ["snacks", /(sweet|snack|chocolate|candy|biscuit|cookie|dulce|chips|сладост|шоколад|печень|конфет|bonbon|doce|零食|糖)/],
  ["drinks", /(drink|juice|\btea\b|coffee|matcha|soda|напит|(^|\s)сок|(^|\s)чай|кофе|bebida|boisson|饮|茶)/],
  ["fresh", /(fresh|frozen|meat|fish|chicken|beef|vegetable|fruit|свеж|заморож|мяс|рыб|fresco|congel|surgel|新鲜|冷冻|肉|鱼)/],
  ["staples", /(staple|rice|bean|flour|grain|noodle|pasta|garri|semolina|\byam|corn|\boat|(^|\s)рис|фасол|(^|\s)мук|крупа|лапш|макарон|harina|frijol|arroz|farine|\briz\b|farinha|feijão|米|面|豆)/],
]

function match(rules: [string, RegExp][], text: string | null | undefined): string | null {
  const t = String(text || "").trim().toLowerCase()
  if (!t) return null
  for (const [id, re] of rules) if (re.test(t)) return id
  return null
}

/** Where a product appears: the category set in Office or by the seller, or a keyword guess. */
export function productMainCategory(p: Pick<HubProduct, "title" | "category"> & { main_category?: string | null }, line: HubLine): string {
  if (p.main_category && isHubProductMainCategory(line, p.main_category)) return p.main_category
  if (line === "food") return match(FOOD_RULES, p.title) ?? match(FOOD_RULES, p.category) ?? "mains"
  return match(MART_RULES, p.category) ?? match(MART_RULES, p.title) ?? "other"
}
