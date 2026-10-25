import { useCallback, useEffect, useRef, useState } from "react"
import { limitMessage } from "@/lib/limit-message"
import { checkAmount, limitRange, type CurrentLimit } from "@/lib/limit-check"
import { authJson } from "@/lib/social-api"
import { useCachedQuery } from "@/lib/use-cached-query"
import { formatMoney as formatMoneyText, formatCardPrice } from "@/lib/money"
import { SendDesktopFrame, SendQuoteAside, SendStepper, SidePanel } from "@/components/send/send-desktop"
import { maskAccount } from "@/lib/mask-account"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
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
import { seedTransactionCache } from "@/lib/use-transaction"
import { useSendPaymentMethods } from "@/lib/use-send-payment-methods"
import { isSendVerificationGateEnabled } from "@/lib/send-verification-gate"
import type { CombinedTransaction } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

type BitbankerPayment = {
  amount: number
  link: string | null
  qrData: string | null
}

export default function SendScreen() {
  const { t, i18n } = useTranslation("app")
  const router = useRouter()
  const sendLine = useHubServiceLine("send")
  const labels = hubServiceLineShellLabels(
    "send",
    sendLine,
    t,
    t("hub.serviceLineTiles.send.title", { defaultValue: "Send Money" }),
    i18n.language,
  )
  const backAria = t("hub.backToHub", { defaultValue: "Back to Hub" })
  const { currencies, rates, loading: fxLoading, reload: reloadFx } = useFx()
  useFocusRevalidate(reloadFx)
  const { user, profile } = useAuth()
  const { isWeb, mode } = useResponsiveLayout()
  const desktop = isWeb && mode === "desktop"
  const [panelOpen, setPanelOpen] = useState(false)
  const { data: eligibility } = useBitbankerEligibility(user?.id)
  const params = useLocalSearchParams<{ from?: string; to?: string; amount?: string; recipient?: string }>()
  const [step, setStep] = useState<SendFlowStep>("amount")
  const [sendAmount, setSendAmount] = useState(SEND_DEFAULT_AMOUNT)
  const [sendCurrency, setSendCurrency] = useState("")
  const [receiveCurrency, setReceiveCurrency] = useState("")
  const { data: recipientsData, mutate: mutateRecipients } = useRecipients(user?.id)
  const recipients = recipientsData || []
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)
  const { methods: sendMethods, loading: sendMethodsLoading } = useSendPaymentMethods(sendCurrency)
  const [bitbankerPayment, setBitbankerPayment] = useState<BitbankerPayment | null>(null)
  const { data: limitState } = useCachedQuery<{ current: CurrentLimit | null }>(user ? `ciuna_limits_${user.id}` : null, () => authJson<{ current: CurrentLimit | null }>("/api/limits"), { ttlMs: 60_000 })
  const prevSendCurrencyRef = useRef("")

  useEffect(() => {
    if (currencies.length === 0) return
    if (!sendCurrency && !receiveCurrency) {
      // Repeat transfer: the detail screen passes the earlier currency pair, amount and recipient.
      if (params.from && params.to && currencies.some((c) => c.code === params.from)) {
        prevSendCurrencyRef.current = String(params.from)
        setSendCurrency(String(params.from))
        setReceiveCurrency(String(params.to))
        if (Number(params.amount) > 0) setSendAmount(String(params.amount))
        if (params.recipient) setRecipientId(String(params.recipient))
        return
      }
      const pair = initialSendReceivePair(currencies, profile?.base_currency)
      if (pair) {
        prevSendCurrencyRef.current = pair.sendCurrency
        setSendCurrency(pair.sendCurrency)
        setReceiveCurrency(pair.receiveCurrency)
        setSendAmount(defaultSendAmountForCurrency(pair.sendCurrency))
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

  const sendNum = Number(sendAmount)
  const minSend = minSendAmountForCurrency(sendCurrency)
  const meetsMin = minSend == null || (Number.isFinite(sendNum) && sendNum >= minSend)

  const bitbankerQuotePreviewActive = Boolean(
    bitbankerLiveFees && user?.id && meetsMin && sendCurrency && receiveCurrency,
  )

  const {
    preview: bitbankerPreview,
    notice: quoteNotice,
    loading: quotePreviewLoading,
    feesConfirmed,
  } = useBitbankerQuotePreview({
    enabled: bitbankerQuotePreviewActive,
    sendAmount,
    sendCurrency,
    receiveCurrency,
  })

  const bitbankerGateActive =
    isSendVerificationGateEnabled() &&
    Boolean(eligibility) &&
    eligibility?.status !== "unconfigured" &&
    !eligibility?.isVerifiedForSbp

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

  // The same limit rule the server applies, shown under the amount before the last tap.
  const limitIssue = checkAmount(limitState?.current, sendCurrency, Number(sendAmount))
  const limitText = limitIssue ? limitMessage(limitIssue, t, i18n.language) : null
  const range = limitRange(limitState?.current, sendCurrency)

  const canAmount = Boolean(
    displayQuote && meetsMin && !limitIssue && (!bitbankerLiveFees || feesConfirmed),
  )

  useEffect(() => {
    if (!sendCurrency || sendCurrency === prevSendCurrencyRef.current) return
    prevSendCurrencyRef.current = sendCurrency
    setSendAmount(defaultSendAmountForCurrency(sendCurrency))
  }, [sendCurrency])

  const sendCorridorReady = Boolean(sendCurrency && receiveCurrency && !fxLoading)

  const canRecipient = Boolean(recipientId)

  // Verification is a step of the flow, not an error: go straight to it and come back to Send afterwards.
  const requireVerification = () => {
    router.push("/verification/bitbanker?returnTo=send" as never)
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
      const limitText = limitMessage(quoteBody as { errorCode?: string; details?: Record<string, number | string> }, t, i18n.language)
      if (limitText) throw new Error(limitText)
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
      const limitText = limitMessage(transferBody as { errorCode?: string; details?: Record<string, number | string> }, t, i18n.language)
      if (limitText) throw new Error(limitText)
      throw new Error((transferBody as { error?: string }).error || "Failed to create SBP invoice")
    }
    const tx = (transferBody as { transaction?: CombinedTransaction }).transaction
    const payment = (transferBody as { payment?: BitbankerPayment }).payment
    if (!tx?.transaction_id || !payment) throw new Error("Invalid transfer response")
    seedTransactionCache([tx])
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
      <FrameIf
        desktop={desktop}
        aside={
          <SendQuoteAside
            sendAmount={sendAmount}
            sendCurrency={sendCurrency}
            receiveCurrency={receiveCurrency}
            quote={displayQuote}
            processingFeeAmount={processingFeeAmount}
            feePending={bitbankerLiveFees && !feesConfirmed}
            hidden={Boolean(limitIssue)}
            limit={limitState?.current && limitState.current.currency === sendCurrency ? limitState.current : null}
            onSeeLimits={() => router.push("/limits" as never)}
            locale={i18n.language}
          />
        }
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

      {desktop ? <SendStepper step={step} /> : <SendStepProgress step={step} />}

      {step === "amount" ? (
        !sendCorridorReady ? (
          <View style={styles.sendLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
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
            ratesLoading={fxLoading}
            limitRange={range && sendCurrency ? { min: range.min != null ? formatCardPrice(range.min, sendCurrency) : null, max: range.max != null ? formatCardPrice(range.max, sendCurrency) : null } : null}
            hideQuote={desktop}
            limitText={limitText}
            onSeeLimits={() => router.push("/limits" as never)}
          />
          <View style={styles.footer}>
            <PrimaryButton label={bitbankerGateActive ? t("send.mobile.verifyCta", { defaultValue: "Verify identity" }) : t("send.continue")} onPress={goRecipient} disabled={!canAmount} />
          </View>
        </>
        )
      ) : null}

      {step === "recipient" ? (
        <>
          {desktop ? (
            <View style={styles.recipientPick}>
              <Text style={styles.recipientPickTitle}>{t("send.mobile.recipientHeadline", { defaultValue: "Who receives it?" })}</Text>
              <View style={styles.recipientPickCard}>
                <View style={styles.recipientPickBody}>
                  <Text style={styles.recipientPickLabel}>{t("send.recipientLabel", { defaultValue: "Recipient" })}</Text>
                  <Text style={styles.recipientPickName}>{selected ? selected.full_name : t("send.aside.noRecipient", { defaultValue: "No recipient chosen yet." })}</Text>
                  {selected ? <Text style={styles.recipientPickMeta}>{[selected.bank_name, maskAccount(selected.account_number)].filter(Boolean).join(" · ")}</Text> : null}
                </View>
                <PrimaryButton label={selected ? t("send.change", { defaultValue: "Change" }) : t("send.aside.choose", { defaultValue: "Choose recipient" })} variant="secondary" onPress={() => setPanelOpen(true)} />
              </View>
            </View>
          ) : null}
          {desktop ? (
            <SidePanel open={panelOpen} title={t("send.aside.choose", { defaultValue: "Choose recipient" })} closeLabel={t("a11y.close", { defaultValue: "Close" })} onClose={() => setPanelOpen(false)}>
              <SendRecipientStep
                receiveCurrency={receiveCurrency}
                currencies={currencies}
                recipients={recipients}
                recipientId={recipientId}
                onSelectRecipient={setRecipientId}
                onRecipientCreated={(rec) => mutateRecipients((prev) => [rec, ...(prev || [])])}
              />
              <PrimaryButton label={selected ? t("send.aside.use", { name: selected.full_name, defaultValue: "Use {{name}}" }) : t("send.aside.choose", { defaultValue: "Choose recipient" })} disabled={!recipientId} onPress={() => setPanelOpen(false)} />
            </SidePanel>
          ) : (
          <SendRecipientStep
            receiveCurrency={receiveCurrency}
            currencies={currencies}
            recipients={recipients}
            recipientId={recipientId}
            onSelectRecipient={setRecipientId}
            onRecipientCreated={(rec) => mutateRecipients((prev) => [rec, ...(prev || [])])}
          />
          )}
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
            desktop={desktop}
            onChangeRecipient={() => setStep("recipient")}
          />
          <View style={styles.footer}>
            <PrimaryButton
              label={
                usesBitbanker
                  ? t("send.mobile.paySbpAmount", { amount: formatMoneyText(displayQuote.totalAmount, sendCurrency), defaultValue: "Pay {{amount}} by SBP" })
                  : t("send.payAmount", { amount: formatMoneyText(displayQuote.totalAmount, sendCurrency), defaultValue: "Pay {{amount}}" })
              }
              onPress={() => void submit()}
              busy={busy}
            />
            <PrimaryButton label={t("send.back")} variant="ghost" onPress={() => setStep("recipient")} />
          </View>
        </>
      ) : null}
      </FrameIf>
    </HubLinePageShell>
  )
}

function FrameIf({ desktop, aside, children }: { desktop: boolean; aside: React.ReactNode; children: React.ReactNode }) {
  return desktop ? <SendDesktopFrame aside={aside}>{children}</SendDesktopFrame> : <>{children}</>
}

const styles = StyleSheet.create({
  sendLoading: { paddingVertical: 48, alignItems: "center" },
  recipientPick: { gap: 12 },
  recipientPickTitle: { fontSize: typeSize.title, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
  recipientPickCard: { gap: 16, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  recipientPickBody: { gap: 2 },
  recipientPickLabel: { fontSize: typeSize.caption, fontWeight: "600", color: colors.muted },
  recipientPickName: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  recipientPickMeta: { fontSize: typeSize.meta, color: colors.muted },
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderRadius: radius.row,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.heroBody,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  verifyBannerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: typeSize.caption,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.text,
  },
  verifyBannerAction: { fontSize: typeSize.caption, fontWeight: "700", color: colors.primary },
  footer: { marginTop: 20, gap: 10 },
})
