import { useCallback, useEffect, useRef, useState } from "react"
import type {
  MarketplaceOrder,
  MarketplaceQuote,
  MarketplacePreviewInput,
  MarketplaceSubmit,
  PurchaseSource,
  FulfillmentMode,
} from "./types"
import { consumeCheckoutWarm, peekCheckoutWarm, shouldSkipCartPreview, markCartConverted } from "./checkout-warm"
export type {
  MarketplaceOrder,
  MarketplaceQuote,
  MarketplacePreviewInput,
  MarketplaceSubmit,
  PurchaseSource,
  FulfillmentMode,
} from "./types"
export interface CheckoutStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
export function useMarketplaceCheckout({
  source,
  fetcher,
  storage,
  uuid,
  gatewayMode,
  userId,
  initialName = "",
  initialPhone = "",
}: {
  source: PurchaseSource
  userId?: string
  fetcher: (path: string, init?: RequestInit) => Promise<Response>
  storage: CheckoutStorage
  uuid: () => string
  gatewayMode: "embedded" | "native"
  initialName?: string
  initialPhone?: string
}) {
  const [quote, setQuote] = useState<MarketplaceQuote | null>(null),
    [order, setOrder] = useState<MarketplaceOrder | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false)
  const [payCurrency, setPayCurrency] = useState(""),
    [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode | undefined>(),
    [deliveryZoneId, setDeliveryZoneId] = useState(""),
    [methodId, setMethodId] = useState("")
  const [contactName, setContactName] = useState(initialName),
    [contactPhone, setContactPhone] = useState(initialPhone),
    [address, setAddress] = useState(""),
    [note, setNote] = useState(""),
    [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>({})
  const sourceKey = JSON.stringify(source),
    key = `marketplace:checkout:${userId || "anonymous"}:${source.kind === "cart" ? source.cartId : source.kind === "product" ? source.hubProductId : source.expertServiceSlotId}`
  const pending = useRef<MarketplaceSubmit | null>(null),
    request = useRef(0),
    [revision, setRevision] = useState(0)
  const api = useCallback(
    async (path: string, body?: unknown) => {
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
    },
    [fetcher],
  )
  const saveOrder = useCallback(
    async (o: MarketplaceOrder) => {
      setOrder(o)
      pending.current = null
      await storage.setItem(key, JSON.stringify({ orderId: o.id }))
    },
    [storage, key],
  )
  const refresh = useCallback(async () => {
    if (order) {
      const data = await api(`/api/hub/orders/${order.id}`)
      setOrder(data.order)
    }
  }, [api, order?.id])
  useEffect(() => {
    let active = true
    setError("")
    setQuote(null)
    setOrder(null)
    pending.current = null
    // Cart checkout hydrates from warm/storage first — preview before that → CART_CONVERTED.
    if (source.kind === "cart") setReady(false)
    else setReady(true)

    const cartId = source.kind === "cart" ? source.cartId : null
    let warmPromise: Promise<unknown> | null = null

    const applyWarm = (entry: NonNullable<ReturnType<typeof peekCheckoutWarm>>) => {
      if (!active || !cartId) return
      if (entry.quote) {
        setQuote(entry.quote)
        const online = entry.quote.methods.find((m) => m.rail === "yookassa")
        setMethodId(online?.id || entry.quote.methods[0]?.id || "")
      }
      if (entry.order) {
        setOrder(entry.order)
        pending.current = null
        void storage.setItem(key, JSON.stringify({ orderId: entry.order.id }))
        markCartConverted(cartId)
        queueMicrotask(() => {
          if (active) consumeCheckoutWarm(cartId)
        })
      }
    }

    const resumeStorage = async () => {
      try {
        const raw = await storage.getItem(key)
        if (!active || !raw) return
        let value: { orderId?: string; pending?: MarketplaceSubmit }
        try {
          value = JSON.parse(raw)
        } catch {
          await storage.removeItem(key)
          return
        }
        // Never restore a mid-flight pending submit — it blocks preview and
        // auto-pay retries a stale payload (CONTACT_NAME_REQUIRED / QUOTE_EXPIRED).
        if (value.pending && !value.orderId) {
          await storage.removeItem(key)
          return
        }
        if (!value.orderId) return
        try {
          const d = await api(`/api/hub/orders/${value.orderId}`)
          if (!active) return
          const o = d.order as MarketplaceOrder
          const open = o.nextAction === "pay" || o.nextAction === "checking"
          if (open) {
            setOrder(o)
            if (cartId) markCartConverted(cartId)
          } else await storage.removeItem(key)
        } catch (e) {
          await storage.removeItem(key)
          void e
        }
      } catch {
        /* ignore storage read failures */
      }
    }

    ;(async () => {
      if (cartId) {
        const warm = peekCheckoutWarm(cartId)
        if (warm?.quote || warm?.order) applyWarm(warm)
        if (warm?.promise) {
          warmPromise = warm.promise.then((entry) => applyWarm(entry))
          await warmPromise
        }
        await resumeStorage()
        if (active) setReady(true)
        return
      }
      await resumeStorage()
    })()

    return () => {
      active = false
      void warmPromise
    }
  }, [key, api, storage, sourceKey])
  useEffect(() => {
    if (!contactName && initialName) setContactName(initialName)
    if (!contactPhone && initialPhone) setContactPhone(initialPhone)
  }, [initialName, initialPhone])
  useEffect(() => {
    if (!ready || order || pending.current) return
    // Warm quote/submit owns networking for this cart — duplicate preview → CART_CONVERTED 409.
    if (source.kind === "cart" && shouldSkipCartPreview(source.cartId)) return
    // Already hydrated a quote from warm — don't re-preview unless options change (quote cleared).
    if (quote) return
    const version = ++request.current
    setError("")
    const timer = setTimeout(() => {
      if (source.kind === "cart" && shouldSkipCartPreview(source.cartId)) return
      const input: MarketplacePreviewInput = {
        source: JSON.parse(sourceKey),
        payCurrency: payCurrency || undefined,
        fulfillmentMode,
        deliveryZoneId: deliveryZoneId || undefined,
      }
      api("/api/hub/checkout/preview", input)
        .then((d) => {
          if (version !== request.current) return
          setQuote(d.quote)
          setMethodId((prev) => {
            if (d.quote.methods.some((m: any) => m.id === prev)) return prev
            const online = d.quote.methods.find((m: any) => m.rail === "yookassa")
            return online?.id || d.quote.methods[0]?.id || ""
          })
        })
        .catch((e) => {
          if (version !== request.current) return
          if (source.kind === "cart" && (e as Error).message === "CART_CONVERTED") {
            markCartConverted(source.cartId)
            return
          }
          setError((e as Error).message)
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      request.current++
    }
  }, [sourceKey, payCurrency, fulfillmentMode, deliveryZoneId, ready, order, quote, revision, api, source])
  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      void refresh().catch(() => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [order?.id, refresh])
  async function submit(opts?: { methodId?: string }): Promise<MarketplaceOrder | undefined> {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      if (!pending.current) {
        if (!quote) throw new Error("QUOTE_EXPIRED")
        const id = opts?.methodId || methodId
        const method = quote.methods.find((m) => m.id === id)
        if (!method) throw new Error("INVALID_PAYMENT_METHOD")
        if (opts?.methodId) setMethodId(opts.methodId)
        pending.current = {
          quoteId: quote.id,
          idempotencyKey: uuid(),
          rail: method.rail,
          paymentMethodId: method.rail === "manual" ? method.id : undefined,
          contactName,
          contactPhone,
          deliveryAddressLine: address,
          note,
          lineFormAnswers: answers,
          gatewayMode,
        }
        await storage.setItem(key, JSON.stringify({ pending: pending.current }))
      }
      const data = await api("/api/hub/checkout", pending.current)
      await saveOrder(data.order)
      return data.order as MarketplaceOrder
    } catch (e) {
      setError((e as Error).message)
      if ((e as any).status >= 400 && (e as any).status < 500) {
        pending.current = null
        await storage.removeItem(key)
        setRevision((v) => v + 1)
      }
    } finally {
      setBusy(false)
    }
  }
  async function action(path: string, body: unknown) {
    if (!order) return
    setBusy(true)
    setError("")
    try {
      const d = await api(`/api/hub/orders/${order.id}/${path}`, body)
      if (d.order) await saveOrder(d.order)
      return d
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function uploadProof(
    file: { blob: Blob; name: string; type: string },
    opts?: { order?: MarketplaceOrder; attemptId?: string },
  ) {
    const o = opts?.order || order
    if (!o) throw new Error("ORDER_REQUIRED")
    const a =
      o.attempts.find((x) => x.id === opts?.attemptId) ||
      o.attempts.find((x) => x.rail === "manual") ||
      o.attempts[0]
    if (!a) throw new Error("ATTEMPT_REQUIRED")
    setBusy(true)
    setError("")
    try {
      if (file.blob.size > 10 * 1024 * 1024) throw new Error("INVALID_PROOF")
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const init = await api(`/api/hub/orders/${o.id}/payment-proof`, {
        attemptId: a.id,
        extension: ext,
      })
      const response = await fetch(init.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file.blob,
      })
      if (!response.ok) throw new Error("UPLOAD_FAILED")
      const done = await api(`/api/hub/orders/${o.id}/payment-proof`, {
        attemptId: a.id,
        path: init.path,
      })
      if (done.order) await saveOrder(done.order)
      else {
        const refreshed = await api(`/api/hub/orders/${o.id}`)
        await saveOrder(refreshed.order)
      }
      return done
    } catch (e) {
      setError((e as Error).message)
      throw e
    } finally {
      setBusy(false)
    }
  }
  async function newPurchase() {
    await storage.removeItem(key)
    pending.current = null
    setOrder(null)
    setRevision((v) => v + 1)
  }
  return {
    quote,
    order,
    error,
    busy,
    ready,
    payCurrency,
    setPayCurrency: (v: string) => {
      setQuote(null)
      setPayCurrency(v)
    },
    fulfillmentMode,
    setFulfillmentMode: (v: FulfillmentMode | undefined) => {
      setQuote(null)
      setFulfillmentMode(v)
    },
    deliveryZoneId,
    setDeliveryZoneId: (v: string) => {
      setQuote(null)
      setDeliveryZoneId(v)
    },
    methodId,
    setMethodId,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    address,
    setAddress,
    note,
    setNote,
    answers,
    setAnswers,
    submit,
    action,
    uploadProof,
    refresh,
    newPurchase,
    api,
    saveOrder,
    hasPending: !!pending.current,
  }
}
