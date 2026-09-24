import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Field } from "@/components/field"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { CheckoutPayRails } from "@/components/checkout-pay-rails"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useHubCartByLine } from "@/lib/hub-cart"
import { computeHubCartTotals } from "@/lib/hub-cart-pricing"
import { findRate } from "@/lib/fx"
import { useFx } from "@/lib/use-fx"
import { formatMoney } from "@/lib/money"
import { openInAppBrowser } from "@/lib/in-app-browser"
import { startYooKassaPayment, isYooKassaNativeAvailable } from "@/lib/yookassa-native"
import { formatExchangeRateDisplay } from "@ciuna/shared"
import { hubLineHomePath } from "@/lib/hub"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function HubCartCheckoutScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const line = String(slug || "").toLowerCase() as "food" | "mart"
  const navigation = useNavigation()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const { currencies, rates } = useFx()
  const { showError } = useToast()
  const { cart, loading: cartLoading } = useHubCartByLine(line)

  const [contactName, setContactName] = useState(
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
  )
  const [contactPhone, setContactPhone] = useState("")
  const [delivery, setDelivery] = useState("")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [payChoice, setPayChoice] = useState<"manual" | "yookassa">("manual")
  const [yookassaEnabled, setYookassaEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [onlinePayment, setOnlinePayment] = useState<{
    transactionId: string
    confirmationToken: string | null
  } | null>(null)

  useEffect(() => {
    navigation.setOptions({ title: t("hub.checkout.title", { defaultValue: "Checkout" }) })
  }, [navigation, t])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchWithAuth("/api/platform/public-flags")
        if (!res.ok) return
        const body = (await res.json()) as { yookassaEnabled?: boolean }
        setYookassaEnabled(Boolean(body.yookassaEnabled))
      } catch {
        // ignore — online payment simply stays hidden
      }
    })()
  }, [])

  useEffect(() => {
    if (sendCurrency.toUpperCase() !== "RUB" && payChoice === "yookassa") setPayChoice("manual")
  }, [sendCurrency, payChoice])

  const items = useMemo(() => (cart?.items || []).filter((i) => !i.unavailable && i.product), [cart])
  const receiveCurrency = items[0]?.product?.fixed_currency || ""
  const fulfillmentType = items[0]?.product?.fulfillment_type === "in_person" ? "in_person" : "vendor"

  const rateRow = findRate(rates, sendCurrency, receiveCurrency)
  const totals = useMemo(() => {
    if (!rateRow || !items.length) return null
    try {
      return computeHubCartTotals(
        items.map((i) => ({ product: i.product!, quantity: i.quantity })),
        rateRow,
      )
    } catch {
      return null
    }
  }, [items, rateRow])

  useEffect(() => {
    if (!cartLoading && cart && items.length === 0) {
      router.replace(hubLineHomePath(line) as never)
    }
  }, [cartLoading, cart, items.length, router, line])

  const submit = async () => {
    if (!cart || !totals) return
    if (!contactName.trim() || !contactPhone.trim()) {
      showError(t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }))
      return
    }
    if (fulfillmentType === "in_person" && !delivery.trim()) {
      showError(
        t("hub.checkout.errors.deliveryAddressRequired", { defaultValue: "Enter a delivery address." }),
      )
      return
    }

    setBusy(true)
    try {
      const res = await fetchWithAuth("/api/hub/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          sendCurrency,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          deliveryAddressLine: fulfillmentType === "in_person" ? delivery.trim() : null,
          formAnswers: {},
          paymentMethod: payChoice,
          gatewayMode: payChoice === "yookassa" && Platform.OS !== "web" && isYooKassaNativeAvailable() ? "native" : "embedded",
          returnUrl:
            payChoice === "yookassa" && Platform.OS === "web" && typeof window !== "undefined"
              ? window.location.href
              : undefined,
          idempotencyKey: `${cart.id}:${Date.now()}`,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError((body as { error?: string }).error || t("errors.generic", { defaultValue: "Payment failed. Try again." }))
        return
      }
      const transactionId = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
      if (!transactionId) return

      if (payChoice === "yookassa") {
        const gateway = (body as {
          gateway?: { confirmationToken?: string; amount?: number; currency?: string; confirmationType?: string }
        }).gateway
        const token = gateway?.confirmationToken ?? null
        if (Platform.OS === "web") {
          setOnlinePayment({ transactionId, confirmationToken: token })
          return
        }
        if (isYooKassaNativeAvailable()) {
          const result = await startYooKassaPayment({
            confirmationToken: token || undefined,
            transactionId,
            amount: gateway?.amount ?? totals.total,
            currency: gateway?.currency || "RUB",
            shopName: cart.vendor?.name || "Ciuna",
          })
          if (result === "succeeded" || result === "pending") {
            router.replace(`/orders/${transactionId.toLowerCase()}` as never)
            return
          }
          if (result === "cancelled") {
            showError(t("hub.pay.cancelled", { defaultValue: "Payment cancelled." }))
            return
          }
          showError(t("hub.pay.failed", { defaultValue: "Payment failed. Please try again." }))
          return
        }
        // Interim until native SDK is present in this binary
        await openInAppBrowser(apiUrl(`/pay/${transactionId.toLowerCase()}`))
        router.replace(`/orders/${transactionId.toLowerCase()}` as never)
        return
      }
      router.replace(`/orders/${transactionId.toLowerCase()}` as never)
    } finally {
      setBusy(false)
    }
  }

  if (cartLoading && !cart) {
    return (
      <ScreenScroll edges={["left", "right"]}>
      <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (!cart || items.length === 0) return null // redirecting to line home

  return (
    <ScreenScroll keyboard edges={["left", "right"]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>{cart.vendor?.name || ""}</Text>
      <View style={styles.summary}>
        {items.map((i) => (
          <View key={i.id} style={styles.summaryRow}>
            <Text style={styles.summaryLabel} numberOfLines={1}>
              {i.quantity} × {i.product?.title}
            </Text>
            <Text style={styles.summaryValue}>
              {formatMoney(totals?.lines.find((l) => l.hubProductId === i.hub_product_id)?.lineTotal ?? 0, receiveCurrency)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <PayStep
          sendAmount=""
          showAmount={false}
          showQuote={false}
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
          onChangeSendCurrency={setSendCurrency}
          onChangeReceiveCurrency={() => {}}
          currencies={currencies}
          rates={rates}
        />
        {totals ? (
          <View style={styles.quote}>
            <Text style={styles.meta}>
              {t("send.rate", { defaultValue: "Rate" })} 1 {sendCurrency} ={" "}
              {formatExchangeRateDisplay(totals.exchangeRate)} {receiveCurrency}
            </Text>
            <Text style={styles.total}>
              {t("hub.checkout.totalToPay", { defaultValue: "Total to Pay" })}: {formatMoney(totals.total, sendCurrency)}
            </Text>
          </View>
        ) : null}

        <Field
          label={t("hub.checkout.fullName", { defaultValue: "Full name" })}
          value={contactName}
          onChangeText={setContactName}
        />
        <Field
          label={t("hub.checkout.phone", { defaultValue: "Phone" })}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />
        {fulfillmentType === "in_person" ? (
          <Field
            label={t("hub.checkout.deliveryNotesAddress", { defaultValue: "Delivery address" })}
            value={delivery}
            onChangeText={setDelivery}
          />
        ) : null}

        <CheckoutPayRails
          yookassaEnabled={yookassaEnabled}
          sendCurrency={sendCurrency}
          payChoice={payChoice}
          onPayChoice={setPayChoice}
          onlinePayment={Platform.OS === "web" ? onlinePayment : null}
          onCompleted={(id) => router.replace(`/orders/${id.toLowerCase()}` as never)}
          onFailed={(msg) => showError(msg)}
          onSwitchToManual={() => {
            setOnlinePayment(null)
            setPayChoice("manual")
          }}
        />

        {!onlinePayment || Platform.OS !== "web" ? (
          <PrimaryButton
            label={
              payChoice === "yookassa"
                ? t("hub.checkout.payOnline", { defaultValue: "Pay online" })
                : t("hub.checkout.makePayment", { defaultValue: "Pay" })
            }
            onPress={() => void submit()}
            busy={busy}
            disabled={!contactName.trim() || !contactPhone.trim() || !totals}
          />
        ) : null}
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  summary: { marginTop: 12, gap: 4, padding: 12, borderRadius: radius.card, backgroundColor: colors.paper },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  summaryLabel: { flex: 1, minWidth: 0, fontSize: typeSize.meta, color: colors.text },
  summaryValue: { fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  form: { marginTop: 16, gap: 12 },
  quote: { gap: 4, paddingVertical: 8 },
  meta: { fontSize: typeSize.meta, color: colors.muted },
  total: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
})
