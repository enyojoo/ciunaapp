"use client"

import { useTranslation } from "react-i18next"
import { Building2, Check, Coins, Copy, QrCode, Smartphone } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { accountFieldLabel } from "@/lib/account-field-i18n"
import { getAccountTypeConfigFromCurrency, formatFieldValue } from "@/lib/currency-account-types"

/** Same shape as Office payment methods used on `/send` step 3 (default method only). */
export type SendPaymentMethodRecord = {
  id: string
  type: "bank_account" | "qr_code" | "stablecoin" | "mobile_money"
  name: string
  currency: string
  status?: string | null
  is_default?: boolean | null
  account_name?: string | null
  account_number?: string | null
  bank_name?: string | null
  routing_number?: string | null
  sort_code?: string | null
  iban?: string | null
  swift_bic?: string | null
  qr_code_data?: string | null
  instructions?: string | null
  crypto_asset?: string | null
  crypto_network?: string | null
  wallet_address?: string | null
}

export function SendPaymentMethodDefaultDisplay({
  sendCurrency,
  defaultMethod,
  copiedStates,
  onCopy,
}: {
  sendCurrency: string
  defaultMethod: SendPaymentMethodRecord | null
  copiedStates: Record<string, boolean>
  onCopy: (text: string, key: string) => void
}) {
  const { t } = useTranslation("app")
  const accountConfig = getAccountTypeConfigFromCurrency(sendCurrency)
  const accountType = accountConfig.accountType

  if (!defaultMethod) return null

  if (defaultMethod.type === "bank_account") {
    const m = defaultMethod
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{m.name}</span>
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <span className="text-xs text-gray-600">
              {accountFieldLabel(t, "account_name", accountConfig.fieldLabels.account_name)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{m.account_name}</span>
              <Button variant="ghost" size="sm" onClick={() => onCopy(m.account_name || "", "accountName")} className="h-5 w-5 p-0">
                {copiedStates.accountName ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {accountType === "us" && m.routing_number ? (
            <div className="space-y-1">
              <span className="text-xs text-gray-600">
                {accountFieldLabel(t, "routing_number", accountConfig.fieldLabels.routing_number)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {formatFieldValue(accountType, "routing_number", m.routing_number)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.routing_number || "", "routingNumber")} className="h-5 w-5 p-0">
                  {copiedStates.routingNumber ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ) : null}

          {accountType === "uk" && m.sort_code ? (
            <div className="space-y-1">
              <span className="text-xs text-gray-600">{accountFieldLabel(t, "sort_code", accountConfig.fieldLabels.sort_code)}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{formatFieldValue(accountType, "sort_code", m.sort_code)}</span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.sort_code || "", "sortCode")} className="h-5 w-5 p-0">
                  {copiedStates.sortCode ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ) : null}

          {(accountType === "us" || accountType === "uk" || accountType === "generic") && m.account_number ? (
            <div className="space-y-1">
              <span className="text-xs text-gray-600">
                {accountFieldLabel(t, "account_number", accountConfig.fieldLabels.account_number)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{m.account_number}</span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.account_number || "", "accountNumber")} className="h-5 w-5 p-0">
                  {copiedStates.accountNumber ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ) : null}

          {(accountType === "uk" || accountType === "euro") && m.iban ? (
            <div className="space-y-1">
              <span className="text-xs text-gray-600">{accountFieldLabel(t, "iban", accountConfig.fieldLabels.iban)}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium">{formatFieldValue(accountType, "iban", m.iban)}</span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.iban || "", "iban")} className="h-5 w-5 p-0">
                  {copiedStates.iban ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ) : null}

          {(accountType === "uk" || accountType === "euro") && m.swift_bic ? (
            <div className="space-y-1">
              <span className="text-xs text-gray-600">{accountFieldLabel(t, "swift_bic", accountConfig.fieldLabels.swift_bic)}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium">{m.swift_bic}</span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.swift_bic || "", "swiftBic")} className="h-5 w-5 p-0">
                  {copiedStates.swiftBic ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <span className="text-xs text-gray-600">{accountFieldLabel(t, "bank_name", accountConfig.fieldLabels.bank_name)}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{m.bank_name}</span>
              <Button variant="ghost" size="sm" onClick={() => onCopy(m.bank_name || "", "bankName")} className="h-5 w-5 p-0">
                {copiedStates.bankName ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (defaultMethod.type === "qr_code") {
    const m = defaultMethod
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <QrCode className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{m.name}</span>
        </div>
        <div className="mx-auto mb-3 flex h-48 w-48 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {m.qr_code_data ? (
            m.qr_code_data.endsWith(".svg") ? (
              <img src={m.qr_code_data || "/placeholder.svg"} alt={t("send.qrCodeAlt")} className="h-full w-full object-contain" />
            ) : m.qr_code_data.endsWith(".pdf") ? (
              <div className="text-center">
                <QrCode className="mx-auto mb-2 h-16 w-16 text-gray-400" />
                <a href={m.qr_code_data} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline hover:text-blue-800">
                  {t("send.viewQrPdf")}
                </a>
              </div>
            ) : (
              <img src={m.qr_code_data || "/placeholder.svg"} alt={t("send.qrCodeAlt")} className="h-full w-full object-contain" />
            )
          ) : (
            <QrCode className="h-16 w-16 text-gray-400" />
          )}
        </div>
        {m.instructions ? <p className="mb-2 text-xs text-gray-500">{m.instructions}</p> : null}
      </div>
    )
  }

  if (defaultMethod.type === "stablecoin") {
    const m = defaultMethod
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-3">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{m.name}</span>
        </div>
        {m.crypto_asset ? (
          <div className="mb-2 space-y-1">
            <span className="text-xs text-gray-600">{t("send.cryptoAsset")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{m.crypto_asset}</span>
              <Button variant="ghost" size="sm" onClick={() => onCopy(String(m.crypto_asset || ""), "cryptoAsset")} className="h-5 w-5 p-0">
                {copiedStates.cryptoAsset ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        ) : null}
        {m.crypto_network ? (
          <div className="mb-2 space-y-1">
            <span className="text-xs text-gray-600">{t("send.cryptoNetwork")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{m.crypto_network}</span>
              <Button variant="ghost" size="sm" onClick={() => onCopy(String(m.crypto_network || ""), "cryptoNetwork")} className="h-5 w-5 p-0">
                {copiedStates.cryptoNetwork ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        ) : null}
        {m.wallet_address?.trim() ? (
          <>
            <div className="mb-3 space-y-1">
              <span className="text-xs text-gray-600">{t("send.walletAddress")}</span>
              <div className="flex items-start gap-2">
                <span className="flex-1 break-all font-mono text-xs font-medium">{m.wallet_address?.trim()}</span>
                <Button variant="ghost" size="sm" onClick={() => onCopy(m.wallet_address?.trim() ?? "", "walletAddress")} className="h-5 w-5 shrink-0 p-0">
                  {copiedStates.walletAddress ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <div className="mx-auto mb-3 flex h-48 w-48 items-center justify-center rounded-lg border border-gray-100 bg-white p-2">
              <QRCodeSVG value={m.wallet_address.trim()} size={176} level="M" includeMargin />
            </div>
          </>
        ) : (
          <p className="text-sm text-amber-700">{t("send.stablecoinMissingAddress")}</p>
        )}
        {m.instructions ? <p className="text-xs text-gray-500">{m.instructions}</p> : null}
      </div>
    )
  }

  const m = defaultMethod
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">{m.name}</span>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-xs text-gray-600">{t("send.mobileMoneyNameLabel")}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{m.account_name}</span>
            <Button variant="ghost" size="sm" onClick={() => onCopy(m.account_name || "", "mmDisplayName")} className="h-5 w-5 p-0">
              {copiedStates.mmDisplayName ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-gray-600">{t("send.mobileMoneyPhoneLabel")}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{m.account_number}</span>
            <Button variant="ghost" size="sm" onClick={() => onCopy(m.account_number || "", "mmPhone")} className="h-5 w-5 p-0">
              {copiedStates.mmPhone ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
      {m.instructions ? <p className="mt-2 text-xs text-gray-500">{m.instructions}</p> : null}
    </div>
  )
}
