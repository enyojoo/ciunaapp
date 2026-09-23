import {
  isReferralPayoutMirrorReference,
  resolveTransactionListLine,
  sumCompletedVolumeInBaseCurrency,
} from "@ciuna/shared"
import { supabase } from "./supabase"
import { officeFetch } from "./api-client"
import { formatCurrency as formatMoney, roundMoney } from "@/utils/currency"

interface AdminData {
  users: any[]
  transactions: any[]
  referralPayoutRequests: any[]
  currencies: any[]
  exchangeRates: any[]
  baseCurrency: string
  stats: {
    totalUsers: number
    activeUsers: number
    verifiedUsers: number
    totalTransactions: number
    totalVolume: number
    pendingTransactions: number
  }
  recentActivity: any[]
  /** Completed volume by service line; `volume` is % of total; `volumeAmount` is total in base currency. */
  serviceLinePopularity: { service: string; volume: number; volumeAmount: number; transactions: number }[]
  lastUpdated: number
}

class OfficeDataStore {
  private data: AdminData | null = null
  private loading = false
  private refreshInterval: ReturnType<typeof setInterval> | null = null
  private listeners: Set<() => void> = new Set()
  private initialized = false
  private loadingPromise: Promise<AdminData> | null = null
  private realtimeChannels: ReturnType<typeof supabase.channel>[] = []

  constructor() {
    // Don't preload data immediately - wait for explicit initialization
    // this.initialize()
  }

  private async initialize() {
    if (this.initialized) return
    this.initialized = true

    // Start loading data immediately
    this.loadData().catch(console.error)
    this.startAutoRefresh()
    this.setupRealtimeSubscriptions()
  }

  // Public method to initialize when user is authenticated
  // Skip admin check since we already know from auth context
  async initializeWhenReady() {
    // Return existing loading promise if already loading
    if (this.loading && this.loadingPromise) {
      return this.loadingPromise
    }

    // Check if data is fresh (loaded within last minute)
    if (this.isDataFresh()) {
      return this.data
    }

    console.log("OfficeDataStore: Initializing...")
    await this.initialize()
  }

  // Direct initialize method (used when admin status is already confirmed)
  async initializeDirect() {
    // Try to load from cache first (for instant page loads)
    if (!this.data) {
      this.loadFromCache()
      if (this.data) {
        // Notify listeners with cached data immediately
        this.notify()
      }
    }

    // If data is fresh, don't reload - just return existing data
    if (this.initialized && this.isDataFresh()) {
      return this.data
    }

    // Return existing loading promise if already loading
    if (this.loading && this.loadingPromise) {
      return this.loadingPromise
    }

    if (!this.initialized) {
      this.initialized = true
      this.startAutoRefresh()
      this.setupRealtimeSubscriptions()
    }

    // Only load fresh data if cache is stale or doesn't exist
    if (!this.isDataFresh()) {
      this.loadingPromise = this.loadData()
      return this.loadingPromise
    }

    // Data is fresh, return it
    return this.data
  }

  private isDataFresh(): boolean {
    if (!this.data) {
      // Try to load from localStorage cache
      this.loadFromCache()
      if (!this.data) return false
    }
    // Extend freshness to 5 minutes since we have real-time updates
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - this.data.lastUpdated < fiveMinutes
  }

  private saveToCache() {
    if (typeof window === 'undefined' || !this.data) return
    try {
      const cacheKey = 'office_data_cache'
      const cacheData = {
        data: this.data,
        timestamp: Date.now(),
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error('OfficeDataStore: Error saving to cache:', error)
    }
  }

  private loadFromCache(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const cacheKey = 'office_data_cache'
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return false

      const { data, timestamp } = JSON.parse(cached)
      // Check if cache is still fresh (5 minutes)
      const fiveMinutes = 5 * 60 * 1000
      if (Date.now() - timestamp < fiveMinutes) {
        this.data = data
        if (this.data && !Array.isArray(this.data.serviceLinePopularity)) {
          this.data = { ...this.data, serviceLinePopularity: [] }
        }
        console.log('OfficeDataStore: Loaded data from cache')
        return true
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey)
        return false
      }
    } catch (error) {
      console.error('OfficeDataStore: Error loading from cache:', error)
      return false
    }
  }

  private clearCache() {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('office_data_cache')
    } catch (error) {
      console.error('OfficeDataStore: Error clearing cache:', error)
    }
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify() {
    // Only notify if we have data to prevent unnecessary re-renders
    if (this.data) {
      this.listeners.forEach((callback) => callback())
    }
  }

  getData(): AdminData | null {
    return this.data
  }

  isLoading(): boolean {
    return this.loading && !this.data
  }

  private async loadData(): Promise<AdminData> {
    if (this.loading && this.loadingPromise) {
      return this.loadingPromise
    }

    this.loading = true

    try {
      // Create timeout promise (15 seconds)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Data loading timeout")), 15000),
      )

      // Load critical data first (transactions, currencies, exchange rates, base currency)
      // These are needed for dashboard stats and can be shown immediately
      const criticalDataPromise = Promise.allSettled([
        this.loadTransactions(),
        this.loadCurrencies(),
        this.loadExchangeRates(),
        this.getAdminBaseCurrency(),
      ])

      const criticalResults = (await Promise.race([criticalDataPromise, timeoutPromise])) as PromiseSettledResult<any>[]

      // Extract critical results with fallbacks
      const transactionsResult = criticalResults[0].status === "fulfilled" ? criticalResults[0].value || [] : (this.data?.transactions || [])
      const currenciesResult = criticalResults[1].status === "fulfilled" ? criticalResults[1].value || [] : (this.data?.currencies || [])
      const exchangeRatesResult = criticalResults[2].status === "fulfilled" ? criticalResults[2].value || [] : (this.data?.exchangeRates || [])
      const baseCurrency = criticalResults[3].status === "fulfilled" ? criticalResults[3].value || "NGN" : (this.data?.baseCurrency || "NGN")

      const existingData = this.data

      // Calculate stats from transactions (we'll update with user count later)
      const tempStats = await this.calculateStatsFromTransactions(transactionsResult, baseCurrency, exchangeRatesResult)
      const previousUsers = existingData?.users ?? []
      const statsForCriticalNotify =
        previousUsers.length > 0 ? { ...tempStats, ...this.userCountStatsFromUsers(previousUsers) } : tempStats
      // Sort transactions by created_at (most recent first) before processing recent activity
      const sortedTransactions = [...transactionsResult].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
      const recentActivity = this.processRecentActivity(sortedTransactions.slice(0, 10))
      const serviceLinePopularity = this.processServiceLinePopularity(
        transactionsResult.filter((t) => t.status === "completed"),
        baseCurrency,
        exchangeRatesResult,
      )

      // Create initial data structure with critical data - preserve existing data to prevent flickering
      this.data = {
        users: existingData?.users || [], // Keep existing users or empty array
        transactions: transactionsResult,
        referralPayoutRequests: existingData?.referralPayoutRequests || [],
        currencies: currenciesResult,
        exchangeRates: exchangeRatesResult,
        baseCurrency,
        stats: statsForCriticalNotify,
        recentActivity,
        serviceLinePopularity,
        lastUpdated: Date.now(),
      }

      // Notify listeners with critical data immediately
      this.notify()

      // Load users and referral payouts in background (these take longer)
      const backgroundDataPromise = Promise.allSettled([
        this.loadUsers(transactionsResult), // Pass transactions to avoid re-querying
        this.loadReferralPayouts(),
      ])

      const backgroundResults = (await Promise.race([backgroundDataPromise, timeoutPromise])) as PromiseSettledResult<any>[]

      // Extract background results - preserve existing data if loading fails
      const usersResult = backgroundResults[0].status === "fulfilled" ? backgroundResults[0].value || [] : (this.data?.users || existingData?.users || [])
      const referralPayoutsResult = backgroundResults[1].status === "fulfilled" ? backgroundResults[1].value || [] : (this.data?.referralPayoutRequests || existingData?.referralPayoutRequests || [])

      // Recalculate stats with actual user count using already-loaded exchange rates
      const stats = await this.calculateStats(usersResult, transactionsResult, baseCurrency, exchangeRatesResult)

      // Only update if data actually changed to prevent flickering
      const usersChanged = JSON.stringify(usersResult) !== JSON.stringify(this.data?.users)
      const statsChanged = JSON.stringify(stats) !== JSON.stringify(this.data?.stats)
      const referralPayoutsChanged =
        JSON.stringify(referralPayoutsResult) !== JSON.stringify(this.data?.referralPayoutRequests)

      // Update data with background-loaded data only if something changed
      if (usersChanged || statsChanged || referralPayoutsChanged) {
        this.data = {
          users: usersResult,
          transactions: transactionsResult,
          referralPayoutRequests: referralPayoutsResult,
          currencies: currenciesResult,
          exchangeRates: exchangeRatesResult,
          baseCurrency,
          stats,
          recentActivity,
          serviceLinePopularity,
          lastUpdated: Date.now(),
        }

        // Notify listeners again with complete data
        this.notify()
      }
      
      // Save to cache for next page load
      this.saveToCache()
      
      return this.data
    } catch (error) {
      console.error("Error loading admin data:", error)
      // Return existing data on error to prevent blank screens
      if (this.data) {
        return this.data
      }
      // Try to load from cache as fallback
      if (this.loadFromCache()) {
        this.notify()
        return this.data
      }
      // If no existing data, return minimal structure
      throw error
    } finally {
      this.loading = false
      this.loadingPromise = null
    }
  }

  private async loadUsers(transactions?: any[]) {
    try {
      console.log("OfficeDataStore: Loading users...")
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("OfficeDataStore: Error loading users:", error)
        throw error
      }
      console.log("OfficeDataStore: Users loaded successfully:", users?.length || 0)

      // Get auth users data to include email_confirmed_at
      let authUsers = null
      try {
        const response = await officeFetch('/api/admin/auth-users')
        if (response.ok) {
          const data = await response.json()
          authUsers = { users: data.users }
        } else {
          console.error("OfficeDataStore: Error loading auth users:", response.statusText)
        }
      } catch (error) {
        console.error("OfficeDataStore: Error fetching auth users:", error)
      }

      // Calculate transaction stats for each user from already-loaded transactions
      // This avoids N+1 queries - much faster!
      const transactionMap = new Map<string, any[]>()
      if (transactions && transactions.length > 0) {
        transactions.forEach((tx) => {
          const userId = tx.user_id
          if (!transactionMap.has(userId)) {
            transactionMap.set(userId, [])
          }
          transactionMap.get(userId)!.push(tx)
        })
      }

      const usersWithStats = (users || []).map((user) => {
        const userTransactions = transactionMap.get(user.id) || []
        const completedTransactions = userTransactions.filter((tx) => tx.status === "completed")
        const totalTransactions = completedTransactions.length
        
        // Volume will be calculated in the users page using exchange rates
        // This avoids needing exchange rates here and ensures consistency
        const totalVolume = 0

        // Find corresponding auth user to get email_confirmed_at
        const authUser = authUsers?.users?.find(au => au.id === user.id)
        
        return {
          ...user,
          totalTransactions,
          totalVolume,
          // Use email_confirmed_at from auth system for email verification status
          email_confirmed_at: authUser?.email_confirmed_at,
          // Email verification status (derived from email_confirmed_at)
          email_verified: !!authUser?.email_confirmed_at,
        }
      })

      return usersWithStats
    } catch (error) {
      console.error("Error loading users:", error)
      throw error
    }
  }

  private async loadReferralPayouts() {
    try {
      const { data, error } = await supabase
        .from("referral_payout_requests")
        .select(
          `
          *,
          recipient:recipients(full_name, bank_name, account_number, currency),
          user:users(first_name, last_name, email)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) {
        console.error("OfficeDataStore: referral payouts:", error)
        return []
      }
      return (data || []).map((r: any) => ({ ...r, type: "referral_payout" }))
    } catch (e) {
      console.error("loadReferralPayouts:", e)
      return []
    }
  }

  private async loadTransactions() {
    try {
      console.log("OfficeDataStore: Loading transactions...")
      
      // Load send transactions
      const { data: sendTransactions, error: sendError } = await supabase
        .from("transactions")
        .select(`
          *,
          user:users(first_name, last_name, email),
          recipient:recipients(full_name, bank_name, account_number, routing_number, sort_code, iban, swift_bic, currency, address_line1, address_line2, city, state, postal_code, transfer_type, checking_or_savings),
          delivery_address:delivery_addresses!delivery_address_id(address_line, phone)
        `)
        .order("created_at", { ascending: false })
        .limit(200)

      if (sendError) {
        console.error("OfficeDataStore: Error loading send transactions:", sendError)
        throw sendError
      }

      const allTransactions = (sendTransactions || []).map((tx: any) => {
        const referralRow = tx.type === "referral_payout" || isReferralPayoutMirrorReference(tx.reference)
        const hubRow = tx.transaction_source === "hub" || tx.type === "hub"
        return {
        ...tx,
          type: referralRow ? "referral_payout" : hubRow ? "hub" : "send",
        }
      })

      const hubProductIds = [
        ...new Set(
          allTransactions
            .map((t: { hub_product_id?: string | null }) =>
              t.hub_product_id ? String(t.hub_product_id).trim() : "",
            )
            .filter(Boolean),
        ),
      ]
      let categoryByProductId = new Map<string, string>()
      if (hubProductIds.length > 0) {
        const { data: products, error: pErr } = await supabase
          .from("hub_products")
          .select("id, category")
          .in("id", hubProductIds)
        if (!pErr && products?.length) {
          categoryByProductId = new Map(
            products.map((p: { id: string; category?: string | null }) => [
              String(p.id),
              String(p.category ?? ""),
            ]),
          )
        }
      }
      for (const tx of allTransactions) {
        const pid = tx.hub_product_id ? String(tx.hub_product_id).trim() : ""
        if (pid && categoryByProductId.has(pid)) {
          tx.hub_product_category = categoryByProductId.get(pid) ?? null
        }
      }

      console.log("OfficeDataStore: Transactions loaded successfully:", {
        send: sendTransactions?.length || 0,
        total: allTransactions.length,
      })
      
      return allTransactions
    } catch (error) {
      console.error("Error loading transactions:", error)
      return [] // Return empty array on error to prevent crashes
    }
  }

  private async loadCurrencies() {
    try {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .order("code", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error loading currencies:", error)
      return [] // Return empty array on error to prevent crashes
    }
  }

  private async loadExchangeRates() {
    try {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select(`
          *,
          from_currency_info:currencies!exchange_rates_from_currency_fkey(code, name, symbol),
          to_currency_info:currencies!exchange_rates_to_currency_fkey(code, name, symbol)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error loading exchange rates:", error)
      return [] // Return empty array on error to prevent crashes
    }
  }

  /** Stable fingerprint for applied rates (ignores joined relation shape/order from PostgREST). */
  private exchangeRatesContentFingerprint(rates: any[] | undefined): string {
    if (!rates?.length) return ""
    return [...rates]
      .map((r) => {
        const rate = Number(r.rate)
        const ratePart = Number.isFinite(rate) ? String(rate) : ""
        const ts = String(r.updated_at ?? r.created_at ?? "")
        return `${r.from_currency}\t${r.to_currency}\t${ratePart}\t${ts}`
      })
      .sort()
      .join("\n")
  }

  private async calculateStatsFromTransactions(transactions: any[], baseCurrency: string, exchangeRates: any[] = []) {
    const totalTransactions = transactions.length
    const pendingTransactions = transactions.filter((t) => t.status === "pending" || t.status === "processing").length

    // Calculate total volume in admin's base currency using already-loaded exchange rates
    const completedTransactions = transactions.filter((t) => t.status === "completed")
    const totalVolume = this.calculateVolumeInBaseCurrency(completedTransactions, baseCurrency, exchangeRates)

    return {
      totalUsers: 0, // Will be updated when users load
      activeUsers: 0,
      verifiedUsers: 0,
      totalTransactions,
      totalVolume,
      pendingTransactions,
    }
  }

  /** User-only stats; shared with transaction-based stats merge so stale refreshes do not flash zeros. */
  private userCountStatsFromUsers(users: any[]) {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      verifiedUsers: users.filter((u) => u.kyc_status === "approved" || u.email_confirmed_at).length,
    }
  }

  private async calculateStats(users: any[], transactions: any[], baseCurrency: string, exchangeRates: any[] = []) {
    const { totalUsers, activeUsers, verifiedUsers } = this.userCountStatsFromUsers(users)

    const totalTransactions = transactions.length
    const pendingTransactions = transactions.filter((t) => t.status === "pending" || t.status === "processing").length

    // Calculate total volume in admin's base currency using already-loaded exchange rates
    const completedTransactions = transactions.filter((t) => t.status === "completed")
    const totalVolume = this.calculateVolumeInBaseCurrency(completedTransactions, baseCurrency, exchangeRates)

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalTransactions,
      totalVolume,
      pendingTransactions,
    }
  }

  private async getAdminBaseCurrency(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "base_currency")
        .single()

      if (error || !data) return "NGN" // Default to NGN
      return data.value
    } catch {
      return "NGN" // Default fallback
    }
  }

  private calculateVolumeInBaseCurrency(transactions: any[], baseCurrency: string, exchangeRates: any[] = []): number {
    return sumCompletedVolumeInBaseCurrency(transactions, baseCurrency, exchangeRates)
  }

  private convertCurrencyWithRates(amount: number, fromCurrency: string, toCurrency: string, rateMap: Map<string, number>): number {
    // Try direct rate first
    const directKey = `${fromCurrency}_${toCurrency}`
    const directRate = rateMap.get(directKey)
    if (directRate) {
      return amount * directRate
    }

    // Try reverse rate
    const reverseKey = `${toCurrency}_${fromCurrency}`
    const reverseRate = rateMap.get(reverseKey)
    if (reverseRate && reverseRate > 0) {
      return amount / reverseRate
    }

    // No rate found in database - return 0 to exclude from volume calculations
    // This ensures we only use database rates
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency} in database`)
    return 0
  }

  private processRecentActivity(transactions: any[]) {
    return transactions.map((tx) => {
      const amount = this.formatCurrency(this.totalToPaidSendAmount(tx), tx.send_currency || "")

      return {
        id: tx.id || tx.transaction_id,
        type: this.getActivityType(tx.status),
        message: this.getActivityMessage(tx),
        user: tx.user ? `${tx.user.first_name} ${tx.user.last_name}` : undefined,
        amount,
        time: this.getRelativeTime(tx.created_at),
        status: this.getActivityStatus(tx.status),
      }
    })
  }

  private buildActiveRateMap(exchangeRates: any[]): Map<string, number> {
    const m = new Map<string, number>()
    for (const r of exchangeRates || []) {
      if (!r) continue
      if (r.status != null && r.status !== "active") continue
      const from = r.from_currency
      const to = r.to_currency
      if (typeof from !== "string" || typeof to !== "string") continue
      const rate = Number(r.rate)
      if (!Number.isFinite(rate) || rate <= 0) continue
      m.set(`${from}_${to}`, rate)
    }
    return m
  }

  /**
   * Completed volume in base currency for dashboard service-line buckets.
   * Matches `sumCompletedVolumeInBaseCurrency`: hub and customer send only (no referral payouts).
   */
  private completedTxVolumeInBaseForServiceLine(
    tx: any,
    baseCurrency: string,
    rateMap: Map<string, number>,
  ): number {
    if (!tx || tx.status !== "completed") return 0
    if (isReferralPayoutMirrorReference(tx.reference)) return 0
    if (tx.type === "referral_payout") return 0

    const base = (baseCurrency || "NGN").trim() || "NGN"
    const isHub = tx.type === "hub" || tx.transaction_source === "hub"
    let amount = 0
    let currency = base

    if (isHub) {
      amount = Number(tx.total_amount) || Number(tx.send_amount) || 0
      currency = (typeof tx.send_currency === "string" && tx.send_currency.trim() ? tx.send_currency : base) as string
    } else {
      const inferredType = tx.type || (Number(tx.send_amount) > 0 ? "send" : null)
      if (inferredType !== "send") return 0
      amount = Number(tx.send_amount) || 0
      currency = (typeof tx.send_currency === "string" && tx.send_currency.trim() ? tx.send_currency : base) as string
    }

    if (amount <= 0) return 0
    return this.convertCurrencyWithRates(amount, currency, base, rateMap)
  }

  private processServiceLinePopularity(transactions: any[], baseCurrency: string, exchangeRates: any[]) {
    const rateMap = this.buildActiveRateMap(exchangeRates)
    const completed = (transactions || []).filter(
      (t) => t?.status === "completed" && !isReferralPayoutMirrorReference(t?.reference),
    )

    type ServiceLineKey = "Send" | "Food" | "Mart" | "Experts"
    const buckets: Record<ServiceLineKey, any[]> = {
      Send: [],
      Food: [],
      Mart: [],
      Experts: [],
    }

    for (const tx of completed) {
      const line = resolveTransactionListLine(
        {
          type: tx.type,
          transaction_source: tx.transaction_source ?? null,
          reference: tx.reference ?? null,
        },
        tx.hub_product_category ?? null,
        (tx as { hub_snapshot?: Record<string, unknown> | null }).hub_snapshot ?? null,
      )
      if (line.kind === "referral_payout") continue

      const key: ServiceLineKey =
        line.kind === "send"
          ? "Send"
          : line.kind === "experts"
            ? "Experts"
            : line.line === "food"
              ? "Food"
              : "Mart"

      buckets[key].push(tx)
    }

    const order: ServiceLineKey[] = ["Send", "Food", "Mart", "Experts"]
    const rows = order.map((service) => {
      const list = buckets[service]
      let baseVolume = 0
      for (const tx of list) {
        baseVolume += this.completedTxVolumeInBaseForServiceLine(tx, baseCurrency, rateMap)
      }
      return { service, baseVolume, transactions: list.length }
    })

    const totalBase = rows.reduce((s, r) => s + r.baseVolume, 0)
    return rows.map((r) => ({
      service: r.service,
      volume: totalBase > 0 ? (r.baseVolume / totalBase) * 100 : 0,
      volumeAmount: roundMoney(r.baseVolume),
      transactions: r.transactions,
    }))
  }

  private getActivityType(status: string) {
    const s = String(status || "").toLowerCase()
    switch (s) {
      case "completed":
      case "deposited":
        return "transaction_completed"
      case "failed":
        return "transaction_failed"
      case "cancelled":
        return "transaction_cancelled"
      case "processing":
      case "converting":
      case "converted":
        return "transaction_processing"
      case "pending":
      case "confirmed":
        return "transaction_pending"
      default:
        return "transaction_pending"
    }
  }

  /** Same as office `/transactions` "Total to paid (send)": `total_amount` when set, else `send_amount`. */
  private totalToPaidSendAmount(tx: { total_amount?: number | null; send_amount?: number | null }): number {
    const total = Number(tx.total_amount)
    if (Number.isFinite(total) && total > 0) return total
    return Number(tx.send_amount) || 0
  }

  /** Service-line label for Recent Activity copy (e.g. Mart Order, Food Order, Send Money, Referral Payout). */
  private getActivityServiceTitle(transaction: any): string {
    if (transaction.type === "referral_payout" || isReferralPayoutMirrorReference(transaction.reference)) {
      return "Referral Payout"
    }
    const line = resolveTransactionListLine(
      {
        type: transaction.type,
        transaction_source: transaction.transaction_source ?? null,
        reference: transaction.reference ?? null,
      },
      transaction.hub_product_category ?? null,
      transaction.hub_snapshot ?? null,
    )
    if (line.kind === "experts") return "Expert Session"
    if (line.kind === "hub") {
      return line.line === "food" ? "Food Order" : "Mart Order"
    }
    return "Send Money"
  }

  private getActivityMessage(transaction: any) {
    const title = this.getActivityServiceTitle(transaction)
    const s = String(transaction.status || "").toLowerCase()
    switch (s) {
      case "completed":
      case "deposited":
        return `${title} Completed`
      case "failed":
        return `${title} Failed`
      case "cancelled":
        return `${title} Cancelled`
      case "processing":
      case "converting":
      case "converted":
        return `${title} Processing`
      case "pending":
      case "confirmed":
        return `${title} Created`
      default:
        return `${title} is being processed`
    }
  }

  private getActivityStatus(status: string) {
    const s = String(status || "").toLowerCase()
    switch (s) {
      case "completed":
      case "deposited":
        return "success"
      case "failed":
        return "error"
      case "cancelled":
        return "error"
      case "processing":
      case "converting":
      case "converted":
        return "warning"
      case "pending":
      case "confirmed":
        return "warning"
      default:
        return "info"
    }
  }

  private getRelativeTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  private formatCurrency(amount: number, currency = "NGN") {
    return formatMoney(roundMoney(amount), currency)
  }

  private startAutoRefresh() {
    // Refresh data every 5 minutes in background (as fallback if real-time fails)
    // Only refresh if data is stale (older than 5 minutes)
    this.refreshInterval = setInterval(
      () => {
        if (!this.isDataFresh()) {
          this.loadData().catch(console.error)
        }
      },
      5 * 60 * 1000, // 5 minutes
    )
  }

  private setupRealtimeSubscriptions() {
    // Clean up any existing channels
    this.cleanupRealtimeSubscriptions()

    // Subscribe to transactions table changes (send transactions)
    const transactionsChannel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions',
        },
        async (payload) => {
          console.log('OfficeDataStore: Transaction change received via Realtime:', payload.eventType)
          // Reload transactions and recalculate stats
          await this.refreshTransactionsAndStats()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('OfficeDataStore: Subscribed to transactions real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          // Realtime subscription failed - this is expected if Realtime is not enabled
          // Auto-refresh will handle updates instead (silent fallback)
        }
      })

    // Subscribe to users table changes
    const usersChannel = supabase
      .channel('admin-users')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'users',
        },
        async (payload) => {
          console.log('OfficeDataStore: User change received via Realtime:', payload.eventType)
          // Reload users and recalculate stats
          await this.refreshUsersAndStats()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('OfficeDataStore: Subscribed to users real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('OfficeDataStore: Users subscription error')
        }
      })

    // Subscribe to currencies table changes
    const currenciesChannel = supabase
      .channel('admin-currencies')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'currencies',
        },
        async (payload) => {
          console.log('OfficeDataStore: Currency change received via Realtime:', payload.eventType)
          // Reload currencies
          await this.refreshCurrencies()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('OfficeDataStore: Subscribed to currencies real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('OfficeDataStore: Currencies subscription error')
        }
      })

    // Subscribe to exchange_rates table changes (FX rows updated by web cron `sync-exchange-rates` or manual edits)
    const exchangeRatesChannel = supabase
      .channel('admin-exchange-rates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'exchange_rates',
        },
        async (payload) => {
          console.log('OfficeDataStore: Exchange rate change received via Realtime:', payload.eventType)
          // Reload exchange rates
          await this.refreshExchangeRates()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('OfficeDataStore: Subscribed to exchange rates real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('OfficeDataStore: Exchange rates subscription error')
        }
      })

    // Store channels for cleanup
    this.realtimeChannels = [
      transactionsChannel,
      usersChannel,
      currenciesChannel,
      exchangeRatesChannel,
    ]
  }

  private async refreshTransactionsAndStats() {
    if (!this.data) return

    try {
      const transactionsResult = await this.loadTransactions()
      const referralPayoutsResult = await this.loadReferralPayouts()
      // Use already-loaded exchange rates for volume calculation
      const stats = await this.calculateStats(this.data.users, transactionsResult, this.data.baseCurrency, this.data.exchangeRates)
      const recentActivity = this.processRecentActivity(transactionsResult.slice(0, 10))
      const serviceLinePopularity = this.processServiceLinePopularity(
        transactionsResult.filter((t) => t.status === "completed"),
        this.data.baseCurrency,
        this.data.exchangeRates,
      )

      // Create a new object reference to ensure React detects the change
      this.data = {
        ...this.data,
        transactions: transactionsResult,
        referralPayoutRequests: referralPayoutsResult,
        stats: stats,
        recentActivity: recentActivity,
        serviceLinePopularity: serviceLinePopularity,
        lastUpdated: Date.now(),
      }
      this.saveToCache()
      this.notify()
    } catch (error) {
      console.error('OfficeDataStore: Error refreshing transactions:', error)
    }
  }

  private async refreshUsersAndStats() {
    if (!this.data) return

    try {
      // Pass existing transactions to avoid re-querying
      const usersResult = await this.loadUsers(this.data.transactions)
      // Use already-loaded exchange rates for volume calculation
      const stats = await this.calculateStats(usersResult, this.data.transactions, this.data.baseCurrency, this.data.exchangeRates)

      // Only update if data actually changed
      const usersChanged = JSON.stringify(usersResult) !== JSON.stringify(this.data.users)
      const statsChanged = JSON.stringify(stats) !== JSON.stringify(this.data.stats)

      if (usersChanged || statsChanged) {
        // Create a new object reference to ensure React detects the change
        this.data = {
          ...this.data,
          users: usersResult,
          stats: stats,
          lastUpdated: Date.now(),
        }
        this.saveToCache()
        this.notify()
      }
    } catch (error) {
      console.error('OfficeDataStore: Error refreshing users:', error)
    }
  }

  private async refreshCurrencies() {
    if (!this.data) return

    try {
      const currenciesResult = await this.loadCurrencies()
      
      // Only update if data actually changed
      const currenciesChanged = JSON.stringify(currenciesResult) !== JSON.stringify(this.data.currencies)
      
      if (currenciesChanged) {
        // Create a new object reference to ensure React detects the change
        this.data = {
          ...this.data,
          currencies: currenciesResult,
          lastUpdated: Date.now(),
        }
        this.saveToCache()
        this.notify()
      }
    } catch (error) {
      console.error('OfficeDataStore: Error refreshing currencies:', error)
    }
  }

  private async refreshExchangeRates() {
    if (!this.data) return

    try {
      const exchangeRatesResult = await this.loadExchangeRates()
      // Recalculate stats since exchange rates affect volume calculations
      const stats = await this.calculateStats(this.data.users, this.data.transactions, this.data.baseCurrency, exchangeRatesResult)
      
      // Only update if data actually changed
      const exchangeRatesChanged =
        this.exchangeRatesContentFingerprint(exchangeRatesResult) !==
        this.exchangeRatesContentFingerprint(this.data.exchangeRates)
      const statsChanged = JSON.stringify(stats) !== JSON.stringify(this.data.stats)
      
      if (exchangeRatesChanged || statsChanged) {
        const serviceLinePopularity = this.processServiceLinePopularity(
          this.data.transactions.filter((t) => t.status === "completed"),
          this.data.baseCurrency,
          exchangeRatesResult,
        )
        // Create a new object reference to ensure React detects the change
        this.data = {
          ...this.data,
          exchangeRates: exchangeRatesResult,
          stats: stats,
          serviceLinePopularity,
          lastUpdated: Date.now(),
        }
        this.saveToCache()
        this.notify()
      }
    } catch (error) {
      console.error('OfficeDataStore: Error refreshing exchange rates:', error)
    }
  }

  private cleanupRealtimeSubscriptions() {
    this.realtimeChannels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.realtimeChannels = []
  }

  async saveTransactionSettlement(
    transactionId: string,
    settlement: { trc20TxHash?: string; payoutReference?: string; notes?: string },
  ) {
    const response = await officeFetch(`/api/admin/transactions/${transactionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        settlement_metadata: {
          trc20_tx_hash: settlement.trc20TxHash?.trim() || null,
          payout_reference: settlement.payoutReference?.trim() || null,
          notes: settlement.notes?.trim() || null,
          recorded_at: new Date().toISOString(),
        },
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result?.error || "Failed to save settlement")
    }
    return result
  }

  async updateTransactionStatus(transactionId: string, newStatus: string) {
    try {
      const payload =
        newStatus === "completed"
          ? { status: newStatus, completed_at: new Date().toISOString() }
          : { status: newStatus }
      const response = await officeFetch(`/api/admin/transactions/${transactionId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "Failed to update transaction")
      }

      // Update local data after successful update
      if (this.data) {
        const updatedTransactions = this.data.transactions.map((tx) =>
          tx.transaction_id === transactionId
            ? {
                ...tx,
                status: newStatus,
                ...(newStatus === "completed" ? { completed_at: payload.completed_at } : {}),
              }
            : tx,
        )
        const updatedStats = await this.calculateStats(this.data.users, updatedTransactions, this.data.baseCurrency, this.data.exchangeRates)
        const updatedRecentActivity = this.processRecentActivity(updatedTransactions.slice(0, 10))
        const updatedServiceLinePopularity = this.processServiceLinePopularity(
          updatedTransactions.filter((t) => t.status === "completed"),
          this.data.baseCurrency,
          this.data.exchangeRates,
        )
        
        // Only update if something actually changed
        const transactionsChanged = JSON.stringify(updatedTransactions) !== JSON.stringify(this.data.transactions)
        const statsChanged = JSON.stringify(updatedStats) !== JSON.stringify(this.data.stats)
        const recentActivityChanged = JSON.stringify(updatedRecentActivity) !== JSON.stringify(this.data.recentActivity)
        const serviceLineChanged =
          JSON.stringify(updatedServiceLinePopularity) !== JSON.stringify(this.data.serviceLinePopularity)
        
        if (transactionsChanged || statsChanged || recentActivityChanged || serviceLineChanged) {
          this.data.transactions = updatedTransactions
          this.data.stats = updatedStats
          this.data.recentActivity = updatedRecentActivity
          this.data.serviceLinePopularity = updatedServiceLinePopularity
          this.data.lastUpdated = Date.now()
          this.saveToCache()
          this.notify()
        }
      }

      // Send email notification in background (non-blocking)
      console.log('OfficeDataStore: Sending email notification for transaction:', transactionId, 'status:', newStatus)
      this.sendEmailNotification(transactionId, newStatus).catch(error => {
        console.error('Email notification failed:', error)
        // Don't throw - email failure shouldn't break the status update
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Send email notification in background (non-blocking)
   */
  private async sendEmailNotification(transactionId: string, status: string): Promise<void> {
    try {
      console.log('OfficeDataStore: sendEmailNotification called for:', transactionId, status)
      
      // Send user notification email only (no admin notification for status updates)
      console.log('OfficeDataStore: Sending user notification email')
      const userResponse = await officeFetch('/api/send-email-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'transaction',
          transactionId,
          status
        })
      })
      
      console.log('OfficeDataStore: User email notification response:', userResponse.status, userResponse.statusText)
      const userResponseData = await userResponse.json()
      console.log('OfficeDataStore: User email notification response data:', userResponseData)
    } catch (error) {
      console.error('Failed to send email notification:', error)
      // Don't throw - this is non-blocking
    }
  }

  async updateUserStatus(userId: string, newStatus: string) {
    try {
      console.log(`OfficeDataStore: Updating user ${userId} status to ${newStatus}`)
      
      const { error } = await supabase
        .from("users")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      // Update local data
      if (this.data) {
        this.data.users = this.data.users.map((user) => 
          user.id === userId ? { ...user, status: newStatus, updated_at: new Date().toISOString() } : user
        )
        this.data.stats = await this.calculateStats(this.data.users, this.data.transactions, this.data.baseCurrency)
        this.notify()
        console.log("Local data updated successfully")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      throw error
    }
  }

  async updateUserVerification(userId: string, newStatus: string) {
    try {
      console.log(`OfficeDataStore: Updating user ${userId} KYC status to ${newStatus}`)
      
      // Map UI verification values to kyc_status
      const statusMap: Record<string, string> = {
        "verified": "approved",
        "pending": "not_started",
        "rejected": "rejected",
        "unverified": "not_started",
      }
      const kycStatus = statusMap[newStatus] || newStatus
      
      const { error } = await supabase
        .from("users")
        .update({
          kyc_status: kycStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      // Update local data
      if (this.data) {
        this.data.users = this.data.users.map((user) => 
          user.id === userId ? { ...user, kyc_status: kycStatus, updated_at: new Date().toISOString() } : user
        )
        this.data.stats = await this.calculateStats(this.data.users, this.data.transactions, this.data.baseCurrency)
        this.notify()
        console.log("Local data updated successfully")
      }
    } catch (error) {
      console.error("Error updating user verification:", error)
      throw error
    }
  }

  async updateCurrencyStatus(currencyId: string, newStatus: string) {
    try {
      // Update database first
      const { error } = await supabase
        .from("currencies")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currencyId)

      if (error) throw error

      // Update local data immediately after successful database update
      if (this.data) {
        this.data.currencies = this.data.currencies.map((currency) =>
          currency.id === currencyId
            ? { ...currency, status: newStatus, updated_at: new Date().toISOString() }
            : currency,
        )
        this.notify()
      }
    } catch (error) {
      throw error
    }
  }

  async updateCurrency(currencyId: string, updates: { can_send?: boolean; can_receive?: boolean; [key: string]: any }) {
    try {
      // Update database first
      const { error } = await supabase
        .from("currencies")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currencyId)

      if (error) throw error

      // Update local data immediately after successful database update
      if (this.data) {
        this.data.currencies = this.data.currencies.map((currency) =>
          currency.id === currencyId
            ? { ...currency, ...updates, updated_at: new Date().toISOString() }
            : currency,
        )
        this.notify()
      }
    } catch (error) {
      throw error
    }
  }

  async updateExchangeRates(updates: any[]) {
    try {
      // Update database first
      const { error } = await supabase.from("exchange_rates").upsert(updates, {
        onConflict: "from_currency,to_currency",
        ignoreDuplicates: false,
      })

      if (error) throw error

      // Reload exchange rates to get the latest data
      const freshExchangeRates = await this.loadExchangeRates()

      // Update local data immediately after successful database update
      if (this.data) {
        this.data.exchangeRates = freshExchangeRates
        this.notify()
      }
    } catch (error) {
      throw error
    }
  }

  async addCurrency(currencyData: any) {
    try {
      // Insert new currency
      const { data: newCurrency, error } = await supabase.from("currencies").insert(currencyData).select().single()

      if (error) throw error

      // Update local data immediately
      if (this.data) {
        this.data.currencies = [...this.data.currencies, newCurrency]
        this.notify()
      }

      return newCurrency
    } catch (error) {
      throw error
    }
  }

  async deleteCurrency(currencyId: string) {
    try {
      const currency = this.data?.currencies.find((c) => c.id === currencyId)
      if (!currency) return

      // Delete exchange rates first
      const { error: ratesError } = await supabase
        .from("exchange_rates")
        .delete()
        .or(`from_currency.eq.${currency.code},to_currency.eq.${currency.code}`)

      if (ratesError) throw ratesError

      // Delete currency
      const { error } = await supabase.from("currencies").delete().eq("id", currencyId)

      if (error) throw error

      // Update local data immediately
      if (this.data) {
        this.data.currencies = this.data.currencies.filter((c) => c.id !== currencyId)
        this.data.exchangeRates = this.data.exchangeRates.filter(
          (rate) => rate.from_currency !== currency.code && rate.to_currency !== currency.code,
        )
        this.notify()
      }
    } catch (error) {
      throw error
    }
  }

  async updateCurrencies() {
    try {
      const [currencies, exchangeRates] = await Promise.all([this.loadCurrencies(), this.loadExchangeRates()])

      if (this.data) {
        this.data.currencies = currencies
        this.data.exchangeRates = exchangeRates
        this.notify()
      }
    } catch (error) {
      throw error
    }
  }

  // Method to refresh data when base currency changes
  async refreshDataForBaseCurrencyChange() {
    try {
      await this.loadData()
    } catch (error) {
      console.error("Error refreshing data for base currency change:", error)
    }
  }

  // Method to manually refresh all data
  async refreshAllData() {
    try {
      console.log("OfficeDataStore: Manually refreshing all data...")
      await this.loadData()
      console.log("OfficeDataStore: Data refresh completed")
    } catch (error) {
      console.error("Error refreshing all data:", error)
    }
  }

  // Payment Methods methods
  async loadPaymentMethods() {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("currency", { ascending: true })
        .order("is_default", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error loading payment methods:", error)
      throw error
    }
  }

  async createPaymentMethod(paymentMethod: any) {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert([paymentMethod])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating payment method:", error)
      throw error
    }
  }

  async updatePaymentMethod(id: string, paymentMethod: any) {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .update(paymentMethod)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating payment method:", error)
      throw error
    }
  }

  async deletePaymentMethod(id: string) {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error deleting payment method:", error)
      throw error
    }
  }

  async updatePaymentMethodStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ status })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating payment method status:", error)
      throw error
    }
  }

  async setDefaultPaymentMethod(id: string, currency: string) {
    try {
      // First, unset all defaults for this currency
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("currency", currency)

      // Then set the selected payment method as default
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error setting default payment method:", error)
      throw error
    }
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    this.cleanupRealtimeSubscriptions()
    this.listeners.clear()
    // Note: We keep cache in localStorage for next session
  }

  // Method to clear cache (useful for logout or forced refresh)
  clearDataCache() {
    this.clearCache()
    this.data = null
    this.initialized = false
  }
}

export const officeDataStore = new OfficeDataStore()

/** Same rules as web `/api/user/completed-volume` (hub total_amount, active rates, no referral mirror rows). */
export function calculateUserVolume(
  transactions: any[],
  baseCurrency: string,
  exchangeRates: any[]
): number {
  return sumCompletedVolumeInBaseCurrency(transactions, baseCurrency, exchangeRates)
}
