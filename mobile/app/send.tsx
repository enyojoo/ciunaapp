import { useEffect, useMemo, useState } from "react"
import { Image, Pressable, Text, View } from "react-native"
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
import { useAuth } from "@/lib/auth-context"
import { findRate, quoteSend } from "@/lib/fx"
import { formatMoney } from "@/lib/money"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import type { RecipientRow } from "@/lib/types"

type Step = "amount" | "recipient" | "pay"

type SendPaymentMethod = {
  id: string
  currency: string
  provider: string
  isDefault?: boolean
}

type BitbankerPayment = {
  amount: number
  link: string | null
  qrData: string | null
}

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
  const { user } = useAuth()
  const { data: eligibility } = useBitbankerEligibility(user?.id)
  const [step, setStep] = useState<Step>("amount")
  const [sendAmount, setSendAmount] = useState("")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const { data: recipientsData, mutate: mutateRecipients } = useRecipients(user?.id)
  const recipients = recipientsData || []
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [name, setName] = useState("")
  const [account, setAccount] = useState("")
  const [bank, setBank] = useState("")
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)
  const [sendMethods, setSendMethods] = useState<SendPaymentMethod[]>([])
  const [bitbankerPayment, setBitbankerPayment] = useState<BitbankerPayment | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetchWithAuth(`/api/payment-methods/send?currency=${encodeURIComponent(sendCurrency)}`)
      if (!res.ok || cancelled) return
      const body = (await res.json()) as { methods?: SendPaymentMethod[] }
      setSendMethods(body.methods || [])
    })()
    return () => {
      cancelled = true
    }
  }, [sendCurrency])

  const rate = findRate(rates, sendCurrency, receiveCurrency)
  const quote = quoteSend(Number(sendAmount) || 0, rate)
  const selected = recipients.find((r) => r.id === recipientId)

  const defaultMethod = sendMethods.find((m) => m.isDefault) || sendMethods[0]
  const usesBitbanker =
    sendCurrency === "RUB" && String(defaultMethod?.provider || "").toLowerCase() === "bitbanker"

  const bitbankerGateActive =
    Boolean(eligibility) && eligibility?.status !== "unconfigured" && !eligibility?.isVerifiedForSbp

  const canAmount = Boolean(quote)
  const canRecipient = Boolean(recipientId)

  const requireVerification = () => {
    showError("Complete account verification to send money.")
    router.push("/verification/bitbanker" as never)
  }

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
      mutateRecipients((prev) => [rec, ...(prev || [])])
      setRecipientId(rec.id)
      setName("")
      setAccount("")
      setBank("")
    }
  }

  const createBitbankerTransfer = async () => {
    if (!recipientId || !quote) throw new Error("Missing recipient or quote")
    const quoteRes = await fetchWithAuth("/api/send/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sendAmount: Number(sendAmount),
        sendCurrency,
        receiveAmount: quote.receiveAmount,
        receiveCurrency,
        recipientId,
        fulfillmentType: "bank_transfer",
      }),
    })
    const quoteBody = await quoteRes.json().catch(() => ({}))
    if (!quoteRes.ok) {
      throw new Error((quoteBody as { error?: string }).error || "Failed to create quote")
    }
    const quoteId = (quoteBody as { quote?: { id: string } }).quote?.id
    if (!quoteId) throw new Error("Invalid quote response")

    const transferRes = await fetchWithAuth("/api/send/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      }),
    })
    const transferBody = await transferRes.json().catch(() => ({}))
    if (!transferRes.ok) {
      throw new Error((transferBody as { error?: string }).error || "Failed to create SBP invoice")
    }
    const tx = (transferBody as { transaction?: { transaction_id: string }; payment?: BitbankerPayment }).transaction
    const payment = (transferBody as { payment?: BitbankerPayment }).payment
    if (!tx?.transaction_id || !payment) throw new Error("Invalid transfer response")
    setBitbankerPayment(payment)
    return tx.transaction_id
  }

  const submit = async () => {
    if (!recipientId || !quote) return
    if (bitbankerGateActive) {
      requireVerification()
      return
    }
    setBusy(true)
    try {
      if (usesBitbanker) {
        const id = await createBitbankerTransfer()
        router.replace(`/orders/${id.toLowerCase()}` as never)
        return
      }
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
      if (!res.ok) {
        showError((body as { error?: string }).error || "Send failed. Try again.")
        return
      }
      const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
      if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
    } catch (e) {
      showError(e instanceof Error ? e.message : "Send failed")
    } finally {
      setBusy(false)
    }
  }

  const steps = useMemo(() => ["amount", "recipient", "pay"] as const, [])

  const goRecipient = () => {
    if (bitbankerGateActive) {
      requireVerification()
      return
    }
    setStep("recipient")
  }

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
          <PrimaryButton label="Continue" onPress={goRecipient} disabled={!canAmount} />
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
              {usesBitbanker ? (
                <Text className="mt-3 text-sm text-primary">Payment: SBP (Bitbanker)</Text>
              ) : null}
              <Text className="mt-3 text-sm text-muted">To {selected?.full_name}</Text>
              <Text className="mt-3 text-base font-semibold text-gray-900">
                You pay {formatMoney(quote.totalAmount, sendCurrency)}
              </Text>
            </View>
          ) : null}
          {bitbankerPayment?.qrData ? (
            <View className="mb-4 items-center">
              <Image source={{ uri: bitbankerPayment.qrData }} style={{ width: 220, height: 220 }} />
            </View>
          ) : null}
          <PrimaryButton
            label={usesBitbanker ? "Create SBP payment" : "Send"}
            onPress={() => void submit()}
            busy={busy}
          />
          <View className="mt-3">
            <PrimaryButton label="Back" variant="ghost" onPress={() => setStep("recipient")} />
          </View>
        </View>
      ) : null}
    </HubLinePageShell>
  )
}
