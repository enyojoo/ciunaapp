import { useEffect, useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { Field } from "@/components/field"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { CheckoutPayRails } from "@/components/checkout-pay-rails"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useExpertSlots } from "@/lib/use-expert-slots"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useFx } from "@/lib/use-fx"
import { usePublicFlags } from "@/lib/use-public-flags"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { openInAppBrowser } from "@/lib/in-app-browser"
import { isYooKassaNativeAvailable, startYooKassaPayment } from "@/lib/yookassa-native"
import { colors, type as typeSize } from "@/lib/theme"

export default function ExpertBookScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const { currencies, rates } = useFx()
  const { data: slotsData, loading, revalidate } = useExpertSlots(serviceId)
  const slots = slotsData?.slots || []
  const service = slotsData?.service || null
  const { data: flags } = usePublicFlags()
  const yookassaEnabled = Boolean(flags?.yookassaEnabled)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("USD")
  const [contactName, setContactName] = useState(
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
  )
  const [contactPhone, setContactPhone] = useState("")
  const [message, setMessage] = useState("")
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)
  const [payChoice, setPayChoice] = useState<"manual" | "yookassa">("manual")
  const [onlinePayment, setOnlinePayment] = useState<{
    transactionId: string
    confirmationToken: string | null
  } | null>(null)

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  useEffect(() => {
    if (sendCurrency.toUpperCase() !== "RUB" && payChoice === "yookassa") setPayChoice("manual")
  }, [sendCurrency, payChoice])

  const submit = async () => {
    if (!slotId) return
    setBusy(true)
    try {
      const res = await fetchWithAuth("/api/expert/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expert_service_slot_id: slotId,
          sendCurrency,
          receiveCurrency,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          message: message.trim() || null,
          idempotencyKey: `${slotId}:${Date.now()}`,
          paymentMethod: payChoice,
          gatewayMode: payChoice === "yookassa" && Platform.OS !== "web" && isYooKassaNativeAvailable() ? "native" : "embedded",
          returnUrl:
            payChoice === "yookassa" && Platform.OS === "web" && typeof window !== "undefined"
              ? window.location.href
              : undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError((body as { error?: string }).error || "Booking failed. Try again.")
        return
      }
      const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
      if (!id) return

      if (payChoice === "yookassa") {
        const gateway = (body as {
          gateway?: { confirmationToken?: string; amount?: number; currency?: string }
        }).gateway
        const token = gateway?.confirmationToken ?? null
        if (Platform.OS === "web") {
          setOnlinePayment({ transactionId: id, confirmationToken: token })
          return
        }
        if (isYooKassaNativeAvailable()) {
          const result = await startYooKassaPayment({
            confirmationToken: token || undefined,
            transactionId: id,
            amount: gateway?.amount,
            currency: gateway?.currency || "RUB",
            shopName: service?.title || "Ciuna",
          })
          if (result === "succeeded" || result === "pending") {
            router.replace(`/orders/${id.toLowerCase()}` as never)
            return
          }
          if (result === "cancelled") {
            showError(t("hub.pay.cancelled", { defaultValue: "Payment cancelled." }))
            return
          }
          showError(t("hub.pay.failed", { defaultValue: "Payment failed. Please try again." }))
          return
        }
        await openInAppBrowser(apiUrl(`/pay/${id.toLowerCase()}`))
      }
      router.replace(`/orders/${id.toLowerCase()}` as never)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenScroll keyboard edges={["left", "right"]}>
      <StatusBar style="dark" />
      {service?.title ? <Text style={styles.title}>{service.title}</Text> : null}
      {service?.short_description ? <Text style={styles.desc}>{service.short_description}</Text> : null}
      <Text className="mb-3 text-lg font-semibold text-gray-900">
        {t("experts.bookingWizard.chooseTime", { defaultValue: "Pick a date and time" })}
      </Text>
      {loading ? <Text className="text-muted">Loading slots…</Text> : null}
      {!loading && slots.length === 0 ? <EmptyState title="No open slots" body="This service has no upcoming times." /> : null}
      {slots.map((s) => {
        const selected = slotId === s.id
        const start = new Date(s.slot_start)
        return (
          <Pressable
            key={s.id}
            onPress={() => setSlotId(s.id)}
            className={`mb-2 min-h-[48px] justify-center rounded-xl border px-4 py-3 ${
              selected ? "border-primary bg-orange-50" : "border-border bg-surface"
            }`}
          >
            <Text className="font-medium text-gray-900">
              {start.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </Text>
          </Pressable>
        )
      })}

      {slotId ? (
        <View className="mt-6">
          <PayStep
            sendAmount=""
            showAmount={false}
            showQuote={false}
            sendCurrency={sendCurrency}
            receiveCurrency={receiveCurrency}
            onChangeSendCurrency={setSendCurrency}
            onChangeReceiveCurrency={setReceiveCurrency}
            currencies={currencies}
            rates={rates}
          />
          <Field label="Contact name" value={contactName} onChangeText={setContactName} />
          <Field label="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <Field label="Note (optional)" value={message} onChangeText={setMessage} />
          <CheckoutPayRails
            yookassaEnabled={yookassaEnabled}
            sendCurrency={sendCurrency}
            payChoice={payChoice}
            onPayChoice={setPayChoice}
            onlinePayment={Platform.OS === "web" ? onlinePayment : null}
            onCompleted={(tid) => router.replace(`/orders/${tid.toLowerCase()}` as never)}
            onFailed={(msg) => showError(msg)}
            onSwitchToManual={() => {
              setOnlinePayment(null)
              setPayChoice("manual")
            }}
          />
          {!onlinePayment || Platform.OS !== "web" ? (
            <PrimaryButton
              label={payChoice === "yookassa" ? t("hub.checkout.payOnline", { defaultValue: "Pay online" }) : "Pay"}
              onPress={() => void submit()}
              busy={busy}
              disabled={!contactName.trim() || !contactPhone.trim()}
            />
          ) : null}
        </View>
      ) : null}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: 8, fontSize: 20, fontWeight: "600", color: colors.text },
  desc: { marginBottom: 16, fontSize: typeSize.body, lineHeight: 22, color: colors.muted },
})
