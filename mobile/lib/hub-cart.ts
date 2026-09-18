import { useCallback, useEffect, useSyncExternalStore } from "react"
import { fetchWithAuth } from "@/lib/api"
import type { HubCart } from "@/lib/types"

export interface HubCartClientState {
  cart: HubCart | null
  loading: boolean
  error: string | null
}

const EMPTY_STATE: HubCartClientState = { cart: null, loading: false, error: null }

/** Keyed per vendor (a cart is always single-vendor) and, separately, per service line for the Cart screen. */
const stateByKey = new Map<string, HubCartClientState>()
const listeners = new Set<() => void>()

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

/** Every mutation is keyed by vendor id server-side, but several screens (the mixed catalog, the Cart screen) watch the line-keyed entry instead — keep both in sync so neither goes stale. */
function setCartState(cart: HubCart, extra?: Partial<HubCartClientState>) {
  const next = { cart, loading: false, error: null, ...extra }
  setState(cart.vendor_id, next)
  setState(lineKey(cart.service_line_slug), next)
}

export async function refreshHubCart(vendorId: string): Promise<HubCart | null> {
  setState(vendorId, { loading: true, error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    const cart = (data.cart || null) as HubCart | null
    setState(vendorId, { cart, loading: false })
    return cart
  } catch (e) {
    setState(vendorId, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return null
  }
}

export async function refreshHubCartByLine(lineSlug: "food" | "mart"): Promise<HubCart | null> {
  const key = lineKey(lineSlug)
  setState(key, { loading: true, error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?serviceLineSlug=${lineSlug}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    const cart = (data.cart || null) as HubCart | null
    setState(key, { cart, loading: false })
    if (cart) setState(cart.vendor_id, { cart, loading: false })
    return cart
  } catch (e) {
    setState(key, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return null
  }
}

export async function addToHubCart(params: {
  vendorId: string
  serviceLineSlug: "food" | "mart"
  hubProductId: string
  quantity?: number
}): Promise<{ cart: HubCart; clearedVendorName?: string }> {
  const res = await fetchWithAuth("/api/hub/cart/items", { method: "POST", body: JSON.stringify(params) })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to add to cart"))
  const cart = data.cart as HubCart
  setCartState(cart)
  return { cart, clearedVendorName: data.clearedVendorName ? String(data.clearedVendorName) : undefined }
}

export async function updateHubCartItemQuantity(vendorId: string, itemId: string, quantity: number): Promise<HubCart> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to update cart"))
  const cart = data.cart as HubCart
  setCartState(cart)
  return cart
}

export async function removeHubCartItem(vendorId: string, itemId: string): Promise<HubCart> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to remove item"))
  const cart = data.cart as HubCart
  setCartState(cart)
  return cart
}

export async function clearHubCart(vendorId: string): Promise<void> {
  await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`, { method: "DELETE" })
  setState(vendorId, { cart: null })
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
