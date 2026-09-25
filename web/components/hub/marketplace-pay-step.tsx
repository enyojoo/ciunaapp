"use client"

import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { AlertCircle, Check, Copy, CreditCard, Landmark, Upload, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { MarketplaceMethod } from "@ciuna/shared"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { Button } from "@/components/ui/button"
import { OnlinePaySkeleton } from "@/components/hub/online-pay-skeleton"
import { cn } from "@/lib/utils"

export type MarketplacePayTab = "yookassa" | "manual"

type Props = {
  methods: MarketplaceMethod[]
  payTab: MarketplacePayTab
  onPayTab: (tab: MarketplacePayTab) => void
  methodId: string
  onMethodId: (id: string) => void
  amount: number
  currency: string
  amountLabel?: string
  reference?: string | null
  onlinePayment?: { transactionId: string; confirmationToken: string | null } | null
  proofSubmitted?: boolean
  receiptFile: File | null
  onReceiptFile: (file: File | null) => void
  busy: boolean
  canAct: boolean
  onPay: () => void
  onIvePaid: () => void
  onWidgetCompleted: () => void
  onWidgetFailed: () => void
  /** Hide primary CTA when widget is already mounted (online pay in progress). */
  hideOnlineCta?: boolean
  onlineCreating?: boolean
}

function InstructionRows({
  instructions,
  reference,
}: {
  instructions: Record<string, unknown>
  reference?: string | null
}) {
  const { t } = useTranslation("app")
  const [copied, setCopied] = useState("")
  const label = (key: string) =>
    t(`marketplace.instructionsLabels.${key}`, { defaultValue: key.replaceAll("_", " ") })
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(""), 1500)
    } catch {
      /* ignore */
    }
  }
  const entries = Object.entries(instructions).filter(
    ([k, v]) => !["type", "name"].includes(k) && vStr(v),
  )
  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
      {entries.map(([k, v]) => {
        const text = String(v)
        return (
          <div key={k} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label(k)}</p>
            <div className="flex items-start gap-2">
              <p className="flex-1 break-words whitespace-pre-wrap text-sm font-medium text-gray-900">{text}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0"
                onClick={() => void copy(text, k)}
                aria-label={t("marketplace.copy", { defaultValue: "Copy" })}
              >
                {copied === k ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        )
      })}
      {reference ? (
        <div className="space-y-1 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t("marketplace.reference")}
          </p>
          <div className="flex items-start gap-2">
            <p className="flex-1 font-mono text-sm font-medium">{reference}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 shrink-0 p-0"
              onClick={() => void copy(reference, "reference")}
            >
              {copied === "reference" ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function vStr(v: unknown) {
  return v != null && String(v).trim() !== ""
}

export function MarketplacePayStep({
  methods,
  payTab,
  onPayTab,
  methodId,
  onMethodId,
  amount,
  currency,
  amountLabel: amountLabelProp,
  reference,
  onlinePayment,
  proofSubmitted,
  receiptFile,
  onReceiptFile,
  busy,
  canAct,
  onPay,
  onIvePaid,
  onWidgetCompleted,
  onWidgetFailed,
  hideOnlineCta,
  onlineCreating,
}: Props) {
  const { t } = useTranslation("app")
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const label = (key: string, fallback?: string) =>
    t(`marketplace.${key}`, { defaultValue: fallback || key })
  const hasOnline = methods.some((m) => m.rail === "yookassa")
  const manuals = methods.filter((m) => m.rail === "manual")
  const hasManual = manuals.length > 0
  const selectedManual = manuals.find((m) => m.id === methodId) || manuals[0]
  const amountLabel = amountLabelProp || `${amount.toFixed(2)} ${currency}`
  const showTabs = hasOnline && hasManual
  const showOnline = hasOnline && (!showTabs || payTab === "yookassa")
  const showManual = hasManual && payTab === "manual"

  function pickFile(file: File | null) {
    setUploadError("")
    if (!file) {
      onReceiptFile(null)
      return
    }
    const okType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type)
    if (!okType) {
      setUploadError(label("uploadTypeError", "Use a JPG, PNG, or PDF file."))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(label("uploadSizeError", "File must be 10 MB or smaller."))
      return
    }
    onReceiptFile(file)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] || null)
    e.target.value = ""
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files?.[0] || null)
  }

  return (
    <section className="space-y-3">
      {showTabs ? (
        <>
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            {label("payWith", "Pay with")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPayTab("yookassa")}
              className={cn(
                "flex min-h-12 flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors",
                payTab === "yookassa"
                  ? "border-primary bg-orange-50 text-primary"
                  : "border-[#E8E4DC] bg-white text-gray-600",
              )}
            >
              <CreditCard className="h-5 w-5" />
              {label("payOnline", "Pay online")}
            </button>
            <button
              type="button"
              onClick={() => onPayTab("manual")}
              className={cn(
                "flex min-h-12 flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors",
                payTab === "manual"
                  ? "border-primary bg-orange-50 text-primary"
                  : "border-[#E8E4DC] bg-white text-gray-600",
              )}
            >
              <Landmark className="h-5 w-5" />
              {label("payManual", "Bank transfer")}
            </button>
          </div>
        </>
      ) : null}

      {showOnline ? (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white p-2 sm:p-4">
          {onlinePayment?.confirmationToken ? (
            <YooKassaCheckoutWidget
              transactionId={onlinePayment.transactionId}
              confirmationToken={onlinePayment.confirmationToken}
              amount={amount}
              currency={currency}
              onCompleted={onWidgetCompleted}
              onFailed={onWidgetFailed}
            />
          ) : (
            <OnlinePaySkeleton
              caption={
                canAct || onlineCreating || busy || hideOnlineCta
                  ? t("hub.pay.loading", { defaultValue: "Loading secure payment…" })
                  : label("completeDetails", "Complete the details above to continue.")
              }
            />
          )}
        </div>
      ) : null}

      {showManual ? (
        <div className="space-y-4 rounded-2xl border border-[#E8E4DC] bg-white p-5">
          {manuals.length > 1 ? (
            <div className="space-y-2">
              {manuals.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMethodId(m.id)}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold",
                    methodId === m.id
                      ? "border-primary bg-orange-50 text-primary"
                      : "border-[#E8E4DC] bg-[#FAFAF8] text-gray-700",
                  )}
                >
                  <Landmark className="h-4 w-4 shrink-0" />
                  {m.name}
                </button>
              ))}
            </div>
          ) : null}

          {selectedManual ? (
            <InstructionRows instructions={selectedManual.instructions} reference={reference} />
          ) : null}

          {proofSubmitted ? (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {label("proof_submitted", "Proof submitted for review")}
            </p>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={onInputChange}
              />
              {uploadError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="flex-1">{uploadError}</span>
                    <button type="button" onClick={() => setUploadError("")} className="text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                }}
                onDrop={onDrop}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-orange-50"
                    : receiptFile
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-[#E8E4DC] bg-[#FAFAF8] hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      receiptFile ? "bg-emerald-100" : "bg-gray-100",
                    )}
                  >
                    {receiptFile ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {receiptFile ? receiptFile.name : label("uploadReceipt", "Upload payment receipt")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {receiptFile
                        ? `${(receiptFile.size / 1024 / 1024).toFixed(2)} MB`
                        : label("fileTypesHint", "JPG, PNG or PDF (max 10 MB)")}
                    </p>
                  </div>
                  {receiptFile ? (
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReceiptFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                className="min-h-12 w-full rounded-xl text-base font-semibold"
                disabled={busy || !canAct || !receiptFile}
                onClick={onIvePaid}
              >
                {busy ? label("loading", "Loading…") : label("ivePaid", "I've paid")}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
