import { useCallback, useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import {
  applyReceiveCurrencyChange,
  applySendCurrencyChange,
  ensureValidReceiveCurrency,
  hubServiceLineShellLabels,
  defaultSendAmountForCurrency,
  initialSendReceivePair,
  minSendAmountForCurrency,
} from "@ciuna/shared"
import { ShieldAlert } from "lucide-react-native"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { SEND_DEFAULT_AMOUNT, SendAmountStep } from "@/components/send/send-amount-step"
import { SendRecipientStep } from "@/components/send/send-recipient-step"
import { SendReviewStep } from "@/components/send/send-review-step"
import { SendStepProgress, type SendFlowStep } from "@/components/send/send-step-progress"
import { PrimaryButton } from "@/components/primary-button"
import { useToast } from "@/components/toast-provider"
import { useHubServiceLine } from "@/lib/use-hub-service-line"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { findRate, quoteSend } from "@/lib/fx"
import { roundMoney } from "@/lib/money"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { useBitbankerQuotePreview } from "@/lib/use-bitbanker-quote-preview"
import { useSendPaymentMethods } from "@/lib/use-send-payment-methods"
import type { RecipientRow } from "@/lib/types"
import { colors, radius } from "@/lib/theme"

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
  const backAria = t("hub.backToHub", { defaultValue: "Back to Hub" })
  const { currencies, rates, reload: reloadFx } = useFx()
  useFocusRevalidate(reloadFx)
  const { user, profile } = useAuth()
  const { data: eligibility } = useBitbankerEligibility(user?.id)
  const [step, setStep] = useState<SendFlowStep>("amount")
  const [sendAmount, setSendAmount] = useState(SEND_DEFAULT_AMOUNT)
  const [sendCurrency, setSendCurrency] = useState("")
  const [receiveCurrency, setReceiveCurrency] = useState("")
  const { data: recipientsData, mutate: mutateRecipients } = useRecipients(user?.id)
  const recipients = recipientsData || []
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [account, setAccount] = useState("")
  const [bank, setBank] = useState("")
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)
  const { methods: sendMethods, loading: sendMethodsLoading } = useSendPaymentMethods(sendCurrency)
  const [bitbankerPayment, setBitbankerPayment] = useState<BitbankerPayment | null>(null)

  useEffect(() => {
    if (currencies.length === 0) return
    if (!sendCurrency && !receiveCurrency) {
      const pair = initialSendReceivePair(currencies, profile?.base_currency)
      if (pair) {
        setSendCurrency(pair.sendCurrency)
        setReceiveCurrency(pair.receiveCurrency)
      }
      return
    }
    if (sendCurrency && receiveCurrency) {
      const fixed = ensureValidReceiveCurrency(currencies, sendCurrency, receiveCurrency)
      if (fixed !== receiveCurrency) setReceiveCurrency(fixed)
    }
  }, [currencies, profile?.base_currency, sendCurrency, receiveCurrency])

  const handleSendCurrencyChange = useCallback(
    (code: string) => {
      const next = applySendCurrencyChange(currencies, code, receiveCurrency)
      setSendCurrency(next.sendCurrency)
      setReceiveCurrency(next.receiveCurrency)
    },
    [currencies, receiveCurrency],
  )

  const handleReceiveCurrencyChange = useCallback(
    (code: string) => {
      const next = applyReceiveCurrencyChange(currencies, sendCurrency, code)
      setSendCurrency(next.sendCurrency)
      setReceiveCurrency(next.receiveCurrency)
    },
    [currencies, sendCurrency],
  )

  const rate = findRate(rates, sendCurrency, receiveCurrency)
  const quote = quoteSend(Number(sendAmount) || 0, rate)
  const selected = recipients.find((r) => r.id === recipientId)

  const defaultMethod = sendMethods.find((m) => m.isDefault) || sendMethods[0]
  const usesBitbanker =
    sendCurrency === "RUB" && String(defaultMethod?.provider || "").toLowerCase() === "bitbanker"
  /** RUB send: assume Bitbanker pricing until payment methods finish loading (avoids “Free” flash). */
  const bitbankerLiveFees =
    usesBitbanker || (sendCurrency === "RUB" && sendMethodsLoading)

  const {
    preview: bitbankerPreview,
    notice: quoteNotice,
    loading: quotePreviewLoading,
    feesConfirmed,
  } = useBitbankerQuotePreview({
    enabled: bitbankerLiveFees && Boolean(user?.id),
    sendAmount,
    sendCurrency,
    receiveCurrency,
  })

  const bitbankerGateActive =
    Boolean(eligibility) && eligibility?.status !== "unconfigured" && !eligibility?.isVerifiedForSbp

  const sendNum = Number(sendAmount)
  const minSend = minSendAmountForCurrency(sendCurrency)
  const meetsMin = minSend == null || (Number.isFinite(sendNum) && sendNum >= minSend)

  const processingFeeAmount =
    bitbankerLiveFees && bitbankerPreview
      ? roundMoney(bitbankerPreview.feeAmount + bitbankerPreview.paymentProcessingFee)
      : quote?.feeAmount ?? 0

  const displayQuote = quote
    ? {
        ...quote,
        receiveAmount: bitbankerPreview?.receiveAmount ?? quote.receiveAmount,
        feeAmount: processingFeeAmount,
        totalAmount: bitbankerPreview?.totalAmount ?? quote.totalAmount,
        rate: bitbankerPreview?.exchangeRate ?? quote.rate,
      }
    : null

  const canAmount = Boolean(
    displayQuote && meetsMin && (!bitbankerLiveFees || feesConfirmed),
  )

  const prevSendCurrencyRef = useRef("")
  useEffect(() => {
    if (!sendCurrency || sendCurrency === prevSendCurrencyRef.current) return
    prevSendCurrencyRef.current = sendCurrency
    setSendAmount(defaultSendAmountForCurrency(sendCurrency))
  }, [sendCurrency])

  const canRecipient = Boolean(recipientId)

  const requireVerification = () => {
    showError(t("send.mobile.verifyRequired", { defaultValue: "Complete identity verification to send money." }))
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
      showError((body as { error?: string }).error || t("send.failedAddRecipient"))
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
    if (!recipientId || !displayQuote) throw new Error("Missing recipient or quote")
    const quoteRes = await fetchWithAuth("/api/send/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sendAmount: Number(sendAmount),
        sendCurrency,
        receiveAmount: displayQuote.receiveAmount,
        receiveCurrency,
        recipientId,
        fulfillmentType: "bank_transfer",
      }),
    })
    const quoteBody = await quoteRes.json().catch(() => ({}))
    if (!quoteRes.ok) {
      const err = quoteBody as { error?: string; errorCode?: string }
      const key =
        err.errorCode === "desk_rate_not_configured"
          ? "send.quoteDeskRateNotConfigured"
          : err.errorCode === "min_contribution"
            ? "send.quoteMinContribution"
            : null
      throw new Error(key ? t(key, { defaultValue: err.error }) : err.error || "Failed to create quote")
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
    const tx = (transferBody as { transaction?: { transaction_id: string } }).transaction
    const payment = (transferBody as { payment?: BitbankerPayment }).payment
    if (!tx?.transaction_id || !payment) throw new Error("Invalid transfer response")
    setBitbankerPayment(payment)
    return tx.transaction_id
  }

  const submit = async () => {
    if (!recipientId || !displayQuote) return
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
          receiveAmount: displayQuote.receiveAmount,
          recipientId,
          fulfillmentType: "bank_transfer",
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError((body as { error?: string }).error || t("send.failedCreateTxn"))
        return
      }
      const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
      if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
    } catch (e) {
      showError(e instanceof Error ? e.message : t("send.failedCreateTxn"))
    } finally {
      setBusy(false)
    }
  }

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
      subtitle={labels.subtitle ?? t("send.sendMoneyHeroSubtitle")}
      backAriaLabel={backAria}
      keyboard
    >
      {bitbankerGateActive ? (
        <Pressable style={styles.verifyBanner} onPress={() => router.push("/verification/bitbanker" as never)}>
          <ShieldAlert size={17} color={colors.primary} strokeWidth={2.2} />
          <Text style={styles.verifyBannerTitle} numberOfLines={2}>
            {t("send.mobile.verifyBannerTitle", { defaultValue: "Verify identity to send money" })}
          </Text>
          <Text style={styles.verifyBannerAction}>{t("send.mobile.verifyBannerAction", { defaultValue: "Begin" })}</Text>
        </Pressable>
      ) : null}

      <SendStepProgress step={step} />

      {step === "amount" ? (
        <>
          <SendAmountStep
            sendAmount={sendAmount}
            onChangeAmount={setSendAmount}
            sendCurrency={sendCurrency}
            receiveCurrency={receiveCurrency}
            onChangeSendCurrency={handleSendCurrencyChange}
            onChangeReceiveCurrency={handleReceiveCurrencyChange}
            currencies={currencies}
            rates={rates}
            usesBitbanker={bitbankerLiveFees}
            bitbankerPreview={bitbankerLiveFees ? bitbankerPreview : null}
            quoteNotice={bitbankerLiveFees ? quoteNotice : null}
            quotePreviewLoading={bitbankerLiveFees ? quotePreviewLoading : false}
            bitbankerFeesConfirmed={bitbankerLiveFees ? feesConfirmed : true}
          />
          <View style={styles.footer}>
            <PrimaryButton label={t("send.continue")} onPress={goRecipient} disabled={!canAmount} />
          </View>
        </>
      ) : null}

      {step === "recipient" ? (
        <>
          <SendRecipientStep
            receiveCurrency={receiveCurrency}
            currencies={currencies}
            recipients={recipients}
            recipientId={recipientId}
            onSelectRecipient={setRecipientId}
            name={name}
            onChangeName={setName}
            account={account}
            onChangeAccount={setAccount}
            bank={bank}
            onChangeBank={setBank}
            onSaveRecipient={() => void addRecipient()}
            saveBusy={busy}
          />
          <View style={styles.footer}>
            <PrimaryButton label={t("send.continue")} onPress={() => setStep("pay")} disabled={!canRecipient} />
            <PrimaryButton label={t("send.back")} variant="ghost" onPress={() => setStep("amount")} />
          </View>
        </>
      ) : null}

      {step === "pay" && displayQuote ? (
        <>
          <SendReviewStep
            sendAmount={sendAmount}
            sendCurrency={sendCurrency}
            receiveCurrency={receiveCurrency}
            quote={displayQuote}
            processingFeeAmount={processingFeeAmount}
            recipient={selected}
            currencies={currencies}
            usesBitbanker={usesBitbanker}
            processingFeePending={bitbankerLiveFees && !feesConfirmed}
            qrData={bitbankerPayment?.qrData}
          />
          <View style={styles.footer}>
            <PrimaryButton
              label={
                usesBitbanker
                  ? t("send.mobile.createSbpPayment", { defaultValue: "Create SBP payment" })
                  : t("send.makePayment")
              }
              onPress={() => void submit()}
              busy={busy}
            />
            <PrimaryButton label={t("send.back")} variant="ghost" onPress={() => setStep("recipient")} />
          </View>
        </>
      ) : null}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderRadius: radius.row,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FDBA74",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  verifyBannerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.text,
  },
  verifyBannerAction: { fontSize: 12, fontWeight: "700", color: colors.primary },
  footer: { marginTop: 20, gap: 10 },
})
