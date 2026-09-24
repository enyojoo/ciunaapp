"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { AlertCircle, Check, Clock, CreditCard, Landmark, MapPin, Package2, Phone, Search, UserRound, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useUserData } from "@/hooks/use-user-data"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  CurrencyPickerPopover,
  CurrencyPickerSheet,
  CurrencyPickerTrigger,
  isCurrencyPickerEnabled,
} from "@/components/send/currency-picker-sheet"
import { SendMakePaymentStep, type SendPaymentMethodRecord } from "@/components/send/send-make-payment-step"
import { useHubCartByLine } from "@/lib/hub-cart-client"
import { computeHubCartTotals } from "@/lib/hub-cart-pricing"
import { hubPayMatchesProductCurrency, hubSyntheticSameCurrencyRateRow } from "@/lib/hub-same-currency-rate"
import { fetchPublicPlatformFlags } from "@/lib/fetch-public-platform-flags"
import type { Currency, ExchangeRate } from "@/types"
import { deliveryAddressService, paymentMethodService, transactionService, userService } from "@/lib/database"
import { generateTransactionId } from "@/lib/transaction-id"
import { formatCurrency } from "@/utils/currency"
import { pickDefaultPaymentMethod } from "@/lib/pick-default-payment-method"
import { hubLineHomePath, hubCartPath } from "@/lib/hub-public-paths"

export function HubCartCheckoutPage({ lineSlug }: { lineSlug: "food" | "mart" }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth()
  const { currencies, exchangeRates, deliveryAddresses, refreshDeliveryAddresses } = useUserData()
  const { cart, loading: cartLoading } = useHubCartByLine(lineSlug)
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  )

  const [step, setStep] = useState(1)
  const [sendCurrency, setSendCurrency] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState("")
  const [deliverySearch, setDeliverySearch] = useState("")
  const [comment, setComment] = useState("")
  const [isAddDeliveryDialogOpen, setIsAddDeliveryDialogOpen] = useState(false)
  const [newDeliveryData, setNewDeliveryData] = useState({ addressLine: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<SendPaymentMethodRecord[]>([])
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [transactionIdNote, setTransactionIdNote] = useState("")
  const [payChoice, setPayChoice] = useState<"manual" | "yookassa">("manual")
  const [yookassaEnabled, setYookassaEnabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(() => (cart?.items || []).filter((i) => !i.unavailable && i.product), [cart])
  const receiveCurrency = items[0]?.product?.fixed_currency || ""
  const backHref = hubCartPath(lineSlug)

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login")
  }, [user, authLoading, router])

  useEffect(() => {
    void fetchPublicPlatformFlags().then((f) => setYookassaEnabled(f.yookassaEnabled))
  }, [])

  useEffect(() => {
    if (!cartLoading && cart && items.length === 0) {
      router.replace(backHref)
    }
  }, [cartLoading, cart, items.length, router, backHref])

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
    if (step === 3 && !transactionIdNote) setTransactionIdNote(generateTransactionId())
  }, [step, transactionIdNote])

  useEffect(() => {
    // Online payment only ever applies in RUB — fall back to manual for any other currency.
    if (sendCurrency.toUpperCase() !== "RUB" && payChoice === "yookassa") setPayChoice("manual")
  }, [sendCurrency, payChoice])

  const sendCurrencyData = useMemo(
    () => currencies.find((c) => c.code === sendCurrency) || null,
    [currencies, sendCurrency],
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

  const liveSpotRate = useMemo(() => {
    if (!rateRow) return null
    const r = Number(rateRow.rate) || 0
    return r > 0 && Number.isFinite(r) ? r : null
  }, [rateRow])

  useEffect(() => {
    let cancelled = false
    if (!sendCurrency) {
      setPaymentMethods([])
      return
    }
    ;(async () => {
      try {
        const methods = ((await paymentMethodService.getByCurrency(sendCurrency)) || []) as SendPaymentMethodRecord[]
        if (!cancelled) setPaymentMethods(methods.filter((m) => (m as { status?: string }).status === "active"))
      } catch {
        if (!cancelled) setPaymentMethods([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sendCurrency])

  const defaultPaymentMethod = useMemo(
    () => pickDefaultPaymentMethod(paymentMethods, sendCurrency),
    [paymentMethods, sendCurrency],
  )

  const filteredDeliveryAddresses = useMemo(() => {
    const q = deliverySearch.trim().toLowerCase()
    if (!q) return deliveryAddresses
    return deliveryAddresses.filter((a) => {
      const line = String(a.address_line || "").toLowerCase()
      const phone = String(a.phone || "").toLowerCase()
      return line.includes(q) || phone.includes(q)
    })
  }, [deliveryAddresses, deliverySearch])

  const selectedDeliveryAddress = useMemo(
    () => deliveryAddresses.find((a) => a.id === selectedDeliveryAddressId) || null,
    [deliveryAddresses, selectedDeliveryAddressId],
  )

  const fulfillmentType = items[0]?.product?.fulfillment_type === "in_person" ? "in_person" : "vendor"

  const canContinueStep1 = () => Boolean(sendCurrency && receiveCurrency && rateRow && totals)

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

  const persistMissingPhone = async () => {
    if (!user?.id || !contactPhone.trim() || userProfile?.phone?.trim()) return
    try {
      await userService.updateProfile(user.id, { phone: contactPhone.trim() })
      await refreshUserProfile()
    } catch (e) {
      console.error("Failed to save phone from cart checkout", e)
    }
  }

  const handleAddDeliveryAddress = async () => {
    if (!userProfile?.id) return
    const line = newDeliveryData.addressLine.trim()
    const phone = newDeliveryData.phone.trim()
    if (!line || !phone) return
    try {
      const row = await deliveryAddressService.create(userProfile.id, { addressLine: line, phone })
      await refreshDeliveryAddresses()
      setSelectedDeliveryAddressId(row.id)
      setNewDeliveryData({ addressLine: "", phone: "" })
      setIsAddDeliveryDialogOpen(false)
    } catch (e) {
      console.error("Error adding delivery address:", e)
      setError(t("send.failedAddDelivery"))
    }
  }

  const handleContinue = async () => {
    setError(null)
    if (step === 1) {
      if (!user?.email_confirmed_at) {
        setError(t("hub.checkout.errors.verifyEmail"))
        return
      }
      if (!canContinueStep1()) {
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
    if (fulfillmentType === "in_person" && !selectedDeliveryAddressId) {
      setError(t("hub.checkout.errors.deliveryAddressRequired", { defaultValue: "Select a delivery address." }))
      return
    }
    await persistMissingPhone()
    setStep(3)
  }

  const handlePay = async () => {
    if (!cart || !userProfile?.id || !totals) return
    if (payChoice === "manual" && !defaultPaymentMethod?.id) {
      setError(t("hub.checkout.errors.noPaymentMethodForCurrency", { currency: sendCurrency }))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const line = fulfillmentType === "in_person" ? selectedDeliveryAddress?.address_line?.trim() || null : null
      const res = await fetchWithAuth("/api/hub/checkout", {
        method: "POST",
        body: JSON.stringify({
          cartId: cart.id,
          sendCurrency,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          deliveryAddressLine: line,
          deliveryAddressId: fulfillmentType === "in_person" ? selectedDeliveryAddressId || null : null,
          formAnswers: comment.trim() ? { comment: comment.trim() } : {},
          paymentMethod: payChoice,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t("hub.checkout.errors.paymentSetupFailed"))

      const transactionId = data.transaction?.transaction_id
      if (!transactionId) throw new Error(t("hub.checkout.errors.missingTransaction"))

      if (payChoice === "yookassa") {
        router.replace(`/pay/${String(transactionId).toLowerCase()}`)
        return
      }

      if (uploadedFile && uploadProgress === 100 && !isUploading) {
        setTimeout(async () => {
          try {
            await transactionService.uploadReceipt(transactionId, uploadedFile)
          } catch (e) {
            console.error("Error uploading receipt:", e)
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
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
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
  const handleUploadClick = () => fileInputRef.current?.click()
  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  const handleDismissUploadError = () => setUploadError(null)

  const showSkeleton = !user || (cartLoading && !cart)
  if (showSkeleton) {
    return (
      <div className="min-w-0 space-y-0">
        <AppPageHeader title={t("hub.checkout.title")} backHref={backHref} />
        <div className="px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-6xl animate-pulse space-y-6">
            <div className="h-8 w-72 rounded bg-gray-100" />
            <div className="rounded-2xl border p-6 space-y-4">
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || items.length === 0) return null // redirecting to the cart page

  return (
    <div className="min-w-0 space-y-0">
      <AppPageHeader
        title={t("hub.checkout.cartCheckoutTitle", { defaultValue: "Checkout" })}
        backHref={step === 1 ? backHref : hubLineHomePath(lineSlug)}
      />
      <div className="min-w-0 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 lg:col-span-2">
              {error ? (
                <div className="mb-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {step === 1 ? (
                <Card className="py-4">
                  <CardContent className="space-y-6 pt-0">
                    <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-5 text-white">
                      <h2 className="text-2xl font-bold leading-tight">
                        {t("hub.cart.titleWithVendor", { defaultValue: "Cart · {{vendor}}", vendor: cart.vendor?.name || "" })}
                      </h2>
                      <p className="mt-2 text-sm text-orange-50">
                        {t("hub.checkout.itemCount", { defaultValue: "{{count}} item(s)", count: items.length })}
                      </p>
                    </div>

                    <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                      {items.map((i) => (
                        <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-gray-700">
                            {i.quantity} × {i.product?.title}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">
                            {formatCurrency((totals?.lines.find((l) => l.hubProductId === i.hub_product_id)?.lineTotal) ?? 0, receiveCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-medium text-gray-700 leading-snug">{t("hub.checkout.payWith")}</h3>
                      <div className="rounded-xl bg-gray-50 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-app-money-input font-bold text-gray-900">
                            {totals ? formatCurrency(totals.total, sendCurrency) : "—"}
                          </div>
                          <div className="md:hidden shrink-0">
                            <CurrencyPickerTrigger
                              selectedCurrency={sendCurrency}
                              onOpen={() => setSendDropdownOpen(true)}
                              currencies={currencies}
                              type="send"
                              otherCurrency={receiveCurrency}
                            />
                            {isCurrencyPickerEnabled(currencies, "send", receiveCurrency) ? (
                              <CurrencyPickerSheet
                                open={sendDropdownOpen}
                                onOpenChange={setSendDropdownOpen}
                                selectedCurrency={sendCurrency}
                                onSelect={setSendCurrency}
                                currencies={currencies}
                                type="send"
                                otherCurrency={receiveCurrency}
                              />
                            ) : null}
                          </div>
                          <div className="hidden md:block shrink-0">
                            <CurrencyPickerPopover
                              selectedCurrency={sendCurrency}
                              onSelect={setSendCurrency}
                              currencies={currencies}
                              type="send"
                              otherCurrency={receiveCurrency}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 border-t border-gray-200/80 pt-4 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">{t("hub.checkout.subtotal")}</span>
                            <span className="font-medium text-gray-900">
                              {totals ? formatCurrency(totals.subtotalReceive, receiveCurrency) : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">{t("hub.checkout.hubFee")}</span>
                            <span className={totals?.hubFeeReceive === 0 ? "font-medium text-green-600" : "font-medium text-gray-900"}>
                              {totals ? (totals.hubFeeReceive === 0 ? t("send.free") : formatCurrency(totals.hubFeeReceive, receiveCurrency)) : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">{t("send.rate")}</span>
                            <span className="font-medium text-primary">
                              {liveSpotRate != null ? `1 ${sendCurrency} = ${liveSpotRate.toFixed(2)} ${receiveCurrency}` : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">{t("send.fee")}</span>
                            <span className={totals?.transferFee === 0 ? "font-medium text-green-600" : "font-medium text-gray-900"}>
                              {totals ? (totals.transferFee === 0 ? t("send.free") : formatCurrency(totals.transferFee, sendCurrency)) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sticky bottom-0 z-10 -mx-6 mt-2 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 lg:static lg:z-auto lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                      <Button
                        type="button"
                        onClick={handleContinue}
                        className="min-h-12 w-full rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                        disabled={!canContinueStep1()}
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
                        <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("hub.checkout.phone")}</Label>
                        <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      </div>
                    </div>

                    {fulfillmentType === "in_person" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{t("send.deliveryAddressSection")}</h3>
                            <p className="text-sm text-gray-500">
                              {t("hub.checkout.inPersonAddressHint", {
                                defaultValue: "Choose a saved address for this in-person fulfillment.",
                              })}
                            </p>
                          </div>
                          <Dialog open={isAddDeliveryDialogOpen} onOpenChange={setIsAddDeliveryDialogOpen}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" className="rounded-xl">
                                {t("send.addDeliveryAddress")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md">
                              <DialogHeader>
                                <DialogTitle>{t("send.addDeliveryAddress")}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="cart-delivery-address">{t("send.deliveryAddressLine")} *</Label>
                                  <Textarea
                                    id="cart-delivery-address"
                                    rows={3}
                                    value={newDeliveryData.addressLine}
                                    onChange={(e) => setNewDeliveryData((prev) => ({ ...prev, addressLine: e.target.value }))}
                                    placeholder={t("send.deliveryAddressLinePlaceholder")}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cart-delivery-phone">{t("send.deliveryPhone")} *</Label>
                                  <Input
                                    id="cart-delivery-phone"
                                    value={newDeliveryData.phone}
                                    onChange={(e) => setNewDeliveryData((prev) => ({ ...prev, phone: e.target.value }))}
                                    placeholder={t("send.deliveryPhonePlaceholder")}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  className="w-full bg-primary hover:bg-primary/90"
                                  disabled={!newDeliveryData.addressLine.trim() || !newDeliveryData.phone.trim()}
                                  onClick={() => void handleAddDeliveryAddress()}
                                >
                                  {t("send.saveDeliveryAddress")}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            value={deliverySearch}
                            onChange={(e) => setDeliverySearch(e.target.value)}
                            placeholder={t("send.searchDeliveryAddresses")}
                            className="h-11 rounded-xl border-0 bg-gray-50 pl-9"
                          />
                        </div>

                        <div className="max-h-64 space-y-2 overflow-y-auto">
                          {filteredDeliveryAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedDeliveryAddressId(addr.id)}
                              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                                selectedDeliveryAddressId === addr.id
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">{addr.address_line}</p>
                                <p className="text-xs text-gray-500">{addr.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label>{t("hub.checkout.comment", { defaultValue: "Note (optional)" })}</Label>
                      <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="min-h-12 flex-1">
                        {t("hub.checkout.back")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleContinue()}
                        className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                      >
                        {t("hub.checkout.continue")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {step === 3 && yookassaEnabled && sendCurrency.toUpperCase() === "RUB" ? (
                <Card className="mb-4">
                  <CardContent className="grid grid-cols-2 gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setPayChoice("manual")}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                        payChoice === "manual" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <Landmark className="h-5 w-5" />
                      {t("hub.checkout.payManual", { defaultValue: "Bank transfer" })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayChoice("yookassa")}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                        payChoice === "yookassa" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      {t("hub.checkout.payOnline", { defaultValue: "Pay online" })}
                    </button>
                  </CardContent>
                </Card>
              ) : null}

              {step === 3 && payChoice === "yookassa" ? (
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <p className="text-sm text-gray-600">
                      {t("hub.checkout.onlinePayHint", {
                        defaultValue: "You'll be taken to a secure payment page to pay by card or SBP.",
                      })}
                    </p>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} className="min-h-12 flex-1">
                        {t("hub.checkout.back")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handlePay()}
                        disabled={submitting || !totals}
                        className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                      >
                        {submitting
                          ? t("hub.checkout.creating")
                          : `${t("hub.checkout.payOnline", { defaultValue: "Pay online" })} · ${totals ? formatCurrency(totals.total, sendCurrency) : ""}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {step === 3 && payChoice === "manual" ? (
                <SendMakePaymentStep
                  sendCurrency={sendCurrency}
                  sendCurrencyData={sendCurrencyData as Currency | null}
                  transactionIdNote={transactionIdNote}
                  totalToPay={totals?.total ?? 0}
                  transferTitle={t("send.transferLine", { amount: formatCurrency(totals?.total || 0, sendCurrency) })}
                  transferSubtitle={
                    totals && totals.transferFee > 0 ? (
                      <p className="text-xs text-gray-600">
                        {t("send.sendAmountPlusFee", {
                          send: formatCurrency(totals.totalSend, sendCurrency),
                          fee: formatCurrency(totals.transferFee, sendCurrency),
                        })}
                      </p>
                    ) : undefined
                  }
                  activePaymentMethodsCount={paymentMethods.length}
                  defaultMethod={defaultPaymentMethod}
                  copiedStates={copiedStates}
                  onCopy={handleCopy}
                  showInstructionAmountFeeBreakdown={Boolean(totals && totals.transferFee > 0)}
                  instructionBreakdownPrincipal={totals?.totalSend}
                  instructionBreakdownFee={totals?.transferFee}
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
                  payDisabled={!totals || !defaultPaymentMethod?.id}
                  submittingLabel={t("hub.checkout.creating")}
                  idlePaidLabel={t("send.ivePaid")}
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <Card className="lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="text-lg">{t("hub.checkout.orderSummary", { defaultValue: "Order summary" })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {items.map((i) => (
                      <div key={i.id} className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-gray-600">
                          {i.quantity} × {i.product?.title}
                        </span>
                        <span className="shrink-0 text-right font-semibold tabular-nums">
                          {formatCurrency((totals?.lines.find((l) => l.hubProductId === i.hub_product_id)?.lineTotal) ?? 0, receiveCurrency)}
                        </span>
                      </div>
                    ))}
                    <div className="flex min-w-0 items-start justify-between gap-2 border-t pt-2">
                      <span className="min-w-0 text-gray-600">{t("hub.checkout.totalToPay", { defaultValue: "Total to Pay" })}</span>
                      <span className="shrink-0 text-right text-[clamp(1rem,2.8vmin,1.125rem)] font-semibold tabular-nums">
                        {totals ? formatCurrency(totals.total, sendCurrency) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{t("hub.checkout.fulfillmentSummary", { defaultValue: "Fulfillment" })}</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      {step >= 2 && contactName ? (
                        <div className="flex items-start gap-2 text-gray-700">
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                          <span>{contactName}</span>
                        </div>
                      ) : null}
                      {step >= 2 && contactPhone ? (
                        <div className="flex items-start gap-2 text-gray-700">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                          <span>{contactPhone}</span>
                        </div>
                      ) : null}
                      {fulfillmentType === "in_person" && step >= 2 && selectedDeliveryAddress?.address_line ? (
                        <div className="flex items-start gap-2 text-gray-700">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                          <span>{selectedDeliveryAddress.address_line}</span>
                        </div>
                      ) : null}
                      {step >= 2 && comment.trim() ? (
                        <div className="flex items-start gap-2 text-gray-700">
                          <Package2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                          <span>{comment.trim()}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
