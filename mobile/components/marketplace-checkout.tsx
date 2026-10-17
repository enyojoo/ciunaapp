import { useEffect, useRef, useState } from "react"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { shortDay } from "@/lib/store-hours"
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Crypto from "expo-crypto"
import { useRouter } from "expo-router"
import { Image } from "expo-image"
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
import { OrderReviewCard } from "@/components/review-sheet"
import { OrderTimeline } from "@/components/order-timeline"
import { StepBar } from "@/components/step-bar"
import { OrderPlaceCard, OrderStatusHeader } from "@/components/order-status-header"
import { BookingSessionCard } from "@/components/booking-session-card"
import { SellerChatCard, StickyMessageSeller } from "@/components/seller-chat-card"
import { prefetchYooKassaWidgetScript } from "@/components/yookassa-checkout-widget"
import { startYooKassaPayment, resumeYooKassaPayment, isYooKassaNativeAvailable } from "@/lib/yookassa-native"
import { hubCartPath } from "@/lib/hub"
import { refreshHubCartByLine } from "@/lib/hub-cart"
import { formatMoney } from "@/lib/money"
import { colors, radius, space, type as typeSize, ui } from "@/lib/theme"

function Choice({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string
  /** A second, muted line: the fee and time, or the pickup hours. */
  hint?: string
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
      {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
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

function formatSlot(slot: { start: string; end?: string; timezone?: string }, locale: string): string {
  try {
    const tz = slot.timezone ? { timeZone: slot.timezone } : {}
    const start = new Date(slot.start).toLocaleString(locale, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", ...tz })
    const end = slot.end ? new Date(slot.end).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", ...tz }) : ""
    return [end ? start + " – " + end : start, slot.timezone ? "(" + slot.timezone + ")" : ""].filter(Boolean).join(" ")
  } catch {
    return ""
  }
}

function SummaryCard({
  title,
  publicId,
  lines,
  totals,
  fulfillmentMode,
  paymentState,
  label,
  slot,
  images,
  methodName,
  refund,
}: {
  /** Product photo per line, by product id. */
  images?: Record<string, string>
  /** The payment method the customer chose. */
  methodName?: string | null
  refund?: MarketplaceOrder["refund"]
  title: string
  publicId?: string
  /** Expert booking: when the session is, shown in its own time zone. */
  slot?: { start: string; end?: string; timezone?: string }
  lines: { id: string; productId?: string; quantity: number; title: string; unitPrice: number }[]
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
  const { i18n } = useTranslation("app")
  const slotText = slot ? formatSlot(slot, i18n.language) : ""
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>{title}</Text>
      {!!publicId && <Text style={styles.summaryId}>{publicId}</Text>}
      {slotText ? <Text style={styles.summarySlot}>{slotText}</Text> : null}
      <View style={styles.summaryLines}>
        {lines.map((l) => (
          <View key={l.id} style={styles.summaryLine}>
            {l.productId && images?.[l.productId] ? <Image source={{ uri: images[l.productId] }} style={styles.summaryPhoto} contentFit="cover" accessibilityIgnoresInvertColors /> : null}
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
        {totals.marketplaceFee > 0 || totals.deliveryFee > 0 || !!totals.corridorFee ? (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{label("subtotal", "Subtotal")}</Text>
            <Text style={styles.feeValue}>
              {formatMoney(lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0), totals.productCurrency)}
            </Text>
          </View>
        ) : null}
        {totals.marketplaceFee > 0 ? (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{label("serviceFee", "Service fee")}</Text>
            <Text style={styles.feeValue}>
              {formatMoney(totals.marketplaceFee, totals.productCurrency)}
            </Text>
          </View>
        ) : null}
        {fulfillmentMode === "pickup" ? (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{label("pickup", "Pickup")}</Text>
            <Text style={styles.feeValue}>{label("free", "Free")}</Text>
          </View>
        ) : null}
        {fulfillmentMode === "delivery" && totals.deliveryFee > 0 ? (
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
          {methodName ? (
            <Text style={styles.statusText}>
              {label("paidWith", "Payment method")}: {methodName}
            </Text>
          ) : null}
        </View>
      ) : null}
      {refund ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusText}>
            {refund.state === "completed" && refund.completedAt
              ? label("refundDone", "Refunded") + `: ${formatMoney(refund.amount, refund.currency)} · ${new Date(refund.completedAt).toLocaleDateString(i18n.language)}`
              : label("refundOnItsWay", "Refund on its way") + `: ${formatMoney(refund.amount, refund.currency)} · ${label("refundRequested", "requested")} ${new Date(refund.createdAt).toLocaleDateString(i18n.language)}`}
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
  onSlotUnavailable,
}: {
  source: PurchaseSource
  customAmount?: boolean
  /** Booking: the chosen time was taken by someone else; the caller returns to the time picker. */
  onSlotUnavailable?: () => void
  /** Instant paint from cart/product while quote loads. */
  seed?: {
    title: string
    lines: { id: string; quantity: number; title: string; unitPrice: number }[]
    currency: string
    total?: number
  }
}) {
  const { profile } = useAuth(),
    { t, i18n } = useTranslation("app"),
    router = useRouter(),
    { showInfo } = useToast(),
    [amount, setAmount] = useState(""),
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [receiptFile, setReceiptFile] = useState<ReceiptAsset | null>(null),
    [leaving, setLeaving] = useState(false),
    [step, setStep] = useState<"details" | "review">("details")
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
  useEffect(() => {
    if (c.error === "SLOT_UNAVAILABLE") onSlotUnavailable?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the error code only
  }, [c.error])
  const label = (key: string, fallback: string) => t(`marketplace.${key}`, { defaultValue: fallback })
  const paying = !!(c.order && isOpenPay(c.order)) || leaving
  /** Review is its own step: after Continue, or whenever a payment is already open. */
  const inReview = step === "review" || paying
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
  // An empty array is truthy, so pick the first source that actually has lines.
  const lines = (snap?.lines?.length ? snap.lines : q?.lines?.length ? q.lines : seed?.lines) || []
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
    if (step !== "review" || doneOrder || paying || !q || activePayTab !== "yookassa") return
    if (!q.methods.some((m) => m.rail === "yookassa")) return
    if (!canAct || c.busy || !c.contactName.trim()) return
    if (onlinePayment?.confirmationToken) return
    if (autoOnline.current) return
    autoOnline.current = true
    void handlePay().then((order) => {
      const token = order?.attempts?.[0]?.confirmation_token
      if (!order || (Platform.OS === "web" && !token)) autoOnline.current = false
    })
  }, [step, q?.id, canAct, activePayTab, paying, doneOrder, c.busy, c.contactName, onlinePayment?.confirmationToken])

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

  /** Fee and time for delivery, cost and hours for pickup, from the quote (shown under each option). */
  function modeHint(mode: string): string | undefined {
    if (!q) return undefined
    if (mode === "delivery" && q.zones.length > 0) {
      const cheapest = q.zones.reduce((a, z) => (z.fee < a.fee ? z : a), q.zones[0])
      const etas = q.zones.map((z) => z.etaMinutes).filter((n): n is number => typeof n === "number")
      const fee = t("marketplace.fromFee", { fee: formatMoney(cheapest.fee, cheapest.currency), defaultValue: "From {{fee}}" })
      return etas.length ? fee + " · " + t("marketplace.etaMinutes", { n: Math.min(...etas), defaultValue: "{{n}} min" }) : fee
    }
    if (mode === "pickup") return [label("free", "Free"), q.pickupHours].filter(Boolean).join(" · ")
    return undefined
  }

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

      <StepBar
        steps={
          source.kind === "expert"
            ? [label("progressTime", "Time"), label("progressDetails", "Details"), label("progressReview", "Review")]
            : [label("progressDetails", "Details"), label("progressReview", "Review")]
        }
        active={(source.kind === "expert" ? 1 : 0) + (inReview || doneOrder ? 1 : 0)}
      />

      {!q && !c.order && !c.error && !seed ? (
        <View style={styles.boot}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {(q || snap || seed) && totals && (
        <View style={styles.stack}>
          {q?.storeClosed ? (
            <View style={styles.zoneBanner} accessibilityRole="alert">
              <Text style={styles.zoneTitle}>{q.storeClosed.paused ? label("storePausedTitle", "This store is taking a break") : label("storeClosedTitle", "This store is closed right now")}</Text>
              {q.storeClosed.opensAt ? (
                <Text style={styles.zoneBody}>
                  {t("marketplace.storeOpensAt", {
                    day: shortDay(q.storeClosed.opensAt.day as "mon", i18n.language),
                    time: q.storeClosed.opensAt.time,
                    defaultValue: "It opens {{day}} {{time}}.",
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}
          <SummaryCard
            title={title}
            publicId={c.order?.public_id}
            lines={lines}
            totals={totals}
            fulfillmentMode={fulfillmentMode}
            paymentState={paying && c.order ? c.order.payment_state : undefined}
            label={label}
            slot={q?.slotStart ? { start: q.slotStart, end: q.slotEnd, timezone: q.timezone } : undefined}
          />

          {!inReview && (q || seed) && (
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
                        hint={modeHint(mode)}
                        selected={q.fulfillmentMode === mode}
                        onPress={() => c.setFulfillmentMode(mode)}
                      />
                    ))}
                  </View>
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
                    {q.minOrder && !q.minOrder.met ? (
                      <View style={styles.zoneBanner} accessibilityRole="alert">
                        <Text style={styles.zoneBody}>
                          {t("marketplace.minOrderBanner", {
                            min: formatMoney(q.minOrder.amount, q.minOrder.currency),
                            more: formatMoney(q.minOrder.amount - q.totals.subtotal, q.minOrder.currency),
                            defaultValue: "Delivery needs a {{min}} minimum. Add {{more}} more, or pick up instead.",
                          })}
                        </Text>
                        {modes.includes("pickup") ? (
                          <PrimaryButton
                            label={label("pickupInstead", "Pick up instead")}
                            variant="secondary"
                            onPress={() => c.setFulfillmentMode("pickup")}
                          />
                        ) : null}
                      </View>
                    ) : null}
                    <Text style={styles.fieldLabel}>{label("zone", "Delivery area")}</Text>
                    {q.zones.length === 0 ? (
                      <View style={styles.zoneBanner} accessibilityRole="alert">
                        <Text style={styles.zoneTitle}>{label("zoneNotServedTitle", "We can't deliver here yet")}</Text>
                        <Text style={styles.zoneBody}>{label("noZones", "Delivery is not available for this store yet.")}</Text>
                        {modes.includes("pickup") ? (
                          <PrimaryButton
                            label={label("pickupInstead", "Pick up instead")}
                            variant="secondary"
                            onPress={() => c.setFulfillmentMode("pickup")}
                          />
                        ) : null}
                      </View>
                    ) : (
                      q.zones.map((z) => (
                        <Choice
                          key={z.id}
                          label={`${z.city} · ${z.district} · ${formatMoney(z.fee, z.currency)}${z.etaMinutes ? ` · ${t("marketplace.etaMinutes", { n: z.etaMinutes, defaultValue: "{{n}} min" })}` : ""}`}
                          selected={c.deliveryZoneId === z.id}
                          onPress={() => c.setDeliveryZoneId(z.id)}
                        />
                      ))
                    )}
                    {!c.deliveryZoneId && q.zones.length > 0 && (
                      <Text style={styles.meta}>{label("chooseZone", "Choose a delivery area")}</Text>
                    )}
                    {q.zones.length > 0 ? (
                      <>
                        <Field
                          label={label("address", "Delivery address")}
                          accessibilityLabel={label("address", "Delivery address")}
                          value={c.address}
                          onChangeText={c.setAddress}
                          error={c.deliveryZoneId && !c.address.trim() ? label("addressRequired", "Enter the street and apartment so the courier can find you.") : undefined}
                        />
                      </>
                    ) : null}
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

                <Field
                  label={label("contactName", "Your name")}
                  accessibilityLabel={label("contactName", "Your name")}
                  value={c.contactName}
                  onChangeText={c.setContactName}
                  autoComplete="name"
                  error={!c.contactName.trim() ? label("contactNameRequired", "Enter the name for this order.") : undefined}
                />
                <Field
                  label={`${label("contactPhone", "Phone")}${q?.requirePhone ? " *" : ""}`}
                  accessibilityLabel={label("contactPhone", "Phone")}
                  value={c.contactPhone}
                  onChangeText={c.setContactPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  error={q?.requirePhone && !c.contactPhone.trim() ? label("contactPhoneRequired", "A phone number is needed for this order.") : undefined}
                />

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
                  onChangeText={(v) => c.setNote(v.slice(0, 1000))}
                  maxLength={1000}
                  multiline
                />
                <Text style={styles.meta}>{`${[...c.note].length} / 1000`}</Text>

                {q && !q.checkoutReady && (
                  <Text style={styles.warn}>
                    {label(
                      "unavailable",
                      "Choose the required options. Checkout may not yet be available for this offering.",
                    )}
                  </Text>
                )}
              </View>
              <PrimaryButton
                label={label("continueToReview", "Continue to review")}
                disabled={!canAct || c.busy}
                onPress={() => setStep("review")}
              />
            </View>
          )}

          {!paying && inReview && (q || seed) && (
            <View style={styles.section}>
              <View style={styles.recapHead}>
                <Text style={styles.sectionTitle}>{destHeading}</Text>
                <Pressable onPress={() => setStep("details")} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>{label("edit", "Edit")}</Text>
                </Pressable>
              </View>
              <View style={styles.sectionCard}>
                <Text style={styles.infoValue}>
                  {[c.contactName.trim(), c.contactPhone.trim()].filter(Boolean).join(" · ")}
                </Text>
                {fulfillmentMode === "delivery" && c.address.trim() ? <Text style={styles.infoValue}>{c.address.trim()}</Text> : null}
                {fulfillmentMode === "pickup" && q?.pickupLocation ? <Text style={styles.infoValue}>{q.pickupLocation}</Text> : null}
                {c.note.trim() ? <Text style={styles.meta}>{c.note.trim()}</Text> : null}
              </View>
            </View>
          )}

          {inReview && payMethods.length > 0 && (
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
  chatInline,
}: {
  order: MarketplaceOrder
  onChange?: (order: MarketplaceOrder) => unknown
  /** The conversation is already beside the order (wide web), so the Message seller bar is not needed. */
  chatInline?: boolean
}) {
  const [order, setOrder] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [methodId, setMethodId] = useState(""),
    [receiptFile, setReceiptFile] = useState<ReceiptAsset | null>(null),
    { t, i18n } = useTranslation("app")
  const router = useRouter()
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

  const chatClosesRaw = (order as { chat?: { closesAt?: string | null } }).chat?.closesAt
  const chatClosesAt = chatClosesRaw && !Number.isNaN(new Date(chatClosesRaw).getTime()) ? new Date(chatClosesRaw) : null

  /** While the seller is still working on it, Message seller also sits in a bar at the bottom. */
  const live = order.payment_state === "paid" && ["awaiting_acceptance", "accepted", "in_progress"].includes(order.fulfillment_state)

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
    <View style={{ flex: 1 }}>
    <ScreenScroll keyboard edges={["left", "right", "bottom"]} contentStyle={live ? { ...styles.scroll, paddingBottom: 96 } : styles.scroll}>
      <View style={styles.stack}>
        {order.nextAction === "checking" ? (
          <View style={styles.zoneBanner} accessibilityRole="alert">
            <Text style={styles.zoneTitle}>{t("marketplace.checkingTitle", { defaultValue: "We are checking your payment" })}</Text>
            <Text style={styles.zoneBody}>{t("marketplace.checkingBody", { defaultValue: "Please do not pay again. This usually takes a minute." })}</Text>
          </View>
        ) : pay && methods.length > 0 ? (
          <View style={styles.zoneBanner} accessibilityRole="alert">
            <Text style={styles.zoneTitle}>{t("marketplace.completePaymentTitle", { defaultValue: "Complete your payment" })}</Text>
            <Text style={styles.zoneBody}>{t("marketplace.completePaymentBody", { total: formatMoney(order.snapshot.totals.total, order.snapshot.totals.payCurrency), defaultValue: "Pay {{total}} below to place this order." })}</Text>
          </View>
        ) : null}
        <OrderStatusHeader
          order={order}
          reason={
            order.fulfillment_state === "cancelled"
              ? order.exception_reason || [...order.events].reverse().find((e) => /cancel/i.test(e.kind))?.message || undefined
              : undefined
          }
        />
        <SummaryCard
          title={order.snapshot.title}
          publicId={order.public_id}
          lines={order.snapshot.lines}
          totals={order.snapshot.totals}
          fulfillmentMode={order.fulfillment_mode}
          paymentState={order.payment_state}
          label={label}
          slot={order.snapshot.slotStart ? { start: order.snapshot.slotStart, end: order.snapshot.slotEnd, timezone: order.snapshot.timezone } : undefined}
          images={order.lineImages}
          methodName={order.paymentMethodName}
          refund={order.refund}
        />
        <BookingSessionCard order={order as unknown as Parameters<typeof BookingSessionCard>[0]["order"]} />
        <OrderPlaceCard order={order} />
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>{t("marketplace.orderProgress", { defaultValue: "Order progress" })}</Text>
          <OrderTimeline order={order} />
        </View>
        <OrderReviewCard orderId={order.id} fulfilled={order.fulfillment_state === "fulfilled"} line={order.line} />
        <SellerChatCard
          orderId={order.id}
          sellerName={(order as { seller?: { name?: string } }).seller?.name}
          photoUrl={(order as { seller?: { photoUrl?: string | null } }).seller?.photoUrl}
        />
        {chatClosesAt ? (
          <Text style={styles.meta}>
            {t("chat.openUntil", { date: chatClosesAt.toLocaleDateString(i18n.language, { dateStyle: "medium" }), defaultValue: "Chat with the seller stays open until {{date}}." })}
          </Text>
        ) : null}
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

        {order.canCancel && (
          <PrimaryButton
            label={label("cancel", "Cancel order")}
            variant="secondary"
            busy={busy}
            onPress={() => void action("cancel")}
          />
        )}
        {["paid", "refund_pending", "refunded"].includes(order.payment_state) ? (
          <PrimaryButton
            label={t("receipt.view", { defaultValue: "View receipt" })}
            variant="secondary"
            onPress={() => router.push(`/receipt/${order.line === "experts" ? "booking" : "order"}/${encodeURIComponent(order.public_id)}` as never)}
          />
        ) : null}
        <PrimaryButton
          label={label("support", "Contact support")}
          variant="ghost"
          onPress={() =>
            router.push({ pathname: "/support/new", params: { topic: "order", subject: order.public_id, orderId: order.id } } as never)
          }
        />
      </View>
    </ScreenScroll>
    {live && !chatInline ? <StickyMessageSeller orderId={order.id} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 0, paddingHorizontal: 16, ...NARROW_COLUMN },
  stack: { gap: 20, paddingBottom: 16 },
  footerPad: { padding: 20 },
  loading: { fontSize: typeSize.body, color: colors.muted },
  boot: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  errorBox: {
    borderRadius: radius.row,
    backgroundColor: colors.dangerSurface,
    padding: 14,
    marginBottom: 8,
  },
  errorText: { fontSize: typeSize.meta, color: colors.danger, fontWeight: "600" },
  timelineCard: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  choiceHint: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
  recapHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
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
  summarySlot: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  summaryLines: { gap: 8 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  summaryPhoto: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.border },
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
  zoneBanner: { gap: 8, padding: 14, borderRadius: radius.row, backgroundColor: colors.dangerSurface },
  zoneTitle: { fontSize: typeSize.body, fontWeight: "700", color: colors.danger },
  zoneBody: { fontSize: typeSize.meta, lineHeight: 18, color: colors.text },
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
    backgroundColor: colors.heroBody,
  },
  choiceLabel: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
  choiceLabelActive: { color: colors.primary },
  eventRow: { gap: 2 },
  eventTitle: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
})
