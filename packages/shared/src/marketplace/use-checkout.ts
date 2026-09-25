import { useCallback, useEffect, useRef, useState } from "react"
import type {
  MarketplaceOrder,
  MarketplaceQuote,
  MarketplacePreviewInput,
  MarketplaceSubmit,
  PurchaseSource,
  FulfillmentMode,
} from "./types"
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
    setReady(false)
    setOrder(null)
    setQuote(null)
    pending.current = null
    storage
      .getItem(key)
      .then(async (raw) => {
        if (!active) return
        if (raw) {
          const value = JSON.parse(raw)
          if (value.orderId) {
            try {
              const d = await api(`/api/hub/orders/${value.orderId}`)
              if (active) setOrder(d.order)
            } catch (e) {
              if ((e as any).status === 404) await storage.removeItem(key)
              else throw e
            }
          } else if (value.pending) pending.current = value.pending
        }
      })
      .catch(() => {
        if (active) setError("RESUME_FAILED")
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [key, api, storage])
  useEffect(() => {
    if (!contactName && initialName) setContactName(initialName)
    if (!contactPhone && initialPhone) setContactPhone(initialPhone)
  }, [initialName, initialPhone])
  useEffect(() => {
    if (!ready || order || pending.current) return
    const version = ++request.current
    setQuote(null)
    setError("")
    const timer = setTimeout(() => {
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
          setMethodId((prev) =>
            d.quote.methods.some((m: any) => m.id === prev) ? prev : d.quote.methods[0]?.id || "",
          )
        })
        .catch((e) => {
          if (version === request.current) setError(e.message)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      request.current++
    }
  }, [sourceKey, payCurrency, fulfillmentMode, deliveryZoneId, ready, order, revision, api])
  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      void refresh().catch(() => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [order?.id, refresh])
  async function submit() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      if (!pending.current) {
        if (!quote) throw new Error("QUOTE_EXPIRED")
        const method = quote.methods.find((m) => m.id === methodId)
        if (!method) throw new Error("INVALID_PAYMENT_METHOD")
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
    setPayCurrency,
    fulfillmentMode,
    setFulfillmentMode,
    deliveryZoneId,
    setDeliveryZoneId,
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
    refresh,
    newPurchase,
    api,
    saveOrder,
    hasPending: !!pending.current,
  }
}
