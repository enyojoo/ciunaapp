"use client"

import { useState, useEffect } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  X,
  ChevronDown,
} from "lucide-react"
import { formatCurrency, roundMoney } from "@/utils/currency"
import {
  getAccountTypeConfigFromCurrency,
  formatFieldValue,
} from "@/lib/currency-account-types"
import { OfficeTransactionsSkeleton } from "@/components/office-transactions-skeleton"
import { officeDataStore } from "@/lib/office-data-store"
import { useOfficeData } from "@/hooks/use-office-data"
import { officeFetch } from "@/lib/api-client"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { cn } from "@/lib/utils"
import {
  isReferralPayoutMirrorReference,
  resolveTransactionListLine,
  transactionLinePrimaryBadge,
} from "@ciuna/shared"

/**
 * Office only: exclude `transactions` mirror rows (`REFERRAL_PAYOUT:…`) so payouts are not
 * duplicated when we also list rows from `referral_payout_requests`.
 */
function excludeReferralPayoutMirrorTransactions<T extends { reference?: string | null }>(rows: T[] | undefined) {
  return (rows || []).filter((tx) => !isReferralPayoutMirrorReference(tx.reference))
}

interface CombinedTransaction {
  id: string
  transaction_id: string
  type: "send" | "hub" | "referral_payout"
  payout_request_id?: string
  status: string
  created_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
  }
  user_id?: string
  send_amount?: number
  send_currency?: string
  receive_amount?: number
  receive_currency?: string
  recipient?: {
    full_name: string
    account_number: string
    bank_name: string
    routing_number?: string
    sort_code?: string
    iban?: string
    swift_bic?: string
    currency?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    transfer_type?: "ACH" | "Wire"
    checking_or_savings?: "checking" | "savings"
  }
  receipt_url?: string
  receipt_filename?: string
  exchange_rate?: number
  updated_at?: string
  completed_at?: string
  fulfillment_type?: string | null
  delivery_address_line?: string | null
  delivery_phone?: string | null
  logistics_fee_amount?: number | null
  delivery_address_id?: string | null
  hub_snapshot?: Record<string, unknown> | null
  hub_fee_amount?: number | null
  hub_product_id?: string | null
  hub_product_category?: string | null
  fee_amount?: number | null
  total_amount?: number | null
  reference?: string | null
  transaction_source?: string | null
  payment_provider?: string | null
  gateway_payment_id?: string | null
  payment_processing_fee?: number | null
  bitbanker_conversion_snapshot?: Record<string, unknown> | null
  settlement_metadata?: Record<string, unknown> | null
}

/** Maps a raw send transaction from admin data into CombinedTransaction, preserving cash-delivery fields. */
function mapSendTransaction(tx: any): CombinedTransaction {
  const rowType: CombinedTransaction["type"] =
    tx.type === "referral_payout" || isReferralPayoutMirrorReference(tx.reference)
      ? "referral_payout"
      : tx.transaction_source === "hub" || tx.type === "hub"
        ? "hub"
        : "send"
  const embedded = tx.delivery_address as { address_line?: string; phone?: string } | null | undefined
  const delivery_address_line = tx.delivery_address_line ?? embedded?.address_line ?? null
  const delivery_phone = tx.delivery_phone ?? embedded?.phone ?? null

  return {
    id: tx.id,
    transaction_id: tx.transaction_id || tx.id,
    type: rowType,
    status: tx.status,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
    completed_at: tx.completed_at,
    user: tx.user,
    user_id: tx.user_id,
    send_amount: tx.send_amount,
    send_currency: tx.send_currency,
    receive_amount: tx.receive_amount,
    receive_currency: tx.receive_currency,
    recipient: tx.recipient,
    receipt_url: tx.receipt_url,
    receipt_filename: tx.receipt_filename,
    exchange_rate: tx.exchange_rate,
    fulfillment_type: tx.fulfillment_type ?? null,
    delivery_address_line,
    delivery_phone,
    logistics_fee_amount: tx.logistics_fee_amount ?? null,
    delivery_address_id: tx.delivery_address_id ?? null,
    hub_snapshot: tx.hub_snapshot ?? null,
    hub_fee_amount: tx.hub_fee_amount ?? null,
    hub_product_id: tx.hub_product_id ?? null,
    hub_product_category: tx.hub_product_category ?? null,
    payment_provider: tx.payment_provider ?? null,
    gateway_payment_id: tx.gateway_payment_id ?? null,
    payment_processing_fee: tx.payment_processing_fee ?? null,
    bitbanker_conversion_snapshot: tx.bitbanker_conversion_snapshot ?? null,
    settlement_metadata: tx.settlement_metadata ?? null,
    fee_amount: tx.fee_amount ?? null,
    total_amount: tx.total_amount ?? null,
    reference: tx.reference ?? null,
    transaction_source: tx.transaction_source ?? null,
  }
}

function officeServiceLine(tx: CombinedTransaction) {
  return resolveTransactionListLine(
    {
      type: tx.type,
      transaction_source: tx.transaction_source ?? null,
      reference: tx.reference ?? null,
    },
    tx.hub_product_category ?? null,
    tx.hub_snapshot ?? null,
  )
}

function officeServiceBadgeLabel(tx: CombinedTransaction): string {
  return transactionLinePrimaryBadge(officeServiceLine(tx))
}

function officeServiceBadgeClass(tx: CombinedTransaction): string {
  const line = officeServiceLine(tx)
  if (line.kind === "referral_payout") return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
  if (line.kind === "send") return "bg-sky-100 text-sky-900 hover:bg-sky-100"
  if (line.kind === "experts") return "bg-violet-100 text-violet-900 hover:bg-violet-100"
  if (line.kind === "hub" && line.line === "food") return "bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
  return "bg-amber-100 text-amber-900 hover:bg-amber-100"
}

/** Charge in `send_currency` — matches hub order dialog "Total to paid" (`total_amount` when set). */
function officeTotalToPaidSendAmount(tx: CombinedTransaction): number {
  const total = Number(tx.total_amount)
  if (Number.isFinite(total) && total > 0) return total
  return Number(tx.send_amount) || 0
}

function buildTransactionsById(transactions: any[] | undefined): Map<string, any> {
  const map = new Map<string, any>()
  for (const t of transactions || []) {
    const id = t?.transaction_id != null ? String(t.transaction_id).trim() : ""
    if (id) map.set(id, t)
  }
  return map
}

function mapPayoutRequests(
  payouts: any[] | undefined,
  options?: {
    transactionsByTransactionId?: Map<string, any>
    exchangeRates?: { from_currency: string; to_currency: string; rate: number; status: string }[]
  },
): CombinedTransaction[] {
  if (!payouts?.length) return []
  const rateMap =
    options?.exchangeRates?.length && options.exchangeRates.length > 0
      ? buildRateMap(options.exchangeRates)
      : null

  return payouts.map((p: any) => {
    const linked =
      typeof p.linked_transaction_id === "string" && p.linked_transaction_id.trim()
        ? p.linked_transaction_id.trim()
        : ""
    const reserved =
      typeof p.payout_transaction_id === "string" && p.payout_transaction_id.trim()
        ? p.payout_transaction_id.trim()
        : ""
    const transactionId = linked || reserved || `payout-${p.id}`

    const sendAmount = Number(p.amount)
    const sendCurrency = (p.currency as string) || ""

    let receive_amount: number | undefined
    let receive_currency: string | undefined

    const linkedTx = linked && options?.transactionsByTransactionId?.get(linked)
    if (
      linkedTx &&
      linkedTx.receive_currency != null &&
      linkedTx.receive_amount != null &&
      !Number.isNaN(Number(linkedTx.receive_amount))
    ) {
      receive_amount = Number(linkedTx.receive_amount)
      receive_currency = linkedTx.receive_currency as string
    } else {
      receive_currency = (p.recipient as { currency?: string } | undefined)?.currency
      if (receive_currency) {
        if (rateMap) {
          const conv = convertWithRateMap(sendAmount, sendCurrency, receive_currency, rateMap)
          if (conv > 0 || sendCurrency === receive_currency) {
            receive_amount = sendCurrency === receive_currency ? sendAmount : conv
          }
        } else if (sendCurrency === receive_currency) {
          receive_amount = sendAmount
        }
      }
    }

    return {
      id: p.id,
      transaction_id: transactionId,
      type: "referral_payout" as const,
      payout_request_id: p.id,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
      user: p.user,
      user_id: p.user_id,
      send_amount: sendAmount,
      send_currency: sendCurrency,
      receive_amount,
      receive_currency,
      recipient: p.recipient,
    }
  })
}

export default function AdminTransactionsPage() {
  const { data: adminData, loading: adminDataLoading } = useOfficeData()
  
  // Initialize from cache synchronously to prevent flicker
  const getInitialTransactions = (): CombinedTransaction[] => {
    if (!adminData?.transactions?.length && !adminData?.referralPayoutRequests?.length) return []
    // Transform transactions to match CombinedTransaction interface
    const rows = excludeReferralPayoutMirrorTransactions(adminData.transactions).map((tx: any) =>
      mapSendTransaction(tx),
    )
    const payoutOpts = {
      transactionsByTransactionId: buildTransactionsById(adminData.transactions),
      exchangeRates: adminData.exchangeRates || [],
    }
    const payouts = mapPayoutRequests(adminData.referralPayoutRequests, payoutOpts)
    return [...rows, ...payouts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  const [transactions, setTransactions] = useState<CombinedTransaction[]>(() => getInitialTransactions())
  const [loading, setLoading] = useState(!adminData?.transactions) // Only show loading if no cached data
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<
    "all" | "send" | "hub" | "food" | "mart" | "referral_payout"
  >("all")
  const [currencyFilter, setCurrencyFilter] = useState("all")
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<CombinedTransaction | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [timerDuration, setTimerDuration] = useState(3600)

  useEffect(() => {
    if (!selectedTransaction?.receive_currency || !adminData?.currencies?.length) return
    const row = adminData.currencies.find((c: { code: string }) => c.code === selectedTransaction.receive_currency)
    setTimerDuration(row?.receive_completion_timer_seconds ?? 3600)
  }, [selectedTransaction, adminData?.currencies])

  // Update transactions when adminData changes (from realtime updates or initial load)
  useEffect(() => {
    if (adminData?.transactions || adminData?.referralPayoutRequests?.length) {
      // Transform transactions to match CombinedTransaction interface
      const transformedTransactions: CombinedTransaction[] = excludeReferralPayoutMirrorTransactions(
        adminData.transactions,
      ).map((tx: any) => mapSendTransaction(tx))
      const payoutOpts = {
        transactionsByTransactionId: buildTransactionsById(adminData.transactions),
        exchangeRates: adminData.exchangeRates || [],
      }
      const payoutRows = mapPayoutRequests(adminData.referralPayoutRequests, payoutOpts)
      const merged = [...transformedTransactions, ...payoutRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setTransactions(merged)
      setLoading(false)
    } else if (!adminDataLoading) {
      // If adminData is loaded but has no transactions, set empty array
      setTransactions([])
      setLoading(false)
    }
  }, [adminData, adminDataLoading])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Only show skeleton if we're truly loading and have no data
  if (
    (loading || adminDataLoading) &&
    transactions.length === 0 &&
    !adminData?.transactions?.length &&
    !adminData?.referralPayoutRequests?.length
  ) {
    return (
      <OfficeDashboardLayout>
        <OfficeTransactionsSkeleton />
      </OfficeDashboardLayout>
    )
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const q = searchTerm.toLowerCase()
    const hubTitle =
      transaction.type === "hub" && transaction.hub_snapshot && typeof transaction.hub_snapshot.productTitle === "string"
        ? String(transaction.hub_snapshot.productTitle).toLowerCase()
        : ""
    const matchesSearch =
      searchTerm === "" ||
      transaction.transaction_id?.toLowerCase().includes(q) ||
      transaction.user?.email?.toLowerCase().includes(q) ||
      hubTitle.includes(q) ||
      (transaction.type === "referral_payout" &&
        transaction.recipient?.full_name?.toLowerCase().includes(q)) ||
      ((transaction.type === "send" || transaction.type === "hub") &&
        (transaction.delivery_address_line?.toLowerCase()?.includes(q) ||
          transaction.delivery_phone?.toLowerCase()?.includes(q)))

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    const line = officeServiceLine(transaction)
    const lineIsHubFood = transaction.type === "hub" && line.kind === "hub" && line.line === "food"
    const lineIsHubMart = transaction.type === "hub" && line.kind === "hub" && line.line === "mart"

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "referral_payout" && transaction.type === "referral_payout") ||
      (typeFilter === "send" && transaction.type === "send") ||
      (typeFilter === "hub" && transaction.type === "hub") ||
      (typeFilter === "food" && lineIsHubFood) ||
      (typeFilter === "mart" && lineIsHubMart)

    const matchesCurrency =
      currencyFilter === "all" ||
      ((transaction.type === "send" || transaction.type === "hub") &&
        (transaction.send_currency === currencyFilter || transaction.receive_currency === currencyFilter)) ||
      (transaction.type === "referral_payout" &&
        (transaction.send_currency === currencyFilter || transaction.recipient?.currency === currencyFilter))

    return matchesSearch && matchesStatus && matchesType && matchesCurrency
  })

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleString("en-US", { month: "short" })
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    // Format: "Nov 07, 2025 • 7:29 PM"
    return `${month} ${day}, ${year} • ${displayHours}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleString("en-US", { month: "short" })
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()
    // Format: "Nov 07, 2025"
    return `${month} ${day}, ${year}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3 mr-1" /> },
      processing: { color: "bg-blue-100 text-blue-800", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      completed: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      confirmed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      converting: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3 mr-1" /> },
      converted: { color: "bg-blue-100 text-blue-800", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      deposited: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      failed: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3 mr-1" /> },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: <XCircle className="h-3 w-3 mr-1" /> },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge className={`${config.color} hover:${config.color} flex items-center`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map((t: any) => t.transaction_id))
    } else {
      setSelectedTransactions([])
    }
  }

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId])
    } else {
      setSelectedTransactions(selectedTransactions.filter((id) => id !== transactionId))
    }
  }

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      await officeDataStore.updateTransactionStatus(transactionId, newStatus)

      // Update selectedTransaction if it's the one being updated
      if (selectedTransaction?.transaction_id === transactionId) {
        setSelectedTransaction((prev) => (prev ? { ...prev, status: newStatus as any } : null))
      }
    } catch (err) {
      console.error("Error updating transaction status:", err)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const ids = selectedTransactions.filter((tid) => {
        const row = transactions.find((tr) => tr.transaction_id === tid)
        return row && row.type !== "referral_payout"
      })
      await Promise.all(
        ids.map(async (transactionId) => {
          await officeDataStore.updateTransactionStatus(transactionId, newStatus)
        }),
      )
      setSelectedTransactions([])
    } catch (err) {
      console.error("Error updating transaction statuses:", err)
    }
  }

  /** Referral payouts: complete/cancel via web admin APIs (URLs joined without `//` in `officeFetch`). */
  const handleReferralPayoutStatusUpdate = async (tx: CombinedTransaction, newStatus: "completed" | "cancelled") => {
    const payoutId = tx.payout_request_id
    if (!payoutId || !tx.transaction_id) return
    try {
      if (newStatus === "completed") {
        const res = await officeFetch(`/api/admin/referral-payouts/${payoutId}/complete`, { method: "POST" })
        if (!res.ok) return
      } else {
        const res = await officeFetch(`/api/admin/referral-payouts/${payoutId}/cancel`, { method: "POST" })
        if (!res.ok) return
      }
      await officeDataStore.refreshAllData()
      if (selectedTransaction?.transaction_id === tx.transaction_id) {
        setSelectedTransaction((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (e) {
      console.error("Error updating referral payout status:", e)
    }
  }

  // Calculate elapsed time in seconds (pass `tx` from the open row’s dialog to avoid stale `selectedTransaction`)
  const getElapsedTime = (tx?: CombinedTransaction | null): number => {
    const t = tx ?? selectedTransaction
    if (!t) return 0

    const createdAt = new Date(t.created_at).getTime()

    if (t.status === "completed") {
      const completedAt = (t as any).completed_at
        ? new Date((t as any).completed_at).getTime()
        : new Date((t as any).updated_at || t.created_at).getTime()
      return Math.floor((completedAt - createdAt) / 1000)
    } else {
      return Math.floor((currentTime - createdAt) / 1000)
    }
  }

  const getRemainingTime = (tx?: CombinedTransaction | null): number => {
    const elapsed = getElapsedTime(tx)
    const remaining = timerDuration - elapsed
    return Math.max(0, remaining)
  }

  const getDelay = (tx?: CombinedTransaction | null): number => {
    const t = tx ?? selectedTransaction
    if (!t) return 0
    const elapsed = getElapsedTime(tx)
    const delay = elapsed - timerDuration
    return Math.max(0, delay)
  }

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimerDisplay = (tx?: CombinedTransaction | null): string | null => {
    const t = tx ?? selectedTransaction
    if (!t) return null
    if (t.type === "referral_payout" || t.type === "hub") return null

    if (t.status === "failed" || t.status === "cancelled") {
      return null
    }

    if (t.status === "completed") {
      const elapsed = getElapsedTime(tx)
      const delay = getDelay(tx)

      if (delay > 0) {
        return `Took ${formatTime(elapsed)} • Delayed ${formatTime(delay)}`
      } else {
        return `Took ${formatTime(elapsed)}`
      }
    } else {
      const remaining = getRemainingTime(tx)
      const delay = getDelay(tx)

      if (remaining <= 0 && delay > 0) {
        return `Delayed ${formatTime(delay)}`
      }

      return `Time left ${formatTime(remaining)}`
    }
  }

  const getHubComment = (tx: CombinedTransaction): string => {
    const formAnswers = (tx.hub_snapshot as { formAnswers?: Record<string, unknown> } | null)?.formAnswers
    const comment = formAnswers && typeof formAnswers.comment === "string" ? formAnswers.comment.trim() : ""
    return comment
  }

  /** Hub fee on the order amount in receive currency (matches web checkout Order summary). */
  const getHubFeeReceiveAmount = (tx: CombinedTransaction): number => {
    const snap = tx.hub_snapshot as
      | {
          fundedAmount?: number
          feePercent?: number | null
        }
      | null
      | undefined
    const productPrice =
      snap?.fundedAmount != null && Number.isFinite(Number(snap.fundedAmount))
        ? Number(snap.fundedAmount)
        : Number(tx.receive_amount) || 0
    const pct = snap?.feePercent != null && Number.isFinite(Number(snap.feePercent)) ? Number(snap.feePercent) : null
    if (pct != null && pct > 0 && productPrice > 0) {
      return roundMoney((productPrice * pct) / 100)
    }
    const rate = Number(tx.exchange_rate) || 0
    const hubSend = Number(tx.hub_fee_amount) || 0
    if (rate > 0 && hubSend > 0) return roundMoney(hubSend * rate)
    return 0
  }

  const isHubTransaction = (tx: CombinedTransaction) => tx.type === "hub"

  const handleExport = () => {
    const csvContent = [
      ["Transaction ID", "Date", "User", "From", "To", "Total to paid (send)", "Receive Amount", "Status", "Recipient"].join(
        ",",
      ),
      ...filteredTransactions.map((t: any) =>
        [
          t.transaction_id,
          formatTimestamp(t.created_at),
          `${t.user?.first_name} ${t.user?.last_name}`,
          t.send_currency,
          t.receive_currency,
          officeTotalToPaidSendAmount(t),
          t.receive_amount,
          t.status,
          t.recipient?.full_name || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
  }

  return (
    <OfficeDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search and Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by transaction ID, email, recipient, or Hub order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="send">Send money</SelectItem>
                <SelectItem value="hub">Hub (all)</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="mart">Mart</SelectItem>
                <SelectItem value="referral_payout">Referral</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="converting">Converting</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="deposited">Deposited</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Currency Filter */}
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {adminData?.currencies?.map((currency: any) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== "all" || currencyFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setCurrencyFilter("all")
                  setTypeFilter("all")
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Active Filters Badges */}
          {(searchTerm || statusFilter !== "all" || currencyFilter !== "all" || typeFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500">Active filters:</span>
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                  Type:{" "}
                  {typeFilter === "referral_payout"
                    ? "Referral"
                    : typeFilter === "food"
                      ? "Food"
                      : typeFilter === "mart"
                        ? "Mart"
                        : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  <button
                    onClick={() => setTypeFilter("all")}
                    className="ml-2 hover:bg-amber-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-2 hover:bg-purple-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currencyFilter !== "all" && (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Currency: {currencyFilter}
                  <button
                    onClick={() => setCurrencyFilter("all")}
                    className="ml-2 hover:bg-green-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                  Search: &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 hover:bg-gray-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <span className="text-sm text-gray-500 ml-2">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? "transaction" : "transactions"}
              </span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTransactions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{selectedTransactions.length} transaction(s) selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("processing")}>
                    Payment Received
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("completed")}>
                    Transfer Complete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("failed")}>
                    Mark Failed
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("cancelled")}>
                    Cancel Transfer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.transaction_id)}
                        onCheckedChange={(checked) =>
                          handleSelectTransaction(transaction.transaction_id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{transaction.transaction_id}</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.user?.first_name} {transaction.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge
                          className={cn(
                            "mb-0.5 text-[10px] font-medium px-1.5 py-0 h-5 leading-none",
                            officeServiceBadgeClass(transaction),
                          )}
                        >
                          {officeServiceBadgeLabel(transaction)}
                        </Badge>
                        <div className="font-medium">
                          {formatCurrency(
                            officeTotalToPaidSendAmount(transaction),
                            transaction.send_currency || "",
                          )}
                        </div>
                        {transaction.type === "referral_payout" &&
                        transaction.receive_currency != null &&
                        transaction.receive_amount != null ? (
                          <div className="text-sm text-gray-500">
                            →{" "}
                            {formatCurrency(transaction.receive_amount, transaction.receive_currency)}
                          </div>
                        ) : transaction.type === "hub" ? (
                          <div
                            className="text-sm text-gray-500 truncate max-w-[200px]"
                            title={String(transaction.hub_snapshot?.productTitle || "")}
                          >
                            {String(transaction.hub_snapshot?.productTitle || "Hub order")}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            → {formatCurrency(transaction.receive_amount || 0, transaction.receive_currency || "")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[min(100vw-2rem,56rem)] max-h-[90vh] flex flex-col">
                            <DialogHeader>
                              <div className="flex items-center gap-6">
                                <DialogTitle>
                                  {transaction.type === "referral_payout"
                                    ? "Referral payout"
                                    : transaction.type === "hub"
                                      ? "Order summary"
                                      : "Transaction Details"}
                                </DialogTitle>
                                {getTimerDisplay(transaction) && (
                                  <div className="flex items-center text-orange-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className="font-mono text-sm">{getTimerDisplay(transaction)}</span>
                                  </div>
                                )}
                              </div>
                            </DialogHeader>
                              <div className="overflow-y-auto flex-1 min-h-0 pr-2 -mr-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                                    <p className="font-mono">{transaction.transaction_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">User</label>
                                    <p>
                                      {transaction.user?.first_name} {transaction.user?.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">{transaction.user?.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Date</label>
                                    <p>{formatTimestamp(transaction.created_at)}</p>
                                  </div>
                                  {transaction.type === "referral_payout" ? (
                                      <div className="col-span-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
                                        <Badge className={cn(officeServiceBadgeClass(transaction))}>
                                          {officeServiceBadgeLabel(transaction)}
                                        </Badge>
                                        <p className="text-sm">
                                          <span className="font-medium">Withdrawal: </span>
                                          {formatCurrency(
                                            transaction.send_amount || 0,
                                            transaction.send_currency || "",
                                          )}
                                        </p>
                                        {transaction.receive_currency != null &&
                                          transaction.receive_amount != null && (
                                            <p className="text-sm">
                                              <span className="font-medium">Recipient receives: </span>
                                              {formatCurrency(
                                                transaction.receive_amount,
                                                transaction.receive_currency,
                                              )}
                                            </p>
                                          )}
                                        <p className="text-sm">
                                          <span className="font-medium">Recipient: </span>
                                          {transaction.recipient?.full_name} ({transaction.recipient?.bank_name})
                                        </p>
                                      </div>
                                  ) : transaction.type === "hub" ? (
                                      <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-4">
                                        <Badge className={cn(officeServiceBadgeClass(transaction))}>
                                          {officeServiceBadgeLabel(transaction)}
                                        </Badge>
                                        {(() => {
                                          const snap = transaction.hub_snapshot as
                                            | {
                                                productTitle?: string
                                                fundedAmount?: number
                                                fundedCurrency?: string
                                                items?: { title: string; quantity: number; unitPrice: number; lineTotal: number }[]
                                              }
                                            | null | undefined
                                          const receiveCur =
                                            String(snap?.fundedCurrency || transaction.receive_currency || "") || "—"
                                          const productPrice =
                                            snap?.fundedAmount != null && Number.isFinite(Number(snap.fundedAmount))
                                              ? Number(snap.fundedAmount)
                                              : Number(transaction.receive_amount) || 0
                                          const hubFeeRecv = getHubFeeReceiveAmount(transaction)
                                          const subtotalRecv = roundMoney(productPrice + hubFeeRecv)
                                          const corridorFee = Number(transaction.fee_amount) || 0
                                          const rate = Number(transaction.exchange_rate)
                                          const sendCur = String(transaction.send_currency || "") || "—"
                                          const items = Array.isArray(snap?.items) ? snap.items : null
                                          return (
                                            <div className="space-y-2 text-sm">
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">{items ? "Order" : "Product"}</span>
                                                <span className="text-right font-semibold text-gray-900 break-words max-w-[60%]">
                                                  {typeof snap?.productTitle === "string" ? snap.productTitle : "—"}
                                                </span>
                                              </div>
                                              {items ? (
                                                <div className="space-y-1 rounded-md bg-white/70 p-2">
                                                  {items.map((item, idx) => (
                                                    <div key={idx} className="flex min-w-0 items-start justify-between gap-2 text-xs">
                                                      <span className="min-w-0 truncate text-gray-600">
                                                        {item.quantity} × {item.title}
                                                      </span>
                                                      <span className="shrink-0 text-right font-medium tabular-nums text-gray-900">
                                                        {formatCurrency(item.lineTotal, receiveCur)}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : null}
                                              {transaction.payment_provider === "yookassa" ? (
                                                <div className="flex min-w-0 items-start justify-between gap-2">
                                                  <span className="min-w-0 text-gray-600">Payment method</span>
                                                  <span className="text-right font-semibold text-gray-900">Paid online</span>
                                                </div>
                                              ) : null}
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">Product price</span>
                                                <span className="shrink-0 text-right font-semibold tabular-nums">
                                                  {formatCurrency(productPrice, receiveCur)}
                                                </span>
                                              </div>
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">Hub fee</span>
                                                <span
                                                  className={`shrink-0 text-right font-semibold tabular-nums ${hubFeeRecv === 0 ? "text-green-600" : "text-gray-900"}`}
                                                >
                                                  {hubFeeRecv === 0 ? "Free" : formatCurrency(hubFeeRecv, receiveCur)}
                                                </span>
                                              </div>
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">Exchange fee</span>
                                                <span
                                                  className={`shrink-0 text-right font-semibold tabular-nums ${corridorFee === 0 ? "text-green-600" : "text-gray-900"}`}
                                                >
                                                  {corridorFee === 0
                                                    ? "Free"
                                                    : formatCurrency(corridorFee, sendCur)}
                                                </span>
                                              </div>
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">Subtotal</span>
                                                <span className="shrink-0 text-right font-semibold tabular-nums text-gray-900">
                                                  {formatCurrency(subtotalRecv, receiveCur)}
                                                </span>
                                              </div>
                                              <div className="flex min-w-0 items-start justify-between gap-2">
                                                <span className="min-w-0 text-gray-600">Exchange rate</span>
                                                <span className="shrink-0 text-right text-sm tabular-nums">
                                                  {Number.isFinite(rate) && rate > 0
                                                    ? `1 ${sendCur} = ${rate.toFixed(2)} ${receiveCur}`
                                                    : "—"}
                                                </span>
                                              </div>
                                              <div className="flex min-w-0 items-start justify-between gap-2 border-t border-amber-200/80 pt-2">
                                                <span className="min-w-0 text-gray-600">Total paid</span>
                                                <span className="shrink-0 text-right font-semibold tabular-nums">
                                                  {formatCurrency(
                                                    Number(transaction.total_amount) || 0,
                                                    sendCur,
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        })()}
                                        <div className="space-y-1 pt-2 border-t border-amber-200/60">
                                          <p className="text-sm font-medium text-gray-900">Fulfillment</p>
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">Name: </span>
                                            {String((transaction.hub_snapshot as { contactName?: string })?.contactName || "—")}
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">Phone: </span>
                                            {String((transaction.hub_snapshot as { contactPhone?: string })?.contactPhone || "—")}
                                          </p>
                                          {(transaction.hub_snapshot as { deliveryAddressLine?: string })?.deliveryAddressLine ? (
                                            <p className="text-sm text-gray-700">
                                              <span className="font-medium">Address: </span>
                                              {(transaction.hub_snapshot as { deliveryAddressLine: string }).deliveryAddressLine}
                                            </p>
                                          ) : null}
                                          {getHubComment(transaction) ? (
                                            <p className="text-sm text-gray-700">
                                              <span className="font-medium">Comment: </span>
                                              {getHubComment(transaction)}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                  ) : transaction.type === "send" ? (
                                    <>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Send Amount</label>
                                        <p className="font-medium">
                                          {formatCurrency(
                                            transaction.send_amount || 0,
                                            transaction.send_currency || "",
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Receive Amount</label>
                                        <p className="font-medium">
                                          {formatCurrency(
                                            transaction.receive_amount || 0,
                                            transaction.receive_currency || "",
                                          )}
                                        </p>
                                      </div>
                                      {transaction.fulfillment_type === "cash_hand" ? (
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Cash at location</label>
                                          <div className="text-sm text-gray-700 space-y-1 mt-1">
                                            <p>
                                              <span className="text-gray-500">Address: </span>
                                              {transaction.delivery_address_line?.trim() || "—"}
                                            </p>
                                            <p>
                                              <span className="text-gray-500">Phone: </span>
                                              {transaction.delivery_phone?.trim() || "—"}
                                            </p>
                                            <p>
                                              <span className="text-gray-500">Logistics fee: </span>
                                              <span className="font-medium text-gray-900">
                                                {formatCurrency(
                                                  transaction.logistics_fee_amount ?? 0,
                                                  transaction.send_currency || "",
                                                )}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Recipient</label>
                                          <p>{transaction.recipient?.full_name}</p>
                                          {(() => {
                                            const recipient = transaction.recipient as any
                                            if (!recipient) return null

                                            const recipientCurrency = recipient.currency || transaction.receive_currency
                                            const accountConfig = recipientCurrency
                                              ? getAccountTypeConfigFromCurrency(recipientCurrency)
                                              : null
                                            const accountType = accountConfig?.accountType

                                            return (
                                              <div className="text-sm text-gray-500 space-y-1">
                                                {accountType === "us" && recipient.routing_number && (
                                                  <p className="font-mono text-xs">
                                                    Routing: {formatFieldValue(accountType, "routing_number", recipient.routing_number)}
                                                  </p>
                                                )}
                                                {accountType === "uk" && recipient.sort_code && (
                                                  <p className="font-mono text-xs">
                                                    Sort Code: {formatFieldValue(accountType, "sort_code", recipient.sort_code)}
                                                  </p>
                                                )}
                                                {recipient.account_number && (
                                                  <p className="font-mono text-xs">
                                                    {accountConfig?.fieldLabels.account_number || "Account Number"}: {recipient.account_number}
                                                  </p>
                                                )}
                                                {recipient.iban && (
                                                  <p className="font-mono text-xs">
                                                    IBAN: {formatFieldValue(accountType || "generic", "iban", recipient.iban)}
                                                  </p>
                                                )}
                                                {recipient.swift_bic && (
                                                  <p className="font-mono text-xs">SWIFT/BIC: {recipient.swift_bic}</p>
                                                )}
                                                <p>{recipient.bank_name}</p>
                                                {accountType === "us" && (
                                                  <>
                                                    {recipient.transfer_type && (
                                                      <p className="text-xs">
                                                        Transfer Type: <span className="font-medium">{recipient.transfer_type}</span>
                                                      </p>
                                                    )}
                                                    {recipient.checking_or_savings && (
                                                      <p className="text-xs">
                                                        Account Type: <span className="font-medium capitalize">{recipient.checking_or_savings}</span>
                                                      </p>
                                                    )}
                                                    {recipient.address_line1 && (
                                                      <p className="text-xs">
                                                        Address: {recipient.address_line1}
                                                        {recipient.address_line2 && `, ${recipient.address_line2}`}
                                                      </p>
                                                    )}
                                                    {(recipient.city || recipient.state || recipient.postal_code) && (
                                                      <p className="text-xs">
                                                        {[recipient.city, recipient.state, recipient.postal_code].filter(Boolean).join(", ")}
                                                      </p>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      )}
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Exchange Rate</label>
                                        <p className="font-medium">
                                          1 {transaction.send_currency} = {transaction.exchange_rate}{" "}
                                          {transaction.receive_currency}
                                        </p>
                                      </div>
                                    </>
                                  ) : null}
                                </div>

                                {transaction.type === "send" && transaction.payment_provider === "bitbanker" ? (
                                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                                    <p className="text-sm font-medium text-gray-900">Bitbanker SBP</p>
                                    <p className="text-sm text-gray-700">
                                      Invoice ID:{" "}
                                      <span className="font-mono text-xs">
                                        {transaction.gateway_payment_id || "—"}
                                      </span>
                                    </p>
                                    {transaction.payment_processing_fee != null ? (
                                      <p className="text-sm text-gray-700">
                                        Payment processing fee:{" "}
                                        {formatCurrency(
                                          Number(transaction.payment_processing_fee) || 0,
                                          transaction.send_currency || "RUB",
                                        )}
                                      </p>
                                    ) : null}
                                    {transaction.bitbanker_conversion_snapshot ? (
                                      <pre className="text-xs bg-white/80 rounded p-2 overflow-x-auto max-h-32">
                                        {JSON.stringify(transaction.bitbanker_conversion_snapshot, null, 2)}
                                      </pre>
                                    ) : null}
                                    <BitbankerSettlementForm transaction={transaction} />
                                  </div>
                                ) : null}

                                {transaction.type === "send" && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Receipt</label>
                                  {transaction.receipt_url ? (
                                    <div className="mt-1">
                                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {transaction.receipt_filename || "Receipt"}
                                          </p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            const receiptUrl = transaction.receipt_url!
                                            // Check if it's a file path (starts with "receipts/") or a public URL
                                            const isPath = receiptUrl.startsWith("receipts/")
                                            
                                            if (isPath) {
                                              try {
                                                const response = await officeFetch(`/api/admin/receipts/documents?path=${encodeURIComponent(receiptUrl)}`)
                                                
                                                if (response.ok) {
                                                  const data = await response.json()
                                                  if (data.url) {
                                                    window.open(data.url, "_blank")
                                                  } else {
                                                    alert("Failed to access receipt: No URL returned from server.")
                                                  }
                                                } else {
                                                  const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                                                  alert(`Failed to access receipt: ${errorData.error || response.statusText || "Please try again."}`)
                                                }
                                              } catch (error: any) {
                                                console.error("Error fetching signed URL:", error)
                                                alert(`Failed to access receipt: ${error.message || "Please try again."}`)
                                              }
                                            } else {
                                              // Public URL - open directly (backward compatibility)
                                              window.open(receiptUrl, "_blank")
                                            }
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          View
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 mt-1">No receipt uploaded</p>
                                  )}
                                </div>
                                )}

                                <div className="border-t pt-4">
                                  <label className="text-sm font-medium text-gray-600">Update Status</label>
                                  {transaction.type === "referral_payout" ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          void handleReferralPayoutStatusUpdate(transaction, "cancelled")
                                        }
                                        disabled={transaction.status === "cancelled"}
                                        className="text-gray-600 hover:text-gray-700"
                                      >
                                        Cancel Transfer
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          void handleReferralPayoutStatusUpdate(transaction, "completed")
                                        }
                                        disabled={transaction.status === "completed"}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        Transfer Complete
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleStatusUpdate(transaction.transaction_id, "processing")
                                        }
                                        disabled={transaction.status === "processing"}
                                      >
                                        Payment Received
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleStatusUpdate(transaction.transaction_id, "completed")
                                        }
                                        disabled={transaction.status === "completed"}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        {isHubTransaction(transaction) ? "Transaction Complete" : "Transfer Complete"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate(transaction.transaction_id, "failed")}
                                        disabled={transaction.status === "failed"}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        Mark Failed
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleStatusUpdate(transaction.transaction_id, "cancelled")
                                        }
                                        disabled={transaction.status === "cancelled"}
                                        className="text-gray-600 hover:text-gray-700"
                                      >
                                        {isHubTransaction(transaction) ? "Cancel Transaction" : "Cancel Transfer"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">No transactions found matching your criteria.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </OfficeDashboardLayout>
  )
}

function BitbankerSettlementForm({ transaction }: { transaction: CombinedTransaction }) {
  const meta = (transaction.settlement_metadata || {}) as Record<string, string | null>
  const [trc20TxHash, setTrc20TxHash] = useState(String(meta.trc20_tx_hash || ""))
  const [payoutReference, setPayoutReference] = useState(String(meta.payout_reference || ""))
  const [notes, setNotes] = useState(String(meta.notes || ""))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await officeDataStore.saveTransactionSettlement(transaction.transaction_id, {
        trc20TxHash,
        payoutReference,
        notes,
      })
    } catch (e) {
      console.error(e)
      alert("Failed to save settlement metadata")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2 border-t border-blue-100 pt-3 mt-2">
      <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Settlement (TRC20 / payout)</p>
      <Input
        placeholder="TRC20 transaction hash"
        value={trc20TxHash}
        onChange={(e) => setTrc20TxHash(e.target.value)}
        className="text-sm font-mono"
      />
      <Input
        placeholder="Recipient payout reference"
        value={payoutReference}
        onChange={(e) => setPayoutReference(e.target.value)}
        className="text-sm"
      />
      <Input placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm" />
      <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save settlement"}
      </Button>
    </div>
  )
}
