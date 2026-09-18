import { useEffect, useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineShellLabels } from "@ciuna/shared"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { Field } from "@/components/field"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { findRate, quoteSend } from "@/lib/fx"
import { formatMoney } from "@/lib/money"
import { useFx } from "@/lib/use-fx"
import type { RecipientRow } from "@/lib/types"

type Step = "amount" | "recipient" | "pay"

export default function SendScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const sendLine = useHubServiceLine("send")
  const labels = hubServiceLineShellLabels(
    "send",
    sendLine,
    t,
    t("hub.serviceLineTiles.send.title", { defaultValue: "Send Money" }),
  )
  const { currencies, rates } = useFx()
  const [step, setStep] = useState<Step>("amount")
  const [sendAmount, setSendAmount] = useState("")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const [recipients, setRecipients] = useState<RecipientRow[]>([])
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [name, setName] = useState("")
  const [account, setAccount] = useState("")
  const [bank, setBank] = useState("")
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetchWithAuth("/api/recipients")
      const body = (await res.json()) as { recipients?: RecipientRow[] }
      setRecipients(body.recipients || [])
    })()
  }, [])

  const rate = findRate(rates, sendCurrency, receiveCurrency)
  const quote = quoteSend(Number(sendAmount) || 0, rate)
  const selected = recipients.find((r) => r.id === recipientId)

  const canAmount = Boolean(quote)
  const canRecipient = Boolean(recipientId)

  const addRecipient = async () => {
    if (!name.trim() || !account.trim() || !bank.trim()) return
    setBusy(true)
    const res = await fetchWithAuth("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: name.trim(),
        accountNumber: account.trim(),
        bankName: bank.trim(),
        currency: receiveCurrency,
      }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      showError((body as { error?: string }).error || "Could not save recipient")
      return
    }
    const rec = (body as { recipient?: RecipientRow }).recipient
    if (rec) {
      setRecipients((prev) => [rec, ...prev])
      setRecipientId(rec.id)
      setName("")
      setAccount("")
      setBank("")
    }
  }

  const submit = async () => {
    if (!recipientId || !quote) return
    setBusy(true)
    const res = await fetchWithAuth("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sendAmount: Number(sendAmount),
        sendCurrency,
        receiveCurrency,
        receiveAmount: quote.receiveAmount,
        recipientId,
        fulfillmentType: "bank_transfer",
      }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      showError((body as { error?: string }).error || "Send failed. Try again.")
      return
    }
    const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
    if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
  }

  const steps = useMemo(() => ["amount", "recipient", "pay"] as const, [])

  return (
    <HubLinePageShell
      title={labels.title}
      subtitle={labels.subtitle}
      backAriaLabel={t("hub.backToHub", { defaultValue: "Back to Hub" })}
      keyboard
    >
      <View className="mb-6 flex-row gap-2">
        {steps.map((s, i) => (
          <View key={s} className={`h-1.5 flex-1 rounded-full ${steps.indexOf(step) >= i ? "bg-primary" : "bg-border"}`} />
        ))}
      </View>

      {step === "amount" ? (
        <View>
          <Text className="mb-4 text-xl font-semibold text-gray-900">How much are you sending?</Text>
          <PayStep
            sendAmount={sendAmount}
            onChangeAmount={setSendAmount}
            sendCurrency={sendCurrency}
            receiveCurrency={receiveCurrency}
            onChangeSendCurrency={setSendCurrency}
            onChangeReceiveCurrency={setReceiveCurrency}
            currencies={currencies}
            rates={rates}
          />
          <PrimaryButton label="Continue" onPress={() => setStep("recipient")} disabled={!canAmount} />
        </View>
      ) : null}

      {step === "recipient" ? (
        <View>
          <Text className="mb-4 text-xl font-semibold text-gray-900">Who receives it?</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="mb-4 min-h-[48px] justify-center rounded-xl border border-border bg-surface px-4 py-3"
          >
            <Text className="text-base text-gray-900">{selected?.full_name || "Choose a recipient"}</Text>
            {selected?.bank_name ? <Text className="text-sm text-muted">{selected.bank_name}</Text> : null}
          </Pressable>
          <Text className="mb-2 font-medium text-gray-900">Or add someone</Text>
          <Field label="Full name" value={name} onChangeText={setName} />
          <Field label="Account number" value={account} onChangeText={setAccount} keyboardType="number-pad" />
          <Field label="Bank name" value={bank} onChangeText={setBank} />
          <View className="mb-3">
            <PrimaryButton label="Save recipient" variant="secondary" onPress={() => void addRecipient()} busy={busy} />
          </View>
          <PrimaryButton label="Continue" onPress={() => setStep("pay")} disabled={!canRecipient} />
          <View className="mt-3">
            <PrimaryButton label="Back" variant="ghost" onPress={() => setStep("amount")} />
          </View>
          <SheetPicker
            open={pickerOpen}
            title="Recipients"
            items={recipients}
            keyExtractor={(r) => r.id}
            labelExtractor={(r) => `${r.full_name}${r.bank_name ? ` · ${r.bank_name}` : ""}`}
            selectedId={recipientId}
            onSelect={(r) => setRecipientId(r.id)}
            onClose={() => setPickerOpen(false)}
          />
        </View>
      ) : null}

      {step === "pay" ? (
        <View>
          <Text className="mb-4 text-xl font-semibold text-gray-900">Pay</Text>
          {quote ? (
            <View className="mb-4 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="text-sm text-muted">You send</Text>
              <Text className="text-2xl font-semibold text-gray-900">{formatMoney(Number(sendAmount), sendCurrency)}</Text>
              <Text className="mt-3 text-sm text-muted">They receive</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {formatMoney(quote.receiveAmount, receiveCurrency)}
              </Text>
              <Text className="mt-3 text-sm text-muted">
                Rate 1 {sendCurrency} = {quote.rate.toFixed(4)} {receiveCurrency}
              </Text>
              <Text className="mt-1 text-sm text-muted">
                {quote.feeAmount > 0
                  ? `Exchange fee ${formatMoney(quote.feeAmount, sendCurrency)}`
                  : "No exchange fee on this corridor"}
              </Text>
              <Text className="mt-3 text-sm text-muted">To {selected?.full_name}</Text>
              <Text className="mt-3 text-base font-semibold text-gray-900">
                You pay {formatMoney(quote.totalAmount, sendCurrency)}
              </Text>
            </View>
          ) : null}
          <PrimaryButton label="Send" onPress={() => void submit()} busy={busy} />
          <View className="mt-3">
            <PrimaryButton label="Back" variant="ghost" onPress={() => setStep("recipient")} />
          </View>
        </View>
      ) : null}
    </HubLinePageShell>
  )
}
