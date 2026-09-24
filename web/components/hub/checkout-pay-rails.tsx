"use client"

import { CreditCard, Landmark } from "lucide-react"
import { useTranslation } from "react-i18next"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/utils/currency"

/**
 * Shared Hub + Experts pay-step: Bank transfer / Pay online rails + inline YooKassa widget.
 */
export function CheckoutPayRails({
  yookassaEnabled,
  sendCurrency,
  payChoice,
  onPayChoice,
  onlinePayment,
  amount,
  submitting,
  canSubmit,
  onPay,
  onBack,
  onSwitchToManual,
  onCompleted,
  onFailed,
  payOnlineLabel,
  payManualLabel,
}: {
  yookassaEnabled: boolean
  sendCurrency: string
  payChoice: "manual" | "yookassa"
  onPayChoice: (c: "manual" | "yookassa") => void
  onlinePayment: { transactionId: string; confirmationToken: string | null } | null
  amount?: number | null
  submitting?: boolean
  canSubmit?: boolean
  onPay: () => void
  onBack?: () => void
  onSwitchToManual: () => void
  onCompleted: (transactionId: string) => void
  onFailed: (message: string) => void
  payOnlineLabel?: string
  payManualLabel?: string
}) {
  const { t } = useTranslation("app")
  const showRails = yookassaEnabled && sendCurrency.toUpperCase() === "RUB" && !onlinePayment
  const manualLabel = payManualLabel || t("hub.checkout.payManual", { defaultValue: "Bank transfer" })
  const onlineLabel = payOnlineLabel || t("hub.checkout.payOnline", { defaultValue: "Pay online" })

  return (
    <>
      {showRails ? (
        <Card className="mb-4">
          <CardContent className="grid grid-cols-2 gap-3 pt-4">
            <button
              type="button"
              onClick={() => onPayChoice("manual")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                payChoice === "manual" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600"
              }`}
            >
              <Landmark className="h-5 w-5" />
              {manualLabel}
            </button>
            <button
              type="button"
              onClick={() => onPayChoice("yookassa")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                payChoice === "yookassa" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              {onlineLabel}
            </button>
          </CardContent>
        </Card>
      ) : null}

      {payChoice === "yookassa" ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            {onlinePayment ? (
              <>
                <p className="text-sm text-gray-600">
                  {t("hub.checkout.onlinePayInlineHint", {
                    defaultValue: "Complete payment by card or SBP below.",
                  })}
                </p>
                <YooKassaCheckoutWidget
                  transactionId={onlinePayment.transactionId}
                  confirmationToken={onlinePayment.confirmationToken}
                  amount={amount}
                  currency={sendCurrency}
                  onCompleted={onCompleted}
                  onFailed={onFailed}
                />
                <Button type="button" variant="outline" onClick={onSwitchToManual} className="min-h-12 w-full">
                  {manualLabel}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  {t("hub.checkout.onlinePayInlineHint", {
                    defaultValue: "Complete payment by card or SBP below.",
                  })}
                </p>
                <div className="flex gap-3">
                  {onBack ? (
                    <Button type="button" variant="outline" onClick={onBack} className="min-h-12 flex-1">
                      {t("hub.checkout.back")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={onPay}
                    disabled={submitting || !canSubmit}
                    className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                  >
                    {submitting
                      ? t("hub.checkout.creating")
                      : `${onlineLabel}${amount != null ? ` · ${formatCurrency(amount, sendCurrency)}` : ""}`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
