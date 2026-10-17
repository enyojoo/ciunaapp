"use client"

import { useState, useEffect, useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowDownLeft, ArrowUpRight, ShoppingBag, UtensilsCrossed, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { roundMoney } from "@/utils/currency"
import { TransactionsListSkeleton } from "@/components/transactions-skeleton"
import { useAuth } from "@/lib/auth-context"
import { useUserData } from "@/hooks/use-user-data"
import Link from "next/link"
import { resolveTransactionListLine, transactionListLineIconKind } from "@ciuna/shared"
import { REFERRAL_PAYOUT_PREFIX } from "@/lib/referral-reward-service"
import { formatLocaleDateShort, formatLocaleDateTimeLine } from "@/lib/format-date-locale"
import {
  readStaleCombinedTransactionsCache,
  isCombinedTransactionsCacheFresh,
} from "@/lib/transactions-combined-cache"

interface CombinedTransaction {
  marketplace_order?: { id: string; line: string; payment_state: string; fulfillment_state: string } | null
  id: string
  transaction_id: string
  type: "send" | "hub"
  status: string
  created_at: string
  reference?: string | null
  transaction_source?: string | null
  hub_snapshot?: Record<string, unknown> | null
  hub_product_category?: string | null
  send_amount?: number
  send_currency?: string
  receive_amount?: number
  receive_currency?: string
  fulfillment_type?: "bank_transfer" | "cash_hand"
  delivery_address_line?: string | null
  delivery_phone?: string | null
  recipient?: {
    full_name: string
    account_number: string
    bank_name: string
  }
}

function sendRowRecipientLabel(tx: CombinedTransaction, fallback: string) {
  if (tx.type === "hub" && tx.hub_snapshot && typeof tx.hub_snapshot.productTitle === "string") {
    return String(tx.hub_snapshot.productTitle)
  }
  if (tx.recipient?.full_name?.trim()) return tx.recipient.full_name
  if (tx.fulfillment_type === "cash_hand" && tx.delivery_address_line?.trim()) {
    return tx.delivery_address_line.trim()
  }
  return fallback
}

function isReferralPayoutRow(t: CombinedTransaction): boolean {
  return typeof t.reference === "string" && t.reference.startsWith(REFERRAL_PAYOUT_PREFIX)
}

function isHubTx(t: CombinedTransaction): boolean {
  return t.type === "hub" || t.transaction_source === "hub"
}

function transactionRowIconMeta(tx: CombinedTransaction) {
  const line = resolveTransactionListLine(
    {
      type: tx.type,
      transaction_source: tx.transaction_source ?? null,
      reference: tx.reference ?? null,
    },
    tx.hub_product_category ?? null,
    tx.hub_snapshot ?? null,
  )
  const kind = transactionListLineIconKind(line)
  if (kind === "referral") {
    return { Icon: ArrowDownLeft, iconWrap: "bg-emerald-100 text-emerald-700" as const }
  }
  if (kind === "send") {
    return { Icon: ArrowUpRight, iconWrap: "bg-primary/15 text-primary" as const }
  }
  if (kind === "hub_food") {
    return { Icon: UtensilsCrossed, iconWrap: "bg-emerald-100 text-emerald-800" as const }
  }
  if (kind === "hub_mart") {
    return { Icon: ShoppingBag, iconWrap: "bg-amber-100 text-amber-800" as const }
  }
  return { Icon: Sparkles, iconWrap: "bg-violet-100 text-violet-800" as const }
}

type ChipFilter = "all" | "send" | "hub" | "referral"

function matchesChip(t: CombinedTransaction, chip: ChipFilter): boolean {
  if (chip === "all") return true
  if (chip === "referral") return isReferralPayoutRow(t)
  if (chip === "hub") return isHubTx(t) && !isReferralPayoutRow(t)
  if (chip === "send") return !isHubTx(t) && !isReferralPayoutRow(t)
  return true
}

function calendarDayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function TransactionsPage() {
  const { t, i18n } = useTranslation("app")
  const dateLocale = i18n.resolvedLanguage || i18n.language || "en"
  const { userProfile, loading: authLoading, user } = useAuth()
  const {
    transactions: userTransactions,
    currencies,
    refreshTransactions,
    completedVolume,
    loading: userDataLoading,
  } = useUserData()
  const [searchTerm, setSearchTerm] = useState("")
  const [chip, setChip] = useState<ChipFilter>("all")

  const [staleRows, setStaleRows] = useState<CombinedTransaction[]>([])
  const [pageLoading, setPageLoading] = useState(false)

  const displayTransactions = useMemo(() => {
    const ut = (userTransactions ?? []) as CombinedTransaction[]
    if (ut.length > 0 || !userDataLoading) return ut
    return staleRows
  }, [userTransactions, userDataLoading, staleRows])

  // Seed from localStorage before paint; align loading with cache (same pattern as /more/referrals)
  useLayoutEffect(() => {
    if (authLoading || !user || !userProfile?.id) return

    const uid = userProfile.id
    const staleRaw = readStaleCombinedTransactionsCache(uid)
    const stale = (staleRaw ?? []) as CombinedTransaction[]
    setStaleRows(stale)

    const ut = (userTransactions ?? []) as CombinedTransaction[]
    const hasRows = stale.length > 0 || ut.length > 0
    const cacheFresh = isCombinedTransactionsCacheFresh(uid)

    if (!cacheFresh && !hasRows) {
      setPageLoading(true)
    } else {
      setPageLoading(false)
    }
  }, [userProfile?.id, authLoading, user, userTransactions])

  // Refresh via store (writes combined cache); full spinner only when no cache and no rows yet
  useEffect(() => {
    if (authLoading || !user || !userProfile?.id) return
    const uid = userProfile.id
    const cached = readStaleCombinedTransactionsCache(uid)
    const hasStoreRows = (userTransactions?.length ?? 0) > 0

    if (cached === null && !hasStoreRows) {
      void (async () => {
        setPageLoading(true)
        try {
          await refreshTransactions()
        } finally {
          setPageLoading(false)
        }
      })()
    } else {
      void refreshTransactions()
    }
  }, [userProfile?.id, authLoading, user, refreshTransactions])

  useEffect(() => {
    if (!userProfile?.id) return
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshTransactions()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [userProfile?.id, refreshTransactions])

  const baseCurrency = userProfile?.base_currency || "NGN"
  const completedCount = displayTransactions.filter(
    (t) => t && (t.status === "completed" || t.status === "deposited"),
  ).length

  const formatCurrencyValue = (amount: number, currencyCode: string) => {
    try {
      const currency = currencies?.find((c) => c && c.code === currencyCode)
      const a = roundMoney(amount)
      return `${currency?.symbol || ""}${a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } catch {
      return `${currencyCode} ${roundMoney(amount).toFixed(2)}`
    }
  }

  const chipFiltered = displayTransactions.filter((transaction) => {
    if (!transaction) return false
    return matchesChip(transaction, chip)
  })

  const filteredTransactions = chipFiltered.filter((transaction) => {
    if (!transaction) return false
    if (!searchTerm.trim()) return true

    const searchLower = searchTerm.toLowerCase()
    const hubTitle =
      transaction.type === "hub" &&
      transaction.hub_snapshot &&
      typeof transaction.hub_snapshot.productTitle === "string"
        ? String(transaction.hub_snapshot.productTitle).toLowerCase()
        : ""
    const amt = String(transaction.send_amount ?? "")
    const matchesSearch =
      transaction.transaction_id?.toLowerCase().includes(searchLower) ||
      transaction.recipient?.full_name?.toLowerCase().includes(searchLower) ||
      transaction.delivery_address_line?.toLowerCase().includes(searchLower) ||
      transaction.delivery_phone?.replace(/\s/g, "").toLowerCase().includes(searchLower.replace(/\s/g, "")) ||
      hubTitle.includes(searchLower) ||
      amt.includes(searchLower) ||
      (isReferralPayoutRow(transaction) &&
        searchLower.length >= 4 &&
        /referral|payout|withdraw/i.test(searchLower))
    return matchesSearch
  })

  const sortedFiltered = [...filteredTransactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const groups: { dayKey: string; items: CombinedTransaction[] }[] = []
  for (const tx of sortedFiltered) {
    const key = calendarDayKey(tx.created_at)
    const last = groups[groups.length - 1]
    if (last && last.dayKey === key) last.items.push(tx)
    else groups.push({ dayKey: key, items: [tx] })
  }

  const chips: { id: ChipFilter; label: string }[] = [
    { id: "all", label: t("orders.chipAll") },
    { id: "send", label: t("orders.chipSend") },
    { id: "hub", label: t("orders.chipHub") },
    { id: "referral", label: t("orders.chipPayout") },
  ]

  const formatAmount = (amount: number, currency: string) => {
    const currencyData = currencies.find((c) => c.code === currency)
    const symbol = currencyData?.symbol || currency
    return `${symbol}${amount.toLocaleString()}`
  }

  const transactionRowStatusLabel = (status: string) => {
    const s = status.toLowerCase()
    if (s === "completed" || s === "deposited") return t("txTimeline.completed")
    if (s === "processing" || s === "converting" || s === "converted") return t("txTimeline.processing")
    if (s === "pending" || s === "confirmed") return t("orders.statusPending")
    if (s === "failed") return t("orders.statusFailed")
    if (s === "cancelled") return t("orders.statusCancelled")
    return status.replace(/_/g, " ")
  }

  const renderOrderRow = (transaction: CombinedTransaction) => {
    if (!transaction) return null
    const payout = isReferralPayoutRow(transaction)
    const isHub = isHubTx(transaction)
    const detailUrl = `/hub/orders/${transaction.transaction_id.toLowerCase()}`
    const lineVisual = transactionRowIconMeta(transaction)
    const Icon = lineVisual.Icon
    const iconWrap = lineVisual.iconWrap

    const recipientName = sendRowRecipientLabel(transaction, t("transactions.unknownRecipient"))
    const hubProductTitle =
      isHub && transaction.hub_snapshot && typeof transaction.hub_snapshot.productTitle === "string"
        ? String(transaction.hub_snapshot.productTitle).trim()
        : ""

    const title = payout
      ? t("transactions.referralPayout")
      : isHub
        ? hubProductTitle || t("orders.rowHubOrder")
        : t("orders.rowSentTo", { name: recipientName })

    const subtitle = formatLocaleDateTimeLine(transaction.created_at, dateLocale)
    const amountStr = formatAmount(transaction.send_amount || 0, transaction.send_currency || baseCurrency)
    const statusLabel = transaction.marketplace_order
      ? `${t(`marketplace.${transaction.marketplace_order.payment_state}`)} · ${t(`marketplace.${transaction.marketplace_order.fulfillment_state}`)}`
      : transactionRowStatusLabel(transaction.status)
    const statusLower = transaction.status.toLowerCase()
    const done = statusLower === "completed" || statusLower === "deposited"
    const statusClass = done
      ? "text-emerald-600"
      : statusLower === "failed"
        ? "text-destructive"
        : "text-muted-foreground"

    return (
      <Link href={detailUrl} className="block focus-visible:outline-none">
        <div
          className={cn(
            "flex min-h-[4.25rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60 sm:min-h-[4.5rem] sm:px-5 sm:py-3.5",
            payout && "bg-indigo-50/40 hover:bg-indigo-50/70",
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11",
              iconWrap,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-snug text-foreground">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums text-foreground sm:text-base">{amountStr}</p>
            <p className={cn("mt-0.5 text-xs font-medium leading-none", statusClass)}>{statusLabel}</p>
          </div>
        </div>
      </Link>
    )
  }

  const groupHeading = (dayKey: string) => {
    const [y, m, d] = dayKey.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === today.getTime()) return t("orders.groupToday")
    if (date.getTime() === yesterday.getTime()) return t("orders.groupYesterday")
    return formatLocaleDateShort(`${dayKey}T12:00:00`, dateLocale).toUpperCase()
  }

  return (
    <div className="min-w-0 space-y-0">
      <div className="border-b border-gray-200 bg-white p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("orders.title")}</h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-3 px-5 pt-4 sm:gap-4 sm:px-6 sm:pt-5">
        <Card className="border-border/80 shadow-md ring-1 ring-black/[0.03]">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t("orders.totalVolume")}
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-primary sm:text-2xl md:text-[1.65rem] md:leading-none">
              {formatCurrencyValue(completedVolume, baseCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm ring-1 ring-black/[0.02]">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t("orders.totalTransactions")}
            </p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {completedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 pt-4 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
          <Input
            placeholder={t("orders.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-full border-border bg-background pl-11 pr-4 text-sm shadow-sm sm:h-12 sm:pl-12"
          />
        </div>
      </div>

      <div className="px-5 pt-3 sm:px-6 sm:pt-4">
        <div className="flex flex-wrap justify-center gap-2 pb-1">
          {chips.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={chip === c.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-medium sm:h-9 sm:text-sm",
                chip === c.id ? "shadow-sm" : "border-border bg-background",
              )}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-5 pb-6 pt-2 sm:space-y-6 sm:px-6 sm:pb-8 sm:pt-3">
        {pageLoading && displayTransactions.length === 0 ? (
          <TransactionsListSkeleton />
        ) : displayTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-2 text-base text-muted-foreground">{t("transactions.empty")}</p>
            <p className="text-sm text-muted-foreground">{t("transactions.emptyHint")}</p>
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-2 text-base text-muted-foreground">{t("transactions.noSearchResults")}</p>
            <p className="text-sm text-muted-foreground">{t("transactions.adjustSearch")}</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.dayKey}>
              <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                {groupHeading(g.dayKey)}
              </h2>
              <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-black/[0.03]">
                <CardContent className="flex flex-col divide-y divide-border p-0">
                  {g.items.map((transaction) => (
                    <div key={transaction.id}>{renderOrderRow(transaction)}</div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
