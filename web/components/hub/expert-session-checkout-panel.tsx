"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { AlertCircle, Check, Clock, Package2, Phone, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useUserData } from "@/hooks/use-user-data"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { computeExpertFundedAmount } from "@/lib/expert-checkout-server"
import { generateTransactionId } from "@/lib/transaction-id"
import { hubPayMatchesProductCurrency, hubSyntheticSameCurrencyRateRow } from "@/lib/hub-same-currency-rate"
import { HubExpertChipLight } from "@/components/hub/hub-expert-chip-light"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CurrencyPickerPopover,
  CurrencyPickerSheet,
  CurrencyPickerTrigger,
} from "@/components/send/currency-picker-sheet"
import { SendMakePaymentStep } from "@/components/send/send-make-payment-step"
import { paymentMethodService, transactionService, userService } from "@/lib/database"
import type { Currency, ExchangeRate } from "@/types"
import { formatCurrency, getCurrencyNarrowSymbol, roundMoney } from "@/utils/currency"
import { pickDefaultPaymentMethod } from "@/lib/pick-default-payment-method"
import { cn } from "@/lib/utils"

type ExpertProfile = {
  id: string
  slug?: string | null
  display_name: string
  headline: string | null
  image_url?: string | null
}

type ExpertService = {
  id: string
  title: string
  short_description?: string | null
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
}

type Preflight = {
  slot: { id: string; slot_start: string; slot_end: string }
  service: ExpertService
  profile: ExpertProfile
}

type PaymentMethod = {
  id: string
  currency: string
  type: "bank_account" | "qr_code" | "stablecoin" | "mobile_money"
  name: string
  account_name?: string
  account_number?: string
  bank_name?: string
  routing_number?: string
  sort_code?: string
  iban?: string
  swift_bic?: string
  qr_code_data?: string
  crypto_asset?: string
  crypto_network?: string
  wallet_address?: string
  instructions?: string
  is_default?: boolean
  status?: string
}

export function ExpertSessionCheckoutPanel({
  preflight,
  idempotencyKeyRef,
  onQuoteBooking,
}: {
  preflight: Preflight
  idempotencyKeyRef: React.MutableRefObject<string>
  onQuoteBooking: (opts: { message: string }) => Promise<void>
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user, userProfile, refreshUserProfile } = useAuth()
  const { currencies, exchangeRates } = useUserData()

  const svc = preflight.service
  const slot = preflight.slot
  const expert = preflight.profile

  const [step, setStep] = useState(1)
  const [transactionIdNote, setTransactionIdNote] = useState("")
  const [sendCurrency, setSendCurrency] = useState("")
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [message, setMessage] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [quoteSubmitting, setQuoteSubmitting] = useState(false)

  const isQuote = svc.pricing_type === "quote"

  const fundedMeta = useMemo(() => {
    if (isQuote) return null
    try {
      return computeExpertFundedAmount({
        pricing_type: svc.pricing_type,
        hourly_rate: svc.hourly_rate,
        hourly_currency: svc.hourly_currency,
        fixed_amount: svc.fixed_amount,
        fixed_currency: svc.fixed_currency,
        slot_start: slot.slot_start,
        slot_end: slot.slot_end,
      })
    } catch {
      return null
    }
  }, [isQuote, svc, slot.slot_end, slot.slot_start])

  const receiveCurrency = fundedMeta?.fundedCurrency ?? ""
  const fundedReceiveAmount = fundedMeta?.fundedAmount ?? 0

  const hubFeeReceiveAmount = useMemo(() => {
    if (!isQuote && fundedReceiveAmount > 0) return 0
    return 0
  }, [fundedReceiveAmount, isQuote])

  const subtotalReceiveAmount = useMemo(
    () => roundMoney(fundedReceiveAmount + hubFeeReceiveAmount),
    [fundedReceiveAmount, hubFeeReceiveAmount],
  )

  const rateRow = useMemo(() => {
    if (!sendCurrency || !receiveCurrency) return null
    if (hubPayMatchesProductCurrency(sendCurrency, receiveCurrency)) {
      return hubSyntheticSameCurrencyRateRow(sendCurrency, receiveCurrency)
    }
    return (
      (exchangeRates as ExchangeRate[]).find(
        (row) => row.from_currency === sendCurrency && row.to_currency === receiveCurrency,
      ) || null
    )
  }, [exchangeRates, sendCurrency, receiveCurrency])

  const pricingPreview = useMemo(() => {
    if (!rateRow || isQuote || fundedReceiveAmount <= 0) return null
    const rate = Number(rateRow.rate) || 0
    if (rate <= 0) return null
    const productPrice = roundMoney(fundedReceiveAmount)
    const hubFeeReceive = roundMoney((productPrice * 0) / 100)
    const subtotalReceive = roundMoney(productPrice + hubFeeReceive)
    const orderTotalSend = roundMoney(subtotalReceive / rate)
    let transferFee = 0
    if (rateRow.fee_type === "fixed") transferFee = Number(rateRow.fee_amount) || 0
    else if (rateRow.fee_type === "percentage") {
      transferFee = (orderTotalSend * (Number(rateRow.fee_amount) || 0)) / 100
    }
    const fee = roundMoney(transferFee)
    return {
      productPrice,
      hubFeeReceive,
      subtotalReceive,
      orderTotalSend,
      fee,
      total: roundMoney(orderTotalSend + fee),
      exchangeRate: rate,
    }
  }, [fundedReceiveAmount, isQuote, rateRow])

  const liveSpotRate = useMemo(() => {
    if (!rateRow) return null
    const r = Number(rateRow.rate) || 0
    return r > 0 && Number.isFinite(r) ? r : null
  }, [rateRow])

  const corridorFeeRow = useMemo(() => {
    if (!rateRow || !sendCurrency) return { text: "—", isFree: false }
    if (pricingPreview) {
      const fee = pricingPreview.fee
      return { text: fee === 0 ? t("send.free") : formatCurrency(fee, sendCurrency), isFree: fee === 0 }
    }
    if (rateRow.fee_type === "free") return { text: t("send.free"), isFree: true }
    if (rateRow.fee_type === "fixed") {
      const amt = Number(rateRow.fee_amount) || 0
      if (amt === 0) return { text: t("send.free"), isFree: true }
      return { text: formatCurrency(amt, sendCurrency), isFree: false }
    }
    if (rateRow.fee_type === "percentage") {
      const pct = Number(rateRow.fee_amount) || 0
      if (pct === 0) return { text: t("send.free"), isFree: true }
      const pctStr = Number.isInteger(pct) ? String(pct) : String(pct)
      return {
        text: t("hub.checkout.exchangeFeePercentConfigured", { defaultValue: "{{pct}}%", pct: pctStr }),
        isFree: false,
      }
    }
    return { text: t("send.free"), isFree: true }
  }, [pricingPreview, rateRow, sendCurrency, t])

  const sendCurrencyData = useMemo(
    () => currencies.find((c) => c.code === sendCurrency) || null,
    [currencies, sendCurrency],
  )

  const defaultPaymentMethod = useMemo(
    () => pickDefaultPaymentMethod(paymentMethods, sendCurrency),
    [paymentMethods, sendCurrency],
  )

  useEffect(() => {
    if (!currencies.length || sendCurrency) return
    const preferred =
      currencies.find((c) => c.can_send !== false && c.code === "RUB") ||
      currencies.find((c) => c.can_send !== false && c.code === (userProfile?.base_currency || "")) ||
      currencies.find((c) => c.can_send !== false && c.code === "USD") ||
      currencies.find((c) => c.can_send !== false)
    if (preferred) setSendCurrency(preferred.code)
  }, [currencies, sendCurrency, userProfile?.base_currency])

  useEffect(() => {
    const fullName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ").trim()
    if (fullName) setContactName((prev) => prev || fullName)
  }, [userProfile?.first_name, userProfile?.last_name])

  useEffect(() => {
    if (userProfile?.phone) setContactPhone((prev) => prev || userProfile.phone || "")
  }, [userProfile?.phone])

  useEffect(() => {
    let cancelled = false
    if (!sendCurrency) {
      setPaymentMethods([])
      return
    }
    ;(async () => {
      try {
        const methods = ((await paymentMethodService.getByCurrency(sendCurrency)) || []) as PaymentMethod[]
        if (cancelled) return
        const activeMethods = methods.filter((m) => m.status === "active")
        setPaymentMethods(activeMethods)
      } catch {
        if (!cancelled) {
          setPaymentMethods([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sendCurrency])

  const handleCopy = async (text: string, key: string) => {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setCopiedStates((prev) => ({ ...prev, [key]: false })), 1500)
    } catch {
      setCopiedStates((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadError(null)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t("send.fileTooLarge"))
      return
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t("send.fileTypeInvalid"))
      return
    }
    setUploadedFile(file)
    setIsUploading(true)
    setUploadProgress(0)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 100)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFileSelect(file)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFileSelect(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDismissUploadError = () => {
    setUploadError(null)
  }

  const persistMissingPhone = async () => {
    if (!user?.id || !contactPhone.trim() || userProfile?.phone?.trim()) return
    try {
      await userService.updateProfile(user.id, { phone: contactPhone.trim() })
      await refreshUserProfile()
    } catch (e) {
      console.error("Expert checkout phone save", e)
    }
  }

  useEffect(() => {
    if (step === 3 && !transactionIdNote) {
      setTransactionIdNote(generateTransactionId())
    }
  }, [step, transactionIdNote])

  const canContinueStep1 = Boolean(
    user?.email_confirmed_at && pricingPreview && sendCurrency && fundedMeta && !isQuote,
  )

  const handleContinueCheckout = () => {
    setError(null)
    if (step === 1) {
      if (!user?.email_confirmed_at) {
        setError(t("hub.checkout.errors.verifyEmail"))
        return
      }
      if (!canContinueStep1) {
        setError(t("hub.checkout.errors.checkAmount"))
        return
      }
      setStep(2)
      return
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setError(t("hub.checkout.errors.namePhoneRequired"))
      return
    }
    void persistMissingPhone()
    setStep(3)
  }

  const canPay = Boolean(
    !isQuote &&
      contactName.trim() &&
      contactPhone.trim() &&
      pricingPreview &&
      defaultPaymentMethod?.id &&
      sendCurrency &&
      fundedMeta &&
      user?.email_confirmed_at,
  )

  const handlePay = async () => {
    if (!canPay || !pricingPreview || !fundedMeta) return
    setSubmitting(true)
    setError(null)
    await persistMissingPhone()
    try {
      const res = await fetchWithAuth("/api/expert/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expert_service_slot_id: slot.id,
          sendCurrency,
          receiveCurrency: fundedMeta.fundedCurrency,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          message: message.trim() || null,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t("hub.checkout.errors.paymentSetupFailed"))

      const transactionId = data.transaction?.transaction_id as string | undefined
      if (!transactionId) throw new Error(t("hub.checkout.errors.missingTransaction"))

      if (uploadedFile && uploadProgress === 100 && !isUploading) {
        setTimeout(async () => {
          try {
            await transactionService.uploadReceipt(transactionId, uploadedFile)
          } catch (receiptUploadError) {
            console.error("Expert checkout receipt upload:", receiptUploadError)
          }
        }, 100)
      }

      router.replace(`/hub/orders/${String(transactionId).toLowerCase()}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("hub.checkout.errors.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuoteSubmit = async () => {
    if (!contactName.trim()) {
      setError(t("experts.bookingWizard.nameRequired"))
      return
    }
    setQuoteSubmitting(true)
    setError(null)
    try {
      await onQuoteBooking({ message: message.trim() })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("experts.booking.failed"))
    } finally {
      setQuoteSubmitting(false)
    }
  }

  const sessionTimeLabel = `${new Date(slot.slot_start).toLocaleString()} — ${new Date(slot.slot_end).toLocaleString()}`

  if (isQuote) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        {error ? (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base">{svc.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <HubExpertChipLight
              expert={{
                id: expert.id,
                slug: expert.slug,
                display_name: expert.display_name,
                image_url: expert.image_url ?? null,
                is_verified: false,
              }}
              verifiedAriaLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
            />
            <p className="text-muted-foreground">{t("experts.bookingWizard.quoteNote")}</p>
            <p className="font-medium text-foreground">{sessionTimeLabel}</p>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("hub.checkout.fullName")}</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label>{t("hub.checkout.phone")}</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} autoComplete="tel" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("experts.booking.message")}</Label>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button className="w-full rounded-xl" disabled={quoteSubmitting} onClick={() => void handleQuoteSubmit()}>
          {quoteSubmitting ? t("experts.booking.saving") : t("experts.bookingWizard.confirmBooking")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      {error ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {step === 1 ? (
            <Card className="py-4">
              <CardContent className="space-y-6 pt-0">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-5 text-white">
                    <p className="text-xl font-bold leading-tight sm:text-2xl">
                      {t("experts.bookingWizard.heroBookService", { title: svc.title })}
                    </p>
                    {(svc.short_description || "").trim() ? (
                      <p className="mt-3 max-w-2xl text-sm/6 text-orange-50">{svc.short_description}</p>
                    ) : null}
                    <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="shrink-0 text-[11px] font-medium sm:text-xs text-orange-100/95">
                        {t("experts.bookingWizard.providedBy")}
                      </span>
                      <div className="min-w-0 [&_a]:text-orange-50 [&_a:hover]:text-white [&_span]:text-orange-50 [&_span:hover]:text-white">
                        <HubExpertChipLight
                          expert={{
                            id: expert.id,
                            slug: expert.slug,
                            display_name: expert.display_name,
                            image_url: expert.image_url ?? null,
                            is_verified: false,
                          }}
                          verifiedAriaLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
                          className="text-orange-50 hover:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium leading-snug text-gray-700">{t("hub.checkout.servicePrice")}</h3>
                    <div className="rounded-xl bg-gray-50 px-4 py-4">
                      <div className="text-app-money-input font-bold text-gray-900">
                        {formatCurrency(fundedReceiveAmount, receiveCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium leading-snug text-gray-700">{t("hub.checkout.payWith")}</h3>
                  <div className="rounded-xl bg-gray-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-app-money-input font-bold text-gray-900">
                          {pricingPreview
                            ? formatCurrency(pricingPreview.total, sendCurrency)
                            : formatCurrency(fundedReceiveAmount, sendCurrency || receiveCurrency)}
                        </div>
                      </div>
                      <div className="shrink-0 md:hidden">
                        <CurrencyPickerTrigger
                          selectedCurrency={sendCurrency}
                          onOpen={() => setSendDropdownOpen(true)}
                          currencies={currencies}
                        />
                        <CurrencyPickerSheet
                          open={sendDropdownOpen}
                          onOpenChange={setSendDropdownOpen}
                          selectedCurrency={sendCurrency}
                          onSelect={setSendCurrency}
                          currencies={currencies}
                          type="send"
                        />
                      </div>
                      <div className="hidden shrink-0 md:block">
                        <CurrencyPickerPopover
                          selectedCurrency={sendCurrency}
                          onSelect={setSendCurrency}
                          currencies={currencies}
                          type="send"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-gray-200/80 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600">{t("hub.checkout.hubFee")}</span>
                        <span className="font-medium text-green-600">{t("send.free")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600">{t("send.rate")}</span>
                        <span className="text-sm font-medium text-primary">
                          {liveSpotRate != null && sendCurrency && receiveCurrency
                            ? `1 ${sendCurrency} = ${liveSpotRate.toFixed(2)} ${receiveCurrency}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600">{t("send.fee")}</span>
                        <span className={cn("font-medium", corridorFeeRow.isFree ? "text-green-600" : "text-gray-900")}>
                          {corridorFeeRow.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!user?.email_confirmed_at ? (
                  <p className="text-sm text-amber-700">{t("hub.checkout.errors.verifyEmail")}</p>
                ) : null}

                <div className="sticky bottom-0 z-10 -mx-6 mt-2 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 lg:static lg:z-auto lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                  <Button
                    type="button"
                    onClick={() => handleContinueCheckout()}
                    className="min-h-12 w-full rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                    disabled={!canContinueStep1}
                  >
                    {t("hub.checkout.continue")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("hub.checkout.contactDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("hub.checkout.fullName")}</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("hub.checkout.phone")}</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} autoComplete="tel" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("experts.booking.message")}</Label>
                  <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="min-h-12 flex-1">
                    {t("hub.checkout.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleContinueCheckout()}
                    className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                  >
                    {t("hub.checkout.continue")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 3 ? (
            <>
              {!user?.email_confirmed_at ? (
                <p className="mb-3 text-sm text-amber-700">{t("hub.checkout.errors.verifyEmail")}</p>
              ) : null}
              <SendMakePaymentStep
                sendCurrency={sendCurrency}
                sendCurrencyData={sendCurrencyData}
                transactionIdNote={transactionIdNote}
                totalToPay={pricingPreview?.total ?? 0}
                transferTitle={t("send.transferLine", { amount: formatCurrency(pricingPreview?.total || 0, sendCurrency) })}
                transferSubtitle={
                  pricingPreview && pricingPreview.fee > 0 ? (
                    <p className="text-xs text-gray-600">
                      {t("send.sendAmountPlusFee", {
                        send: formatCurrency(pricingPreview.orderTotalSend, sendCurrency),
                        fee: formatCurrency(pricingPreview.fee, sendCurrency),
                      })}
                    </p>
                  ) : undefined
                }
                activePaymentMethodsCount={paymentMethods.length}
                defaultMethod={defaultPaymentMethod}
                copiedStates={copiedStates}
                onCopy={handleCopy}
                showInstructionAmountFeeBreakdown={Boolean(pricingPreview && pricingPreview.fee > 0)}
                instructionBreakdownPrincipal={pricingPreview?.orderTotalSend}
                instructionBreakdownFee={pricingPreview?.fee}
                fileInputRef={fileInputRef}
                uploadedFile={uploadedFile}
                uploadError={uploadError}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                isDragOver={isDragOver}
                onFileInputChange={handleFileInputChange}
                onUploadClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onRemoveFile={handleRemoveFile}
                onDismissUploadError={handleDismissUploadError}
                onBack={() => setStep(2)}
                onPaid={() => void handlePay()}
                submitting={submitting}
                payDisabled={!pricingPreview || !defaultPaymentMethod?.id || !user?.email_confirmed_at}
                submittingLabel={t("hub.checkout.creating")}
                idlePaidLabel={t("send.ivePaid")}
              />
            </>
          ) : null}
        </div>

        <div className="min-w-0">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-lg">{t("hub.checkout.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 text-gray-600">{t("hub.checkout.productLabel")}</span>
                  <span className="text-right font-semibold text-gray-900">{svc.title}</span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 text-gray-600">{t("hub.checkout.servicePrice")}</span>
                  <span className="shrink-0 text-right font-semibold tabular-nums">
                    {formatCurrency(fundedReceiveAmount, receiveCurrency)}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 text-gray-600">{t("hub.checkout.hubFee")}</span>
                  <span className="shrink-0 text-right font-semibold tabular-nums text-green-600">{t("send.free")}</span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 text-gray-600">{t("send.fee")}</span>
                  <span
                    className={cn(
                      "shrink-0 text-right font-semibold tabular-nums",
                      corridorFeeRow.isFree ? "text-green-600" : "text-gray-900",
                    )}
                  >
                    {corridorFeeRow.text}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 text-gray-600">{t("hub.checkout.subtotal")}</span>
                  <span className="shrink-0 text-right font-semibold tabular-nums text-gray-900">
                    {formatCurrency(subtotalReceiveAmount, receiveCurrency)}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2 border-t pt-2">
                  <span className="min-w-0 text-gray-600">{t("hub.checkout.totalToPay")}</span>
                  <span className="shrink-0 text-right text-[clamp(1rem,2.8vmin,1.125rem)] font-semibold tabular-nums">
                    {pricingPreview ? formatCurrency(pricingPreview.total, sendCurrency) : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{t("experts.bookingWizard.sessionTime")}</span>
                </div>
                <p className="text-sm text-gray-700">{sessionTimeLabel}</p>
                {contactName.trim() ? (
                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                    <span>{contactName}</span>
                  </div>
                ) : null}
                {contactPhone.trim() ? (
                  <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                    <span>{contactPhone}</span>
                  </div>
                ) : null}
                {message.trim() ? (
                  <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                    <Package2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                    <span>{message.trim()}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
