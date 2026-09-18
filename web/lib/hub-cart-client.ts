"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import type { HubCartRow } from "@/lib/hub-types"

export interface HubCartClientState {
  cart: HubCartRow | null
  loading: boolean
  error: string | null
}

const EMPTY_STATE: HubCartClientState = { cart: null, loading: false, error: null }

/** One cart per vendor (a cart is always single-vendor) — keyed so switching vendors never stomps another vendor's cached cart. */
const cartsByVendor = new Map<string, HubCartClientState>()
const listeners = new Set<() => void>()

function getState(vendorId: string): HubCartClientState {
  return cartsByVendor.get(vendorId) || EMPTY_STATE
}

function setState(vendorId: string, next: Partial<HubCartClientState>) {
  cartsByVendor.set(vendorId, { ...getState(vendorId), ...next })
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

/** Every mutation is keyed by vendor id server-side, but the mixed line-home page and the Cart screen watch the line-keyed entry instead — keep both in sync so neither goes stale. */
function setCartState(cart: HubCartRow, extra?: Partial<HubCartClientState>) {
  const next = { cart, loading: false, error: null, ...extra }
  setState(cart.vendor_id, next)
  setState(lineKey(cart.service_line_slug), next)
}

export async function refreshHubCart(vendorId: string): Promise<HubCartRow | null> {
  setState(vendorId, { loading: true, error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    const cart = (data.cart || null) as HubCartRow | null
    setState(vendorId, { cart, loading: false })
    return cart
  } catch (e) {
    setState(vendorId, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return null
  }
}

/** `clearedVendorName` is set when adding this item abandoned an active cart for a different vendor in the same line. */
export async function addToHubCart(params: {
  vendorId: string
  serviceLineSlug: "food" | "mart"
  hubProductId: string
  quantity?: number
}): Promise<{ cart: HubCartRow; clearedVendorName?: string }> {
  const res = await fetchWithAuth("/api/hub/cart/items", { method: "POST", body: JSON.stringify(params) })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to add to cart"))
  const cart = data.cart as HubCartRow
  setCartState(cart)
  return { cart, clearedVendorName: data.clearedVendorName ? String(data.clearedVendorName) : undefined }
}

export async function updateHubCartItemQuantity(vendorId: string, itemId: string, quantity: number): Promise<HubCartRow> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to update cart"))
  const cart = data.cart as HubCartRow
  setCartState(cart)
  return cart
}

export async function removeHubCartItem(vendorId: string, itemId: string): Promise<HubCartRow> {
  const res = await fetchWithAuth(`/api/hub/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(String(data.error || "Failed to remove item"))
  const cart = data.cart as HubCartRow
  setCartState(cart)
  return cart
}

/** Abandons the active cart for a vendor — used when the customer starts a cart with a different vendor. */
export async function clearHubCart(vendorId: string): Promise<void> {
  await fetchWithAuth(`/api/hub/cart?vendorId=${encodeURIComponent(vendorId)}`, { method: "DELETE" })
  setState(vendorId, { cart: null })
}

/** Live cart state for one vendor, refreshed on mount/vendor change and shared across every component watching that vendor. */
export function useHubCart(vendorId: string | null | undefined): HubCartClientState {
  const subscribeFn = useCallback((cb: () => void) => subscribe(cb), [])
  const getSnapshot = useCallback(() => (vendorId ? getState(vendorId) : EMPTY_STATE), [vendorId])
  const snapshot = useSyncExternalStore(subscribeFn, getSnapshot, () => EMPTY_STATE)

  useEffect(() => {
    if (vendorId) void refreshHubCart(vendorId)
  }, [vendorId])

  return snapshot
}

/** `useHubCartByLine`/`refreshHubCartByLine` below: same cache, keyed by service line instead of vendor — for the `/food/cart`, `/mart/cart` screens (and the mixed line-home page) that arrive without a vendor id. There's at most one active cart per line. */
export async function refreshHubCartByLine(lineSlug: "food" | "mart"): Promise<HubCartRow | null> {
  const key = lineKey(lineSlug)
  setState(key, { loading: true, error: null })
  try {
    const res = await fetchWithAuth(`/api/hub/cart?serviceLineSlug=${lineSlug}`)
    const data = await parseJson(res)
    if (!res.ok) throw new Error(String(data.error || "Failed to load cart"))
    const cart = (data.cart || null) as HubCartRow | null
    setState(key, { cart, loading: false })
    if (cart) setState(cart.vendor_id, { cart, loading: false }) // keep the per-vendor cache in sync too
    return cart
  } catch (e) {
    setState(key, { loading: false, error: e instanceof Error ? e.message : "Failed to load cart" })
    return null
  }
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

export function hubCartItemCount(cart: HubCartRow | null): number {
  if (!cart) return 0
  return cart.items.reduce((sum, i) => sum + i.quantity, 0)
}

export function hubCartSubtotal(cart: HubCartRow | null): { amount: number; currency: string } | null {
  if (!cart || !cart.items.length) return null
  const currency = cart.items.find((i) => i.product?.fixed_currency)?.product?.fixed_currency || ""
  const amount = cart.items.reduce((sum, i) => {
    if (!i.product || i.unavailable) return sum
    const unit = i.product.sale_price ?? i.product.list_price ?? i.product.fixed_amount ?? 0
    return sum + Number(unit) * i.quantity
  }, 0)
  return currency ? { amount, currency } : null
}
