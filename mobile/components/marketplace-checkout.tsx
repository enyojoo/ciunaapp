import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Crypto from "expo-crypto"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  useMarketplaceCheckout,
  type MarketplaceOrder,
  type PurchaseSource,
} from "@ciuna/shared/marketplace/use-checkout"
import { invalidateCheckoutWarm } from "@ciuna/shared/marketplace/checkout-warm"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { MarketplacePayStep, type MarketplacePayTab } from "@/components/marketplace-pay-step"
import { useToast } from "@/components/toast-provider"
import { prefetchYooKassaWidgetScript } from "@/components/yookassa-checkout-widget"
import { startYooKassaPayment, resumeYooKassaPayment, isYooKassaNativeAvailable } from "@/lib/yookassa-native"
import { hubCartPath } from "@/lib/hub"
import { refreshHubCartByLine } from "@/lib/hub-cart"
import { formatMoney } from "@/lib/money"
import { colors, radius, space, type as typeSize, ui } from "@/lib/theme"

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceActive]}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>{label}</Text>
    </Pressable>
  )
}

function isOpenPay(order: MarketplaceOrder) {
  return order.nextAction === "pay" || order.nextAction === "checking"
}

type ReceiptAsset = {
  uri: string
  name: string
  mimeType?: string | null
  size?: number | null
}

function SummaryCard({
  title,
  publicId,
  lines,
  totals,
  fulfillmentMode,
  paymentState,
  label,
}: {
  title: string
  publicId?: string
  lines: { id: string; quantity: number; title: string; unitPrice: number }[]
  totals: {
    productCurrency: string
    payCurrency: string
    marketplaceFee: number
    deliveryFee: number
    corridorFee: number
    total: number
  }
  fulfillmentMode?: string
  paymentState?: string
  label: (key: string, fallback: string) => string
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>{title}</Text>
      {!!publicId && <Text style={styles.summaryId}>{publicId}</Text>}
      <View style={styles.summaryLines}>
        {lines.map((l) => (
          <View key={l.id} style={styles.summaryLine}>
            <Text style={styles.summaryLineText} numberOfLines={2}>
              {l.quantity} × {l.title}
            </Text>
            <Text style={styles.summaryLineAmount}>
              {formatMoney(l.unitPrice * l.quantity, totals.productCurrency)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.feeBlock}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>{label("serviceFee", "Service fee")}</Text>
          <Text style={styles.feeValue}>
            {formatMoney(totals.marketplaceFee, totals.productCurrency)}
          </Text>
        </View>
        {fulfillmentMode === "delivery" ? (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{label("deliveryFee", "Delivery fee")}</Text>
            <Text style={styles.feeValue}>
              {formatMoney(totals.deliveryFee, totals.productCurrency)}
            </Text>
          </View>
        ) : null}
        {!!totals.corridorFee ? (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{label("conversionFee", "Conversion fee")}</Text>
            <Text style={styles.feeValue}>
              {formatMoney(totals.corridorFee, totals.payCurrency)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{label("total", "Total to pay")}</Text>
        <Text style={styles.totalValue}>{formatMoney(totals.total, totals.payCurrency)}</Text>
      </View>
      {paymentState ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusText}>
            {label("payment", "Payment")}: {label(paymentState, paymentState)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export function MarketplaceCheckout({
  source,
  customAmount = false,
  seed,
}: {
  source: PurchaseSource
  customAmount?: boolean
  /** Instant paint from cart/product while quote loads. */
  seed?: {
    title: string
    lines: { id: string; quantity: number; title: string; unitPrice: number }[]
    currency: string
    total?: number
  }
}) {
  const { profile } = useAuth(),
    { t } = useTranslation("app"),
    router = useRouter(),
    { showInfo } = useToast(),
    [amount, setAmount] = useState(""),
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [receiptFile, setReceiptFile] = useState<ReceiptAsset | null>(null),
    [leaving, setLeaving] = useState(false)
  const autoOnline = useRef(false)
  const actual =
    source.kind === "product" && customAmount ? { ...source, fundedAmount: Number(amount) } : source
  const c = useMarketplaceCheckout({
    source: actual,
    userId: profile?.id,
    fetcher: fetchWithAuth,
    storage: AsyncStorage,
    uuid: Crypto.randomUUID,
    gatewayMode: Platform.OS === "web" ? "embedded" : "native",
    initialName:
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.email?.split("@")[0] ||
      "",
    initialPhone: profile?.phone || "",
  })
  const label = (key: string, fallback: string) => t(`marketplace.${key}`, { defaultValue: fallback })
  const paying = !!(c.order && isOpenPay(c.order)) || leaving
  const doneOrder = !leaving && !!(c.order && !isOpenPay(c.order))
  const q = c.quote
  const snap = c.order?.snapshot
  const methods = snap?.methods || q?.methods || []
  const methodKey = methods.map((m) => `${m.id}:${m.rail}`).join(",")
  const attempt = c.order?.attempts[0]
  const seedTotals = seed
    ? {
        productCurrency: seed.currency,
        payCurrency: seed.currency,
        marketplaceFee: 0,
        deliveryFee: 0,
        corridorFee: 0,
        total:
          seed.total ??
          seed.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      }
    : null
  const totals = snap?.totals || q?.totals || seedTotals
  const fulfillmentMode = snap?.fulfillmentMode || q?.fulfillmentMode
  const modes = snap?.modes || q?.modes || []
  const title = snap?.title || q?.title || seed?.title || ""
  const lines = snap?.lines || q?.lines || seed?.lines || []
  const destHeading =
    fulfillmentMode === "delivery"
      ? label("deliveryDetails", "Delivery details")
      : fulfillmentMode === "pickup"
        ? label("pickupDetails", "Pickup details")
        : label("contactDetails", "Your details")
  const canAct =
    !!paying ||
    (!!q?.checkoutReady &&
      !!c.contactName.trim() &&
      (!q.requirePhone || !!c.contactPhone.trim()) &&
      (q.fulfillmentMode !== "delivery" || (!!c.deliveryZoneId && !!c.address.trim())))
  const activePayTab: MarketplacePayTab =
    methods.some((m) => m.rail === "yookassa")
      ? payTab === "manual"
        ? "manual"
        : "yookassa"
      : "manual"
  const onlinePayment =
    attempt?.rail === "yookassa" && attempt.confirmation_token
      ? { transactionId: c.order!.public_id, confirmationToken: attempt.confirmation_token }
      : null
  const gatewayMode = Platform.OS === "web" ? "embedded" : "native"
  const moneyLabel = totals ? formatMoney(totals.total, totals.payCurrency) : ""
  const onlineCreating =
    activePayTab === "yookassa" &&
    !onlinePayment?.confirmationToken &&
    !!(
      canAct ||
      c.busy ||
      autoOnline.current ||
      !!seed ||
      !q ||
      (!!q.checkoutReady && !!c.contactName.trim())
    )
  /** Placeholder so pay frame paints immediately from cart before quote returns. */
  const payMethods =
    methods.length > 0
      ? methods
      : seed
        ? [
            {
              id: "_pending_online",
              rail: "yookassa" as const,
              name: "Pay online",
              currency: seed.currency,
              instructions: {},
            },
          ]
        : []

  useEffect(() => {
    prefetchYooKassaWidgetScript()
  }, [])

  useEffect(() => {
    if (!methods.length) return
    const hasOnline = methods.some((m) => m.rail === "yookassa")
    const hasManual = methods.some((m) => m.rail === "manual")
    if (attempt?.rail === "yookassa" || (!attempt && hasOnline)) setPayTab("yookassa")
    else if (hasManual) setPayTab("manual")
  }, [methodKey, attempt?.rail, attempt?.id])

  useEffect(() => {
    autoOnline.current = false
  }, [q?.id])

  useEffect(() => {
    if (doneOrder || paying || !q || activePayTab !== "yookassa") return
    if (!q.methods.some((m) => m.rail === "yookassa")) return
    if (!canAct || c.busy || !c.contactName.trim()) return
    if (onlinePayment?.confirmationToken) return
    if (autoOnline.current) return
    autoOnline.current = true
    void handlePay().then((order) => {
      const token = order?.attempts?.[0]?.confirmation_token
      if (!order || (Platform.OS === "web" && !token)) autoOnline.current = false
    })
  }, [q?.id, canAct, activePayTab, paying, doneOrder, c.busy, c.contactName, onlinePayment?.confirmationToken])

  if (doneOrder)
    return (
      <>
        <MarketplaceOrderView order={c.order!} onChange={c.saveOrder} />
        {["fulfilled", "cancelled"].includes(c.order!.fulfillment_state) && source.kind !== "cart" ? (
          <View style={styles.footerPad}>
            <PrimaryButton
              label={label("newPurchase", "Make another purchase")}
              onPress={() => void c.newPurchase()}
            />
          </View>
        ) : null}
      </>
    )

  async function selectTab(tab: MarketplacePayTab) {
    setPayTab(tab)
    if (tab === "yookassa") {
      const online = methods.find((m) => m.rail === "yookassa")
      if (online) c.setMethodId(online.id)
      if (c.order && c.order.nextAction === "pay" && attempt?.rail !== "yookassa") {
        await c.action("payment-attempts", { rail: "yookassa", gatewayMode })
      }
      return
    }
    const manuals = methods.filter((m) => m.rail === "manual")
    const pick = manuals.find((m) => m.id === c.methodId) || manuals[0]
    if (pick) c.setMethodId(pick.id)
    if (c.order && c.order.nextAction === "pay" && attempt?.rail !== "manual") {
      await c.action("payment-attempts", {
        rail: "manual",
        paymentMethodId: pick?.id,
        gatewayMode,
      })
    }
  }

  async function handlePay() {
    if (c.order && c.order.nextAction === "pay") {
      if (attempt?.rail !== "yookassa") {
        await c.action("payment-attempts", { rail: "yookassa", gatewayMode })
      } else if (Platform.OS !== "web") {
        await nativePay(c.order, attempt)
      }
      return c.order
    }
    const online = methods.find((m) => m.rail === "yookassa")
    const order = await c.submit(online ? { methodId: online.id } : undefined)
    if (order && Platform.OS !== "web") {
      const a = order.attempts[0]
      if (a?.rail === "yookassa") await nativePay(order, a)
    }
    return order
  }

  async function nativePay(order: MarketplaceOrder, a: MarketplaceOrder["attempts"][0]) {
    try {
      if (!isYooKassaNativeAvailable()) throw Error("NATIVE_BUILD_REQUIRED")
      if (a.confirmation_mode === "embedded") {
        await Linking.openURL(`https://app.ciuna.com/hub/orders/${order.public_id}`)
      } else if (a.confirmation_url && a.native_payment_type) {
        await resumeYooKassaPayment(a.confirmation_url, a.native_payment_type)
      } else if (a.state === "created") {
        await startYooKassaPayment({
          transactionId: order.public_id,
          attemptId: a.id,
          amount: order.snapshot.totals.total,
          currency: order.snapshot.totals.payCurrency,
          shopName: "Ciuna",
          description: order.snapshot.title,
        })
      }
      await c.refresh()
    } catch {
      /* surfaced via order state */
    }
  }

  async function handleIvePaid() {
    if (!receiptFile) return
    let order = c.order
    if (!order) {
      const manuals = methods.filter((m) => m.rail === "manual")
      const pick = manuals.find((m) => m.id === c.methodId) || manuals[0]
      order = (await c.submit(pick ? { methodId: pick.id } : undefined)) || null
    } else if (order.nextAction === "pay" && attempt?.rail !== "manual") {
      const pick = methods.find((m) => m.id === c.methodId && m.rail === "manual")
      await c.action("payment-attempts", {
        rail: "manual",
        paymentMethodId: pick?.id || c.methodId,
        gatewayMode,
      })
      order = c.order || order
    }
    if (!order) return
    const blob = await (await fetch(receiptFile.uri)).blob()
    await c.uploadProof(
      {
        blob,
        name: receiptFile.name,
        type: receiptFile.mimeType || "application/octet-stream",
      },
      { order },
    )
    setReceiptFile(null)
  }

  return (
    <ScreenScroll keyboard edges={["left", "right", "bottom"]} contentStyle={styles.scroll}>
      {!!c.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {t(`marketplace.errors.${c.error}`, {
              defaultValue: label("retryError", "We could not complete that step. Please try again."),
            })}
          </Text>
        </View>
      )}

      {customAmount && !paying && (
        <Field
          label={label("amount", "Amount")}
          accessibilityLabel={label("amount", "Amount")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      )}

      {!q && !c.order && !c.error && !seed ? (
        <View style={styles.boot}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {(q || snap || seed) && totals && (
        <View style={styles.stack}>
          <SummaryCard
            title={title}
            publicId={c.order?.public_id}
            lines={lines}
            totals={totals}
            fulfillmentMode={fulfillmentMode}
            paymentState={paying && c.order ? c.order.payment_state : undefined}
            label={label}
          />

          {!paying && (q || seed) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{destHeading}</Text>
              <View style={styles.sectionCard}>
                {q && modes.length > 1 && (
                  <View style={styles.blockGap}>
                    <Text style={styles.fieldLabel}>{label("fulfillment", "How you get it")}</Text>
                    {modes.map((mode) => (
                      <Choice
                        key={mode}
                        label={label(mode, mode)}
                        selected={q.fulfillmentMode === mode}
                        onPress={() => c.setFulfillmentMode(mode)}
                      />
                    ))}
                  </View>
                )}

                {q && !!q.slotStart && (
                  <Text style={styles.meta}>
                    {new Date(q.slotStart).toLocaleString(undefined, { timeZone: q.timezone })} —{" "}
                    {new Date(q.slotEnd!).toLocaleTimeString(undefined, { timeZone: q.timezone })} (
                    {q.timezone})
                  </Text>
                )}

                {q?.fulfillmentMode === "pickup" && (
                  <View style={styles.infoBlock}>
                    {!!q.pickupLocation && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label("pickupLocation", "Pickup location")}</Text>
                        <Text style={styles.infoValue}>{q.pickupLocation}</Text>
                      </View>
                    )}
                    {!!q.pickupHours && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label("pickupHours", "Pickup hours")}</Text>
                        <Text style={styles.infoValue}>{q.pickupHours}</Text>
                      </View>
                    )}
                    {!!q.fulfillmentNotes && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label("fulfillmentNotes", "Notes")}</Text>
                        <Text style={styles.infoValue}>{q.fulfillmentNotes}</Text>
                      </View>
                    )}
                    {!q.pickupLocation && !q.pickupHours && !!q.instructions && (
                      <Text style={styles.infoValue}>{q.instructions}</Text>
                    )}
                  </View>
                )}

                {q?.fulfillmentMode === "delivery" && (
                  <View style={styles.blockGap}>
                    <Text style={styles.fieldLabel}>{label("zone", "Delivery area")}</Text>
                    {q.zones.length === 0 ? (
                      <Text style={styles.warn}>{label("noZones", "Delivery is not available for this store yet.")}</Text>
                    ) : (
                      q.zones.map((z) => (
                        <Choice
                          key={z.id}
                          label={`${z.city} · ${z.district} · ${formatMoney(z.fee, z.currency)}`}
                          selected={c.deliveryZoneId === z.id}
                          onPress={() => c.setDeliveryZoneId(z.id)}
                        />
                      ))
                    )}
                    {!c.deliveryZoneId && q.zones.length > 0 && (
                      <Text style={styles.meta}>{label("chooseZone", "Choose a delivery area")}</Text>
                    )}
                    <Field
                      label={label("address", "Delivery address")}
                      accessibilityLabel={label("address", "Delivery address")}
                      value={c.address}
                      onChangeText={c.setAddress}
                    />
                  </View>
                )}

                {(q?.fulfillmentMode === "digital" || (!q && seed)) && (
                  <Text style={styles.note}>
                    {label(
                      "digitalAccessNote",
                      "Access and purchase details will be available on your order after payment.",
                    )}
                  </Text>
                )}

                {q
                  ? q.lines.map((l) =>
                      l.fields.map((f) => (
                        <View key={`${l.id}:${f.key}`}>
                          {f.type === "select" ? (
                            <View style={styles.blockGap}>
                              <Text style={styles.fieldLabel}>{f.label}</Text>
                              {f.options?.map((o) => (
                                <Choice
                                  key={o.value}
                                  label={o.label}
                                  selected={c.answers[l.id]?.[f.key] === o.value}
                                  onPress={() =>
                                    c.setAnswers((a) => ({
                                      ...a,
                                      [l.id]: { ...a[l.id], [f.key]: o.value },
                                    }))
                                  }
                                />
                              ))}
                            </View>
                          ) : (
                            <Field
                              label={`${l.title} · ${f.label}${f.required ? " *" : ""}`}
                              accessibilityLabel={f.label}
                              multiline={f.type === "textarea"}
                              keyboardType={f.type === "number" ? "decimal-pad" : "default"}
                              value={String(c.answers[l.id]?.[f.key] ?? "")}
                              onChangeText={(v) =>
                                c.setAnswers((a) => ({
                                  ...a,
                                  [l.id]: {
                                    ...a[l.id],
                                    [f.key]: f.type === "number" ? Number(v) : v,
                                  },
                                }))
                              }
                            />
                          )}
                        </View>
                      )),
                    )
                  : null}

                <Field
                  label={label("note", "Order note")}
                  accessibilityLabel={label("note", "Order note")}
                  value={c.note}
                  onChangeText={c.setNote}
                  multiline
                />

                {q && !q.checkoutReady && (
                  <Text style={styles.warn}>
                    {label(
                      "unavailable",
                      "Choose the required options. Checkout may not yet be available for this offering.",
                    )}
                  </Text>
                )}
              </View>
            </View>
          )}

          {payMethods.length > 0 && (
            <MarketplacePayStep
              methods={payMethods}
              payTab={activePayTab}
              onPayTab={(tab) => void selectTab(tab)}
              methodId={c.methodId}
              onMethodId={(id) => {
                c.setMethodId(id)
                if (c.order && c.order.nextAction === "pay") {
                  void c.action("payment-attempts", {
                    rail: "manual",
                    paymentMethodId: id,
                    gatewayMode,
                  })
                }
              }}
              amount={totals.total}
              currency={totals.payCurrency}
              amountLabel={moneyLabel}
              reference={c.order?.public_id}
              onlinePayment={Platform.OS === "web" ? onlinePayment : null}
              proofSubmitted={attempt?.state === "proof_submitted"}
              receiptFile={receiptFile}
              onReceiptFile={setReceiptFile}
              busy={c.busy}
              canAct={canAct}
              onPay={() => void handlePay()}
              onIvePaid={() => void handleIvePaid()}
              onWidgetCompleted={() => void c.refresh()}
              onWidgetFailed={() => void c.refresh()}
              hideOnlineCta
              onlineCreating={onlineCreating}
              showNativePay={Platform.OS !== "web" && !!c.order && attempt?.rail === "yookassa"}
              onNativePay={() => {
                if (c.order && attempt) void nativePay(c.order, attempt)
              }}
            />
          )}

          {(paying || leaving) && (c.order?.canCancel || leaving) ? (
            <PrimaryButton
              label={label("cancel", "Cancel order")}
              variant="secondary"
              busy={c.busy || leaving}
              disabled={leaving}
              onPress={() => {
                void (async () => {
                  const slug = (c.order?.line || "mart") as "food" | "mart"
                  if (source.kind === "cart") setLeaving(true)
                  const result = await c.action("cancel", {})
                  if (!result?.order) {
                    setLeaving(false)
                    return
                  }
                  if (source.kind !== "cart") return
                  invalidateCheckoutWarm(source.cartId)
                  showInfo(label("orderCancelled", "Order cancelled"))
                  await refreshHubCartByLine(slug)
                  await c.newPurchase()
                  router.replace(hubCartPath(slug) as never)
                })()
              }}
            />
          ) : null}
        </View>
      )}
    </ScreenScroll>
  )
}

export function MarketplaceOrderView({
  order: initial,
  onChange,
}: {
  order: MarketplaceOrder
  onChange?: (order: MarketplaceOrder) => unknown
}) {
  const [order, setOrder] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [methodId, setMethodId] = useState(""),
    [receiptFile, setReceiptFile] = useState<ReceiptAsset | null>(null),
    { t } = useTranslation("app")
  const label = (key: string, fallback: string) => t(`marketplace.${key}`, { defaultValue: fallback })
  const methods = order.snapshot.methods
  const attempt = order.attempts[0]
  const methodKey = methods.map((m) => `${m.id}:${m.rail}`).join(",")
  const gatewayMode = Platform.OS === "web" ? "embedded" : "native"

  async function load() {
    const r = await fetchWithAuth(`/api/hub/orders/${initial.id}`)
    if (r.ok) {
      const d = await r.json()
      setOrder(d.order)
      onChange?.(d.order)
    }
  }
  useEffect(() => {
    setOrder(initial)
  }, [initial])
  useEffect(() => {
    const timer = setInterval(() => void load(), 5000),
      subscription = AppState.addEventListener("change", (s) => {
        if (s === "active") void load()
      })
    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, [initial.id])
  useEffect(() => {
    const hasOnline = methods.some((m) => m.rail === "yookassa")
    const hasManual = methods.some((m) => m.rail === "manual")
    if (attempt?.rail === "yookassa" || (!attempt && hasOnline)) setPayTab("yookassa")
    else if (hasManual) setPayTab("manual")
    setMethodId(
      attempt?.rail === "yookassa"
        ? methods.find((m) => m.rail === "yookassa")?.id || ""
        : methods.find((m) => m.rail === "manual")?.id || methods[0]?.id || "",
    )
  }, [methodKey, attempt?.rail, attempt?.id])

  async function action(path: string, body: unknown = {}) {
    setBusy(true)
    setError("")
    try {
      const r = await fetchWithAuth(`/api/hub/orders/${order.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw Error(d.errorCode || d.error)
      await load()
      return d
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function uploadProof(file: ReceiptAsset) {
    const a = order.attempts[0]
    if (!a) return
    setBusy(true)
    setError("")
    try {
      if ((file.size || 0) > 10 * 1024 * 1024) throw Error("INVALID_PROOF")
      const init = await action("payment-proof", {
        attemptId: a.id,
        extension: file.name.split(".").pop()?.toLowerCase(),
      })
      if (!init) return
      const blob = await (await fetch(file.uri)).blob()
      const r = await fetch(init.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.mimeType || "application/octet-stream" },
        body: blob,
      })
      if (!r.ok) throw Error("UPLOAD_FAILED")
      await action("payment-proof", { attemptId: a.id, path: init.path })
      setReceiptFile(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function nativePay() {
    const a = order.attempts[0]
    if (!a) return
    setBusy(true)
    try {
      if (!isYooKassaNativeAvailable()) throw Error("NATIVE_BUILD_REQUIRED")
      if (a.confirmation_mode === "embedded") {
        await Linking.openURL(`https://app.ciuna.com/hub/orders/${order.public_id}`)
      } else if (a.confirmation_url && a.native_payment_type) {
        await resumeYooKassaPayment(a.confirmation_url, a.native_payment_type)
      } else if (a.state === "created") {
        await startYooKassaPayment({
          transactionId: order.public_id,
          attemptId: a.id,
          amount: order.snapshot.totals.total,
          currency: order.snapshot.totals.payCurrency,
          shopName: "Ciuna",
          description: order.snapshot.title,
        })
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const pay =
    order.nextAction === "pay" && !["failed", "superseded", "succeeded"].includes(attempt?.state || "")
  const onlinePayment =
    pay && attempt?.rail === "yookassa" && attempt.confirmation_token
      ? { transactionId: order.public_id, confirmationToken: attempt.confirmation_token }
      : null
  const activePayTab: MarketplacePayTab =
    methods.some((m) => m.rail === "yookassa")
      ? payTab === "manual"
        ? "manual"
        : "yookassa"
      : "manual"

  return (
    <ScreenScroll keyboard edges={["left", "right", "bottom"]} contentStyle={styles.scroll}>
      <View style={styles.stack}>
        <SummaryCard
          title={order.snapshot.title}
          publicId={order.public_id}
          lines={order.snapshot.lines}
          totals={order.snapshot.totals}
          fulfillmentMode={order.fulfillment_mode}
          paymentState={order.payment_state}
          label={label}
        />
        <Text style={styles.meta}>
          {label("fulfillment", "Fulfillment")}: {label(order.fulfillment_state, order.fulfillment_state)}
        </Text>
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {t(`marketplace.errors.${error}`, {
                defaultValue: label("retryError", "We could not complete that step. Please try again."),
              })}
            </Text>
          </View>
        )}
        {!!order.exception_reason && (
          <Text style={styles.warn}>{label("review", "Office is reviewing this order.")}</Text>
        )}

        {pay && methods.length > 0 && (
          <MarketplacePayStep
            methods={methods}
            payTab={activePayTab}
            onPayTab={(tab) => {
              setPayTab(tab)
              if (tab === "yookassa") {
                const online = methods.find((m) => m.rail === "yookassa")
                if (online) setMethodId(online.id)
                if (attempt?.rail !== "yookassa") {
                  void action("payment-attempts", { rail: "yookassa", gatewayMode })
                }
              } else {
                const pick = methods.find((m) => m.rail === "manual")
                if (pick) setMethodId(pick.id)
                if (attempt?.rail !== "manual") {
                  void action("payment-attempts", {
                    rail: "manual",
                    paymentMethodId: pick?.id,
                    gatewayMode,
                  })
                }
              }
            }}
            methodId={methodId}
            onMethodId={(id) => {
              setMethodId(id)
              void action("payment-attempts", {
                rail: "manual",
                paymentMethodId: id,
                gatewayMode,
              })
            }}
            amount={order.snapshot.totals.total}
            currency={order.snapshot.totals.payCurrency}
            amountLabel={formatMoney(order.snapshot.totals.total, order.snapshot.totals.payCurrency)}
            reference={order.public_id}
            onlinePayment={Platform.OS === "web" ? onlinePayment : null}
            proofSubmitted={attempt?.state === "proof_submitted"}
            receiptFile={receiptFile}
            onReceiptFile={setReceiptFile}
            busy={busy}
            canAct
            onPay={() => {
              if (attempt?.rail !== "yookassa") {
                void action("payment-attempts", { rail: "yookassa", gatewayMode })
              } else if (Platform.OS !== "web") {
                void nativePay()
              }
            }}
            onIvePaid={() => {
              if (receiptFile) void uploadProof(receiptFile)
            }}
            onWidgetCompleted={() => void load()}
            onWidgetFailed={() => void load()}
            hideOnlineCta
            onlineCreating={
              payTab === "yookassa" &&
              !(Platform.OS === "web" && onlinePayment?.confirmationToken) &&
              busy
            }
            showNativePay={Platform.OS !== "web" && attempt?.rail === "yookassa"}
            onNativePay={() => void nativePay()}
          />
        )}

        {!!order.digital_content && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{label("digitalDelivery", "Your digital purchase")}</Text>
            <Text selectable style={styles.infoValue}>
              {order.digital_content}
            </Text>
          </View>
        )}

        {order.events.map((e) => (
          <View key={e.id} style={styles.eventRow}>
            <Text style={styles.eventTitle}>
              {t(`marketplace.events.${e.kind}`, { defaultValue: label("updated", "Order updated") })}
            </Text>
            <Text style={styles.meta}>{new Date(e.created_at).toLocaleString()}</Text>
          </View>
        ))}

        {order.canCancel && (
          <PrimaryButton
            label={label("cancel", "Cancel order")}
            variant="secondary"
            busy={busy}
            onPress={() => void action("cancel")}
          />
        )}
        <PrimaryButton
          label={label("support", "Contact support")}
          variant="ghost"
          onPress={() =>
            void Linking.openURL(`mailto:support@ciuna.com?subject=${encodeURIComponent(order.public_id)}`)
          }
        />
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 8 },
  stack: { gap: 20, paddingBottom: 16 },
  footerPad: { padding: 20 },
  loading: { fontSize: typeSize.body, color: colors.muted },
  boot: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  errorBox: {
    borderRadius: radius.row,
    backgroundColor: "#FEF2F2",
    padding: 14,
    marginBottom: 8,
  },
  errorText: { fontSize: typeSize.meta, color: colors.danger, fontWeight: "600" },
  summary: {
    ...ui.card,
    padding: 18,
    gap: 12,
  },
  summaryTitle: {
    fontSize: typeSize.label,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  summaryId: { fontSize: typeSize.meta, color: colors.muted },
  summaryLines: { gap: 8 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLineText: { flex: 1, fontSize: typeSize.body, color: colors.text, lineHeight: 22 },
  summaryLineAmount: {
    fontSize: typeSize.body,
    fontWeight: "600",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  feeBlock: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  feeLabel: { fontSize: typeSize.meta, color: colors.muted },
  feeValue: { fontSize: typeSize.meta, color: colors.muted, fontVariant: ["tabular-nums"] },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    paddingTop: 4,
  },
  totalLabel: { fontSize: typeSize.label, fontWeight: "700", color: colors.text },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  statusBlock: { gap: 4 },
  statusText: { fontSize: typeSize.meta, color: colors.muted },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: typeSize.label,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionCard: {
    ...ui.card,
    padding: 16,
    gap: 4,
  },
  blockGap: { gap: 8, marginBottom: 8 },
  fieldLabel: {
    fontSize: typeSize.meta,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  meta: { fontSize: typeSize.meta, color: colors.muted, lineHeight: 18 },
  note: {
    fontSize: typeSize.meta,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  warn: { fontSize: typeSize.meta, color: colors.primaryDeep, lineHeight: 18 },
  link: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary, marginVertical: 8 },
  currencyBlock: { marginTop: 4 },
  infoBlock: {
    gap: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
  },
  infoRow: { gap: 4 },
  infoLabel: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  infoValue: { fontSize: typeSize.body, color: colors.text, lineHeight: 22 },
  choice: {
    minHeight: space.tap,
    justifyContent: "center",
    borderRadius: radius.row,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: "#FFF7ED",
  },
  choiceLabel: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
  choiceLabelActive: { color: colors.primary },
  eventRow: { gap: 2 },
  eventTitle: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
})
