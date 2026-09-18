import { createServerClient } from "@/lib/supabase"
import { enrichHubProductsWithVendors } from "@/lib/hub-product-vendors"
import type { HubCartItemRow, HubCartRow, HubProductRow } from "@/lib/hub-types"

type HubServer = ReturnType<typeof createServerClient>

function isProductUnavailable(product: HubProductRow | null | undefined): boolean {
  if (!product) return true
  if (product.status !== "live") return true
  if (product.sold_out) return true
  if (product.stock_quantity != null && Number(product.stock_quantity) <= 0) return true
  return false
}

/** Attach live product data to each cart item; flags items whose product moved (archived/sold out/deleted). */
async function hydrateCart(server: HubServer, cart: Record<string, unknown>): Promise<HubCartRow> {
  const { data: itemRows, error: itemsErr } = await server
    .from("hub_cart_items")
    .select("*")
    .eq("cart_id", cart.id as string)
    .order("created_at", { ascending: true })

  if (itemsErr) {
    console.error("hydrateCart items", itemsErr)
    throw new Error("Failed to load cart items")
  }

  const rows = (itemRows || []) as Record<string, unknown>[]
  const productIds = [...new Set(rows.map((r) => String(r.hub_product_id)))]

  let productsById = new Map<string, HubProductRow>()
  if (productIds.length) {
    const { data: products, error: pErr } = await server.from("hub_products").select("*").in("id", productIds)
    if (pErr) {
      console.error("hydrateCart products", pErr)
      throw new Error("Failed to load cart products")
    }
    const enriched = await enrichHubProductsWithVendors(server, (products || []) as HubProductRow[])
    productsById = new Map(enriched.map((p) => [String(p.id), p]))
  }

  const items: HubCartItemRow[] = rows.map((r) => {
    const product = productsById.get(String(r.hub_product_id)) || null
    return {
      id: String(r.id),
      cart_id: String(r.cart_id),
      hub_product_id: String(r.hub_product_id),
      quantity: Number(r.quantity) || 1,
      product,
      unavailable: isProductUnavailable(product),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }
  })

  let vendor: HubCartRow["vendor"]
  const { data: vendorRow } = await server.from("hub_vendors").select("*").eq("id", cart.vendor_id as string).maybeSingle()
  if (vendorRow) {
    vendor = {
      id: String(vendorRow.id),
      name: String(vendorRow.name || ""),
      slug: String(vendorRow.slug || ""),
      service_line_slug: String(vendorRow.service_line_slug || ""),
      photo_url: vendorRow.photo_url != null ? String(vendorRow.photo_url) : null,
      is_verified: Boolean(vendorRow.is_verified),
    }
  }

  return {
    id: String(cart.id),
    user_id: String(cart.user_id),
    service_line_slug: cart.service_line_slug as "food" | "mart",
    vendor_id: String(cart.vendor_id),
    vendor,
    status: cart.status as HubCartRow["status"],
    items,
    created_at: String(cart.created_at),
    updated_at: String(cart.updated_at),
  }
}

/** Fetches a cart by id, hydrated. Verifies it belongs to the caller. Used by checkout. */
export async function getCartById(userId: string, cartId: string): Promise<HubCartRow> {
  const server = createServerClient()
  const { data: cart, error } = await server.from("hub_carts").select("*").eq("id", cartId).single()
  if (error || !cart) throw new Error("Cart not found")
  if (String(cart.user_id) !== userId) throw new Error("Cart not found")
  return hydrateCart(server, cart as Record<string, unknown>)
}

/** Marks a cart converted after a successful checkout. */
export async function markCartConverted(cartId: string): Promise<void> {
  const server = createServerClient()
  await server.from("hub_carts").update({ status: "converted", updated_at: new Date().toISOString() }).eq("id", cartId)
}

/** Fetches the user's active cart for a vendor, hydrated. Returns null when none exists yet. */
export async function getActiveCart(
  userId: string,
  vendorId: string,
): Promise<HubCartRow | null> {
  const server = createServerClient()
  const { data: cart, error } = await server
    .from("hub_carts")
    .select("*")
    .eq("user_id", userId)
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    console.error("getActiveCart", error)
    throw new Error("Failed to load cart")
  }
  if (!cart) return null
  return hydrateCart(server, cart as Record<string, unknown>)
}

/**
 * Fetches the user's active cart for a whole service line (Food or Mart), hydrated. There is at
 * most one, since adding an item from a different vendor abandons any other active cart in the
 * same line (see `createOrGetActiveCart`) — used by the `/food/cart` and `/mart/cart` screens,
 * which don't know a vendor id up front.
 */
export async function getActiveCartForServiceLine(
  userId: string,
  serviceLineSlug: "food" | "mart",
): Promise<HubCartRow | null> {
  const server = createServerClient()
  const { data: cart, error } = await server
    .from("hub_carts")
    .select("*")
    .eq("user_id", userId)
    .eq("service_line_slug", serviceLineSlug)
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    console.error("getActiveCartForServiceLine", error)
    throw new Error("Failed to load cart")
  }
  if (!cart) return null
  return hydrateCart(server, cart as Record<string, unknown>)
}

/**
 * Creates (or returns the existing) active cart for a vendor. A cart is single-vendor: if the
 * caller already has an active cart for a *different* vendor in the same service line, it is
 * abandoned first — the caller name is returned so the UI can tell the customer what happened
 * ("Started a new cart for {vendor} — your {other vendor} cart was cleared") instead of the
 * switch happening silently.
 */
export async function createOrGetActiveCart(
  userId: string,
  vendorId: string,
  serviceLineSlug: "food" | "mart",
): Promise<{ cart: HubCartRow; clearedVendorName?: string }> {
  const server = createServerClient()

  const { data: vendor, error: vErr } = await server.from("hub_vendors").select("id, name, service_line_slug").eq("id", vendorId).single()
  if (vErr || !vendor) throw new Error("Vendor not found")

  const { data: existing } = await server
    .from("hub_carts")
    .select("*")
    .eq("user_id", userId)
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .maybeSingle()

  if (existing) return { cart: await hydrateCart(server, existing as Record<string, unknown>) }

  let clearedVendorName: string | undefined
  const { data: otherActive } = await server
    .from("hub_carts")
    .select("id, vendor_id")
    .eq("user_id", userId)
    .eq("service_line_slug", serviceLineSlug)
    .eq("status", "active")
    .neq("vendor_id", vendorId)

  if (otherActive?.length) {
    const { data: otherVendor } = await server.from("hub_vendors").select("name").eq("id", otherActive[0].vendor_id).maybeSingle()
    clearedVendorName = otherVendor?.name ? String(otherVendor.name) : undefined
    await server
      .from("hub_carts")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .in("id", otherActive.map((c) => c.id))
  }

  const { data: inserted, error: insErr } = await server
    .from("hub_carts")
    .insert({ user_id: userId, vendor_id: vendorId, service_line_slug: serviceLineSlug, status: "active" })
    .select()
    .single()

  if (insErr || !inserted) {
    // Unique-active-cart-per-vendor race: someone else created it a moment ago — fetch and return that one.
    if (insErr?.code === "23505") {
      const { data: raced } = await server
        .from("hub_carts")
        .select("*")
        .eq("user_id", userId)
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .maybeSingle()
      if (raced) return { cart: await hydrateCart(server, raced as Record<string, unknown>), clearedVendorName }
    }
    console.error("createOrGetActiveCart insert", insErr)
    throw new Error("Failed to create cart")
  }

  return { cart: await hydrateCart(server, inserted as Record<string, unknown>), clearedVendorName }
}

/** Marks the user's active cart for a vendor abandoned (used to clear it before starting a cart with a different vendor). */
export async function clearActiveCart(userId: string, vendorId: string): Promise<void> {
  const server = createServerClient()
  const { error } = await server
    .from("hub_carts")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("vendor_id", vendorId)
    .eq("status", "active")
  if (error) {
    console.error("clearActiveCart", error)
    throw new Error("Failed to clear cart")
  }
}

/** Adds a product to a cart (or increments quantity if already present). Only fixed-price, live products may be carted. */
export async function addCartItem(
  userId: string,
  params: { vendorId: string; serviceLineSlug: "food" | "mart"; hubProductId: string; quantity?: number },
): Promise<{ cart: HubCartRow; clearedVendorName?: string }> {
  const server = createServerClient()
  const quantity = Math.max(1, Math.floor(Number(params.quantity) || 1))

  const { data: product, error: pErr } = await server.from("hub_products").select("*").eq("id", params.hubProductId).single()
  if (pErr || !product) throw new Error("Product not found")
  if (product.status !== "live") throw new Error("Product is not available")
  if (product.pricing_type !== "fixed") throw new Error("Only fixed-price products can be added to a cart")
  if (String(product.vendor_id || "") !== params.vendorId) throw new Error("Product does not belong to this vendor")
  if (product.sold_out || (product.stock_quantity != null && Number(product.stock_quantity) <= 0)) {
    throw new Error("Product is sold out")
  }

  const { cart, clearedVendorName } = await createOrGetActiveCart(userId, params.vendorId, params.serviceLineSlug)

  const { data: existingItem } = await server
    .from("hub_cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("hub_product_id", params.hubProductId)
    .maybeSingle()

  if (existingItem) {
    const { error: updErr } = await server
      .from("hub_cart_items")
      .update({ quantity: Number(existingItem.quantity) + quantity, updated_at: new Date().toISOString() })
      .eq("id", existingItem.id)
    if (updErr) {
      console.error("addCartItem update", updErr)
      throw new Error("Failed to update cart")
    }
  } else {
    const { error: insErr } = await server
      .from("hub_cart_items")
      .insert({ cart_id: cart.id, hub_product_id: params.hubProductId, quantity })
    if (insErr) {
      console.error("addCartItem insert", insErr)
      throw new Error("Failed to add item to cart")
    }
  }

  const { data: refreshed } = await server.from("hub_carts").select("*").eq("id", cart.id).single()
  return { cart: await hydrateCart(server, refreshed as Record<string, unknown>), clearedVendorName }
}

/** Sets a cart item's quantity (removing it when set to 0). Verifies the item's cart belongs to the caller. */
export async function updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<HubCartRow> {
  const server = createServerClient()
  const qty = Math.floor(Number(quantity) || 0)

  const { data: item, error: itemErr } = await server
    .from("hub_cart_items")
    .select("*, cart:hub_carts!inner(id, user_id, status)")
    .eq("id", itemId)
    .single()

  if (itemErr || !item) throw new Error("Cart item not found")
  const cartRow = item.cart as { id: string; user_id: string; status: string }
  if (cartRow.user_id !== userId) throw new Error("Cart item not found")
  if (cartRow.status !== "active") throw new Error("Cart is no longer active")

  if (qty <= 0) {
    const { error: delErr } = await server.from("hub_cart_items").delete().eq("id", itemId)
    if (delErr) throw new Error("Failed to remove cart item")
  } else {
    const { error: updErr } = await server
      .from("hub_cart_items")
      .update({ quantity: qty, updated_at: new Date().toISOString() })
      .eq("id", itemId)
    if (updErr) throw new Error("Failed to update cart item")
  }

  const { data: refreshedCart } = await server.from("hub_carts").select("*").eq("id", cartRow.id).single()
  return hydrateCart(server, refreshedCart as Record<string, unknown>)
}

/** Removes a cart item. Verifies the item's cart belongs to the caller. */
export async function removeCartItem(userId: string, itemId: string): Promise<HubCartRow> {
  return updateCartItemQuantity(userId, itemId, 0)
}
