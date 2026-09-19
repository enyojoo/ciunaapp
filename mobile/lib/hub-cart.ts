import { useCallback, useEffect, useSyncExternalStore } from "react"
import { fetchWithAuth } from "@/lib/api"
import type { HubCart, HubCartItem, HubProduct } from "@/lib/types"

export interface HubCartClientState {
  cart: HubCart | null
  loading: boolean
  error: string | null
}

const EMPTY_STATE: HubCartClientState = { cart: null, loading: false, error: null }

/** Keyed per vendor (a cart is always single-vendor) and, separately, per service line for the Cart screen. */
const stateByKey = new Map<string, HubCartClientState>()
const listeners = new Set<() => void>()
const writeQueues = new Map<string, Promise<void>>()
/** Skip GET responses while a plus/minus/delete is still syncing — otherwise a stale refresh puts the old row back. */
let inFlightWrites = 0

function beginWrite() {
  inFlightWrites += 1
}

function endWrite() {
  inFlightWrites = Math.max(0, inFlightWrites - 1)
}

function getState(key: string): HubCartClientState {
  return stateByKey.get(key) || EMPTY_STATE
}

function setState(key: string, next: Partial<HubCartClientState>) {
  stateByKey.set(key, { ...getState(key), ...next })
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}))
}

function lineKey(lineSlug: "food" | "mart"): string {
  return `line:${lineSlug}`
}

function isOptimisticId(id: string): boolean {
  return id.startsWith("optimistic:")
}

function enqueueWrite(vendorId: string, task: () => Promise<void>): Promise<void> {
  const prev = writeQueues.get(vendorId) || Promise.resolve()
  const next = prev.catch(() => undefined).then(task)
  writeQueues.set(
    vendorId,
    next.catch(() => undefined),
  )
  return next
}

function snapshotCarts(vendorId: string, lineSlug: "food" | "mart") {
  const other = getState(lineKey(lineSlug)).cart
  return {
    vendor: getState(vendorId).cart,
    line: getState(lineKey(lineSlug)).cart,
    otherVendorId: other && other.vendor_id !== vendorId ? other.vendor_id : null,
    otherVendorCart: other && other.vendor_id !== vendorId ? other : null,
  }
}

function restoreSnapshot(snap: ReturnType<typeof snapshotCarts>, vendorId: string, lineSlug: "food" | "mart") {
  setState(vendorId, { cart: snap.vendor, loading: false })
  setState(lineKey(lineSlug), { cart: snap.line, loading: false })
  if (snap.otherVendorId) setState(snap.otherVendorId, { cart: snap.otherVendorCart, loading: false })
}

function clearLineVendor(lineSlug: "food" | "mart", exceptVendorId: string): string | undefined {
  const existing = getState(lineKey(lineSlug)).cart
  if (!existing || existing.vendor_id === exceptVendorId) return undefined
  setState(existing.vendor_id, { cart: null, loading: false, error: null })
  return existing.vendor?.name || undefined
}

/**
 * Local cart is the desired state (including deletions). Server payloads only
 * supply real ids/product rows — they must not re-add a product the user just removed.
 */
function mergeServerCart(server: HubCart, local: HubCart | null): HubCart {
  if (!local || local.vendor_id !== server.vendor_id) {
    return local ? local : { ...server, items: [] }
  }
  const serverByProduct = new Map(server.items.map((i) => [i.hub_product_id, i]))
  const items = local.items
    .filter((i) => i.quantity > 0)
    .map((i) => {
      const s = serverByProduct.get(i.hub_product_id)
      if (!s) return i
      return { ...s, quantity: i.quantity, product: i.product ?? s.product }
    })
  return { ...server, vendor: local.vendor ?? server.vendor, items }
}

function publishCart(vendorId: string, lineSlug: "food" | "mart", cart: HubCart | null) {
  if (cart) {
    setCartState(cart)
    return
  }
  setState(vendorId, { cart: null, loading: false, error: null })
  const line = getState(lineKey(lineSlug)).cart
  if (!line || line.vendor_id === vendorId) {
    setState(lineKey(lineSlug), { cart: null, loading: false, error: null })
  }
}

function cartWithQuantity(cart: HubCart, itemId: string, quantity: number): HubCart | null {
  if (quantity <= 0) {
    const items = cart.items.filter((i) => i.id !== itemId)
    return items.length ? { ...cart, items } : null
  }
  return {
    ...cart,
    items: cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
  }
}

function cartWithAddedProduct(
  cart: HubCart | null,
  params: { vendorId: string; serviceLineSlug: "food" | "mart"; hubProductId: string; quantity: number; product?: HubProduct | null },
): HubCart {
  if (cart && cart.vendor_id === params.vendorId) {
    const existing = cart.items.find((i) => i.hub_product_id === params.hubProductId)
    if (existing) {
      return {
        ...cart,
        items: cart.items.map((i) =>
          i.hub_product_id === params.hubProductId ? { ...i, quantity: i.quantity + params.quantity } : i,
        ),
      }
    }
    const item: HubCartItem = {
      id: `optimistic:${params.hubProductId}`,
      cart_id: cart.id,
      hub_product_id: params.hubProductId,
      quantity: params.quantity,
      product: params.product ?? null,
    }
    return { ...cart, items: [...cart.items, item] }
  }
  return {
    id: `optimistic:cart:${params.vendorId}`,
    user_id: "",
    service_line_slug: params.serviceLineSlug,
    vendor_id: params.vendorId,
    vendor: params.product?.vendor ?? null,
    status: "active",
    items: [
      {
        id: `optimistic:${params.hubProductId}`,
        cart_id: `optimistic:cart:${params.vendorId}`,
        hub_product_id: params.hubProductId,
        quantity: params.quantity,
        product: params.product ?? null,
      },
    ],
  }
}

/** Every mutation is keyed by vendor id server-side, but several screens (the mixed catalog, the Cart screen) watch the line-keyed entry instead — keep both in sync so neither goes stale. */
function setCartState(cart: HubCart, extra?: Partial<HubCartClientState>) {
  if (!cart.items.length) {
    publishCart(cart.vendor_id, cart.service_line_slug, null)
    return
  }
  const next = { cart, loading: false, error: null, ...extra }
  setState(cart.vendor_id, next)
  setState(lineKey(cart.service_line_slug), next)
}

async function fetchVendorCart(vendorId: string): Promise<HubCart | null> {
  const res = await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`)
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
  return (data.cart || null) as HubCart | null
}

async function deleteServerItem(itemId: string): Promise<HubCart | null> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to update cart"))
  return (data.cart || null) as HubCart | null
}

async function patchServerItem(itemId: string, quantity: number): Promise<HubCart> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to update cart"))
  return data.cart as HubCart
}

async function resolveServerItemId(vendorId: string, productId: string | undefined, knownId: string | null): Promise<string | null> {
  if (knownId && !isOptimisticId(knownId)) return knownId
  if (!productId) return null
  const live = getState(vendorId).cart
  const fromLive = live?.items.find((i) => i.hub_product_id === productId)
  if (fromLive && !isOptimisticId(fromLive.id)) return fromLive.id
  const remote = await fetchVendorCart(vendorId)
  return remote?.items.find((i) => i.hub_product_id === productId)?.id || null
}

/** After a POST, make the server match whatever the user has done since (qty change or delete). */
async function reconcilePostedCart(vendorId: string, lineSlug: "food" | "mart", server: HubCart) {
  const local = getState(vendorId).cart
  for (const serverItem of server.items) {
    const localItem = local?.items.find((i) => i.hub_product_id === serverItem.hub_product_id)
    if (!localItem || localItem.quantity <= 0) {
      await deleteServerItem(serverItem.id)
    } else if (localItem.quantity !== serverItem.quantity) {
      await patchServerItem(serverItem.id, localItem.quantity)
    }
  }
  const latest = getState(vendorId).cart
  if (!latest) return
  setCartState(mergeServerCart(server, latest))
}

export async function refreshHubCart(vendorId: string): Promise<HubCart | null> {
  if (inFlightWrites > 0) return getState(vendorId).cart
  if (!getState(vendorId).cart) setState(vendorId, { loading: true, error: null })
  else setState(vendorId, { error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    if (inFlightWrites > 0) return getState(vendorId).cart
    const cart = (data.cart || null) as HubCart | null
    const local = getState(vendorId).cart
    const merged = cart ? (local ? mergeServerCart(cart, local) : cart) : local
    if (merged) setCartState(merged)
    else setState(vendorId, { cart: null, loading: false })
    return merged
  } catch (e) {
    setState(vendorId, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return getState(vendorId).cart
  }
}

export async function refreshHubCartByLine(lineSlug: "food" | "mart"): Promise<HubCart | null> {
  const key = lineKey(lineSlug)
  if (inFlightWrites > 0) return getState(key).cart
  if (!getState(key).cart) setState(key, { loading: true, error: null })
  else setState(key, { error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?serviceLineSlug=${lineSlug}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    if (inFlightWrites > 0) return getState(key).cart
    const cart = (data.cart || null) as HubCart | null
    const local = getState(key).cart
    const merged = cart ? (local ? mergeServerCart(cart, local) : cart) : local
    if (merged) setCartState(merged)
    else {
      setState(key, { cart: null, loading: false })
    }
    return merged
  } catch (e) {
    setState(key, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return getState(key).cart
  }
}

export async function addToHubCart(params: {
  vendorId: string
  serviceLineSlug: "food" | "mart"
  hubProductId: string
  quantity?: number
  product?: HubProduct | null
}): Promise<{ cart: HubCart; clearedVendorName?: string }> {
  const quantity = params.quantity ?? 1
  const snap = snapshotCarts(params.vendorId, params.serviceLineSlug)
  const clearedVendorName = clearLineVendor(params.serviceLineSlug, params.vendorId)
  const optimistic = cartWithAddedProduct(getState(params.vendorId).cart, { ...params, quantity })
  beginWrite()
  setCartState(optimistic)

  try {
    await enqueueWrite(params.vendorId, async () => {
      const res = await fetchWithAuth("/api/hub/cart/items", {
        method: "POST",
        body: JSON.stringify({
          vendorId: params.vendorId,
          serviceLineSlug: params.serviceLineSlug,
          hubProductId: params.hubProductId,
          quantity,
        }),
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(String(data.error || "Failed to add to cart"))
      const server = data.cart as HubCart
      await reconcilePostedCart(params.vendorId, params.serviceLineSlug, server)
    })
  } catch (e) {
    restoreSnapshot(snap, params.vendorId, params.serviceLineSlug)
    throw e
  } finally {
    endWrite()
  }

  const cart = getState(params.vendorId).cart
  return { cart: cart || optimistic, clearedVendorName }
}

export async function updateHubCartItemQuantity(vendorId: string, itemId: string, quantity: number): Promise<HubCart> {
  const current = getState(vendorId).cart
  if (!current) throw new Error("Failed to update cart")
  const lineSlug = current.service_line_slug
  const snap = snapshotCarts(vendorId, lineSlug)
  const optimistic = cartWithQuantity(current, itemId, quantity)
  const productId = current.items.find((i) => i.id === itemId)?.hub_product_id
  const knownId = itemId && !isOptimisticId(itemId) ? itemId : null
  beginWrite()
  publishCart(vendorId, lineSlug, optimistic)

  try {
    await enqueueWrite(vendorId, async () => {
      const live = getState(vendorId).cart
      const liveItem = live?.items.find((i) => i.id === itemId) || live?.items.find((i) => i.hub_product_id === productId)
      const want = liveItem ? liveItem.quantity : quantity
      const id = await resolveServerItemId(vendorId, productId, knownId)
      if (!id) return
      if (want <= 0) {
        await deleteServerItem(id)
        publishCart(vendorId, lineSlug, getState(vendorId).cart)
        return
      }
      const server = await patchServerItem(id, want)
      const local = getState(vendorId).cart
      if (local) setCartState(mergeServerCart(server, local))
    })
  } catch (e) {
    restoreSnapshot(snap, vendorId, lineSlug)
    throw e
  } finally {
    endWrite()
  }

  return getState(vendorId).cart || current
}

export async function removeHubCartItem(vendorId: string, itemId: string): Promise<HubCart> {
  return updateHubCartItemQuantity(vendorId, itemId, 0)
}

export async function clearHubCart(vendorId: string): Promise<void> {
  const current = getState(vendorId).cart
  const lineSlug = current?.service_line_slug
  setState(vendorId, { cart: null, loading: false })
  if (lineSlug) {
    const line = getState(lineKey(lineSlug)).cart
    if (!line || line.vendor_id === vendorId) setState(lineKey(lineSlug), { cart: null, loading: false })
  }
  await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`, { method: "DELETE" })
}

export function useHubCart(vendorId: string | null | undefined): HubCartClientState {
  const subscribeFn = useCallback((cb: () => void) => subscribe(cb), [])
  const getSnapshot = useCallback(() => (vendorId ? getState(vendorId) : EMPTY_STATE), [vendorId])
  const snapshot = useSyncExternalStore(subscribeFn, getSnapshot, () => EMPTY_STATE)

  useEffect(() => {
    if (vendorId) void refreshHubCart(vendorId)
  }, [vendorId])

  return snapshot
}

export function useHubCartByLine(lineSlug: "food" | "mart"): HubCartClientState {
  const key = lineKey(lineSlug)
  const subscribeFn = useCallback((cb: () => void) => subscribe(cb), [])
  const getSnapshot = useCallback(() => getState(key), [key])
  const snapshot = useSyncExternalStore(subscribeFn, getSnapshot, () => EMPTY_STATE)

  useEffect(() => {
    void refreshHubCartByLine(lineSlug)
  }, [lineSlug])

  return snapshot
}

export function hubCartItemCount(cart: HubCart | null): number {
  if (!cart) return 0
  return cart.items.reduce((sum, i) => sum + i.quantity, 0)
}
