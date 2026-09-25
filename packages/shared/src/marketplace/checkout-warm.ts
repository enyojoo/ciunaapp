import type { MarketplaceOrder, MarketplaceQuote, MarketplaceSubmit } from "./types"

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>

export type CheckoutWarmEntry = {
  cartId: string
  quote: MarketplaceQuote | null
  order: MarketplaceOrder | null
  error: string | null
  phase: "idle" | "preview" | "submit" | "ready" | "error"
  promise: Promise<CheckoutWarmEntry> | null
  fingerprint: string
}

const warmByCart = new Map<string, CheckoutWarmEntry>()
/** Carts that already created an order — preview would 409 CART_CONVERTED. */
const convertedCarts = new Set<string>()

async function api(fetcher: Fetcher, path: string, body?: unknown) {
  const r = await fetcher(
    path,
    body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined,
  )
  const data = await r.json()
  if (!r.ok)
    throw Object.assign(new Error(data.errorCode || data.error || "MARKETPLACE_UNAVAILABLE"), {
      status: r.status,
    })
  return data
}

function entry(cartId: string, fingerprint: string): CheckoutWarmEntry {
  const existing = warmByCart.get(cartId)
  if (existing && existing.fingerprint === fingerprint) return existing
  // Never clobber an in-flight submit / ready warm (fingerprint may change as cart UI updates).
  if (
    existing &&
    (existing.phase === "submit" || existing.phase === "ready" || existing.phase === "preview" || existing.promise)
  ) {
    return existing
  }
  const next: CheckoutWarmEntry = {
    cartId,
    quote: null,
    order: null,
    error: null,
    phase: "idle",
    promise: null,
    fingerprint,
  }
  warmByCart.set(cartId, next)
  return next
}

/** Soft-invalidate when cart line items change or cancel restores the cart. */
export function invalidateCheckoutWarm(cartId?: string) {
  if (cartId) {
    warmByCart.delete(cartId)
    convertedCarts.delete(cartId)
  } else {
    warmByCart.clear()
    convertedCarts.clear()
  }
}

export function markCartConverted(cartId: string) {
  convertedCarts.add(cartId)
}

export function peekCheckoutWarm(cartId: string): CheckoutWarmEntry | null {
  return warmByCart.get(cartId) || null
}

/**
 * Checkout / cart must not call /preview while warm owns networking, or after convert.
 * Having only an idle cached quote does NOT skip — fulfillment changes may re-preview.
 */
export function shouldSkipCartPreview(cartId: string): boolean {
  if (convertedCarts.has(cartId)) return true
  const w = warmByCart.get(cartId)
  if (!w) return false
  return (
    !!w.order ||
    !!w.promise ||
    w.phase === "preview" ||
    w.phase === "submit" ||
    w.phase === "ready"
  )
}

/** @deprecated use shouldSkipCartPreview */
export function isCheckoutWarmBusy(cartId: string): boolean {
  return shouldSkipCartPreview(cartId)
}

/** Prefetch quote while the shopper is still on cart / mart. Does not create an order. */
export function prefetchCheckoutQuote(opts: {
  cartId: string
  fingerprint: string
  fetcher: Fetcher
}): Promise<MarketplaceQuote | null> {
  if (!opts.fingerprint || convertedCarts.has(opts.cartId)) return Promise.resolve(null)
  const w = entry(opts.cartId, opts.fingerprint)
  if (w.quote && w.fingerprint === opts.fingerprint) return Promise.resolve(w.quote)
  if (w.phase === "preview" || w.phase === "submit" || w.phase === "ready") {
    return (w.promise || Promise.resolve(w)).then((e) => e.quote)
  }
  w.phase = "preview"
  const run = (async () => {
    try {
      const d = await api(opts.fetcher, "/api/hub/checkout/preview", {
        source: { kind: "cart", cartId: opts.cartId },
      })
      // Submit may have taken over while preview was in flight.
      if (w.phase !== "preview") return w
      w.quote = d.quote as MarketplaceQuote
      w.phase = "idle"
      w.error = null
      return w
    } catch (e) {
      if (w.phase !== "preview") return w
      const msg = (e as Error).message
      if (msg === "CART_CONVERTED") {
        convertedCarts.add(opts.cartId)
        warmByCart.delete(opts.cartId)
        return {
          cartId: opts.cartId,
          quote: null,
          order: null,
          error: msg,
          phase: "error" as const,
          promise: null,
          fingerprint: opts.fingerprint,
        }
      }
      // EMPTY_ORDER / inactive cart — quiet; cart UI handles empty state.
      w.error = msg
      w.phase = "error"
      return w
    } finally {
      if (w.phase === "preview" || w.phase === "idle" || w.phase === "error") {
        if (w.promise === run) w.promise = null
      }
    }
  })()
  w.promise = run
  return run.then((e) => e.quote)
}

/**
 * Start quote + YooKassa order as soon as Checkout is tapped.
 * Checkout screen hydrates from this so the widget is not waiting on a cold start.
 */
export function warmCartCheckout(opts: {
  cartId: string
  fingerprint: string
  fetcher: Fetcher
  uuid: () => string
  gatewayMode: "embedded" | "native"
  contactName: string
  contactPhone?: string
}): Promise<CheckoutWarmEntry> {
  const w = entry(opts.cartId, opts.fingerprint)
  if (w.order && w.phase === "ready") return Promise.resolve(w)
  if (w.phase === "submit" && w.promise) return w.promise

  w.phase = "submit"
  w.error = null
  const run = (async () => {
    try {
      let quote = w.quote
      if (!quote || w.fingerprint !== opts.fingerprint) {
        const d = await api(opts.fetcher, "/api/hub/checkout/preview", {
          source: { kind: "cart", cartId: opts.cartId },
        })
        if (w.phase !== "submit") return w
        quote = d.quote as MarketplaceQuote
        w.quote = quote
      }
      if (!quote?.checkoutReady) {
        w.phase = "idle"
        return w
      }
      const online = quote.methods.find((m) => m.rail === "yookassa")
      if (!online) {
        w.phase = "idle"
        return w
      }
      if (!opts.contactName.trim()) {
        w.phase = "idle"
        return w
      }
      const body: MarketplaceSubmit = {
        quoteId: quote.id,
        idempotencyKey: opts.uuid(),
        rail: "yookassa",
        contactName: opts.contactName.trim(),
        contactPhone: opts.contactPhone?.trim() || "",
        gatewayMode: opts.gatewayMode,
        lineFormAnswers: {},
        note: "",
        deliveryAddressLine: "",
      }
      const d = await api(opts.fetcher, "/api/hub/checkout", body)
      if (w.phase !== "submit") return w
      w.order = d.order as MarketplaceOrder
      w.phase = "ready"
      w.error = null
      convertedCarts.add(opts.cartId)
      return w
    } catch (e) {
      if (w.phase !== "submit") return w
      const msg = (e as Error).message
      if (msg === "CART_CONVERTED") convertedCarts.add(opts.cartId)
      w.error = msg
      w.phase = "error"
      return w
    } finally {
      if (w.promise === run && w.phase !== "ready" && w.phase !== "submit") w.promise = null
    }
  })()
  w.promise = run
  return run
}

/** Checkout takes ownership after it has applied quote/order into hook state. */
export function consumeCheckoutWarm(cartId: string): CheckoutWarmEntry | null {
  const w = warmByCart.get(cartId) || null
  if (w) warmByCart.delete(cartId)
  // Keep convertedCarts — preview must stay suppressed after consume.
  return w
}
