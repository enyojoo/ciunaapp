import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { Field } from "@/components/field"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useFx } from "@/lib/use-fx"
import type { ExpertSlot } from "@/lib/types"
import { colors, type as typeSize } from "@/lib/theme"

export default function ExpertBookScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()
  const router = useRouter()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const { currencies, rates } = useFx()
  const [slots, setSlots] = useState<ExpertSlot[]>([])
  const [service, setService] = useState<{ title: string; short_description?: string | null } | null>(null)
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!serviceId) return
    void (async () => {
      const res = await fetchWithAuth(`/api/expert/services/${encodeURIComponent(String(serviceId))}/slots`)
      const body = (await res.json()) as {
        slots?: ExpertSlot[]
        service?: { title?: string; short_description?: string | null }
      }
      setSlots(body.slots || [])
      setService(body.service ? { title: body.service.title || "", short_description: body.service.short_description } : null)
      setLoading(false)
    })()
  }, [serviceId])

  const submit = async () => {
    if (!slotId) return
    setBusy(true)
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
      }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      showError((body as { error?: string }).error || "Booking failed. Try again.")
      return
    }
    const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
    if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
  }

  return (
    <ScreenScroll keyboard>
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
          <PrimaryButton
            label="Pay"
            onPress={() => void submit()}
            busy={busy}
            disabled={!contactName.trim() || !contactPhone.trim()}
          />
        </View>
      ) : null}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: 8, fontSize: 20, fontWeight: "600", color: colors.text },
  desc: { marginBottom: 16, fontSize: typeSize.body, lineHeight: 22, color: colors.muted },
})
