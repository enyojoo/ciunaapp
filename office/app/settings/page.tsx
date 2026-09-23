"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Save,
  Edit,
  Plus,
  Trash2,
  CreditCard,
  QrCode,
  Building2,
  MoreHorizontal,
  X,
  Upload,
  Info,
  Coins,
  Smartphone,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { PAYMENT_QR_CODES_BUCKET } from "@/lib/hub-assets-bucket"
import { officeDataStore } from "@/lib/office-data-store"
import { officeFetch } from "@/lib/api-client"
import { HubServiceLinesManager, type HubServiceLine } from "@/components/settings/hub-service-lines-manager"
import { OfficeRatesPanel } from "@/components/settings/office-rates-panel"
import { OfficeAdminUsersPanel, type AdminUserRow } from "@/components/settings/office-admin-users-panel"

const REFERRAL_HELP_POLICY_CURRENCY =
  "Thresholds and fixed rewards are interpreted in this currency (FX uses your exchange rates)."
const REFERRAL_HELP_PERCENT_OF_SEND =
  "Enter as a percentage (e.g. 0.5 means 0.5% of each send in policy currency)."
const REFERRAL_HELP_DURATION =
  "From each referral's first qualifying completed send; end date is fixed when first calculated. Later changes here do not move existing referrals' windows."
const REFERRAL_HELP_COMMISSION_TIERS =
  "Each number is the top of a range for the current UTC quarter. Example: 5 means that rate applies from 1 to 5 qualified referees, 10 means the next rate applies from 6 to 10."
import {
  getAccountTypeConfigFromCurrency,
  getAccountTypeFromCurrency,
  validateField,
  formatFieldValue,
} from "@/lib/currency-account-types"

const REFERRAL_PERCENT_DURATION_OPTIONS = [3, 6, 8, 12] as const

type ReferralPercentTierRow = {
  min_qualified_referees_in_quarter: number
  percent_of_send: number
}

function defaultReferralPercentTiers(): ReferralPercentTierRow[] {
  return [{ min_qualified_referees_in_quarter: 5, percent_of_send: 0.005 }]
}

function parseReferralPercentTiers(raw: unknown, fallbackPercent: number): ReferralPercentTierRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ min_qualified_referees_in_quarter: 5, percent_of_send: fallbackPercent }]
  }
  const rows: ReferralPercentTierRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const min = Number(o.min_qualified_referees_in_quarter ?? o.min ?? 0)
    const pct = Number(o.percent_of_send ?? o.percent ?? fallbackPercent)
    if (!Number.isFinite(min) || !Number.isFinite(pct)) continue
    rows.push({
      min_qualified_referees_in_quarter: Math.max(0, Math.floor(min)),
      percent_of_send: pct,
    })
  }
  if (rows.length === 0) {
    return [{ min_qualified_referees_in_quarter: 5, percent_of_send: fallbackPercent }]
  }
  rows.sort((a, b) => a.min_qualified_referees_in_quarter - b.min_qualified_referees_in_quarter)
  const dedup: ReferralPercentTierRow[] = []
  for (const r of rows) {
    const last = dedup[dedup.length - 1]
    if (last && last.min_qualified_referees_in_quarter === r.min_qualified_referees_in_quarter) {
      dedup[dedup.length - 1] = r
    } else {
      dedup.push(r)
    }
  }
  return dedup
}

interface SystemSetting {
  id: string
  key: string
  value: string
  data_type: string
  category: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  flag_svg: string
  status: string
  created_at: string
  updated_at: string
}

interface PaymentMethod {
  id: string
  currency: string
  type: string
  provider?: string
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
  completion_timer_seconds?: number
  is_default: boolean
  status: string
  created_at: string
  updated_at: string
}

const SETTINGS_TAB_IDS = new Set([
  "platform",
  "payment",
  "security",
  "referrals",
  "hubServices",
  "rates",
  "admin",
])

export default function AdminSettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [activeTab, setActiveTab] = useState("platform")
  const handleSettingsTabChange = (value: string) => {
    setActiveTab(value)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", value)
      window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`)
    }
  }

  const [saving, setSaving] = useState(false)
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false)
  const [isEditPaymentMethodOpen, setIsEditPaymentMethodOpen] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isEditingSecuritySettings, setIsEditingSecuritySettings] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    currency: "",
    type: "bank_account",
    name: "",
    account_name: "",
    account_number: "",
    bank_name: "",
    routing_number: "",
    sort_code: "",
    iban: "",
    swift_bic: "",
    qr_code_data: "",
    crypto_asset: "",
    crypto_network: "",
    wallet_address: "",
    instructions: "",
    is_default: false,
    provider: "manual",
  })

  // Add these state variables after the existing state declarations
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [editingQrCodeFile, setEditingQrCodeFile] = useState<File | null>(null)
  const [uploadingQrCode, setUploadingQrCode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Platform configuration derived from system settings
  const [platformConfig, setPlatformConfig] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    baseCurrency: "NGN",
  })

  // Security settings derived from system settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    accountLockoutDuration: 15,
  })

  const [originalSecuritySettings, setOriginalSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    accountLockoutDuration: 15,
  })

  const [hubServiceLines, setHubServiceLines] = useState<HubServiceLine[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [initialSettingsLoadComplete, setInitialSettingsLoadComplete] = useState(false)

  const [referralProgram, setReferralProgram] = useState({
    program_active: true,
    mode: "threshold" as "threshold" | "percent" | "tier",
    policy_currency: "USD",
    reward_amount: 5,
    threshold_send_amount: 500,
    percent_of_send: 0.005,
    percent_reward_duration_months: 6 as 3 | 6 | 8 | 12,
    percent_tiers: defaultReferralPercentTiers(),
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab")
      if (tab && SETTINGS_TAB_IDS.has(tab)) {
        setActiveTab(tab)
      }
    }
    loadAllData()
  }, [])

  const loadHubServiceLines = useCallback(async () => {
    try {
      const res = await officeFetch("/api/admin/hub/service-lines")
      if (!res.ok) throw new Error("Failed to load hub service lines")
      const j = await res.json()
      setHubServiceLines((j.serviceLines || []) as HubServiceLine[])
    } catch (error) {
      console.error("Error loading hub service lines:", error)
      setHubServiceLines([])
    }
  }, [])

  const loadAdminUsers = useCallback(async () => {
    try {
      const res = await officeFetch("/api/admin/admin-users")
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error("Error loading admin users:", j?.error || res.statusText)
        setAdminUsers([])
        return
      }
      setAdminUsers((j.adminUsers || []) as AdminUserRow[])
    } catch (error) {
      console.error("Error loading admin users:", error)
      setAdminUsers([])
    }
  }, [])

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadSystemSettings(),
        loadCurrencies(),
        loadPaymentMethods(),
        loadHubServiceLines(),
        loadAdminUsers(),
      ])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      try {
        await officeDataStore.refreshAllData()
      } catch (e) {
        console.error("Office data refresh after settings load:", e)
      }
      setInitialSettingsLoadComplete(true)
    }
  }



  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })

      if (error) throw error

      setSystemSettings(data || [])

      // Update platform config from settings
      const settings = data || []
      const newPlatformConfig = { ...platformConfig }
      const newSecuritySettings = { ...securitySettings }

      settings.forEach((setting) => {
        switch (setting.key) {
          case "maintenance_mode":
            newPlatformConfig.maintenanceMode = setting.value === "true"
            break
          case "registration_enabled":
            newPlatformConfig.registrationEnabled = setting.value === "true"
            break
          case "email_verification_required":
            newPlatformConfig.emailVerificationRequired = setting.value === "true"
            break
          case "base_currency":
            newPlatformConfig.baseCurrency = setting.value
            break
          case "session_timeout":
            newSecuritySettings.sessionTimeout = Number.parseInt(setting.value)
            break
          case "password_min_length":
            newSecuritySettings.passwordMinLength = Number.parseInt(setting.value)
            break
          case "max_login_attempts":
            newSecuritySettings.maxLoginAttempts = Number.parseInt(setting.value)
            break
          case "account_lockout_duration":
            newSecuritySettings.accountLockoutDuration = Number.parseInt(setting.value)
            break
          case "referral_program": {
            let raw: unknown = setting.value
            if (typeof raw === "string") {
              try {
                raw = JSON.parse(raw)
              } catch {
                break
              }
            }
            if (raw && typeof raw === "object") {
              const r = raw as Record<string, unknown>
              setReferralProgram({
                program_active: Boolean(r.program_active ?? true),
                mode:
                  r.mode === "tier" ? "tier" : r.mode === "percent" ? "percent" : "threshold",
                policy_currency: typeof r.policy_currency === "string" ? r.policy_currency : "USD",
                reward_amount: Number(r.reward_amount ?? 5),
                threshold_send_amount: Number(r.threshold_send_amount ?? 500),
                percent_of_send: Number(r.percent_of_send ?? 0.005),
                percent_reward_duration_months: (() => {
                  const n = Number(r.percent_reward_duration_months ?? 6)
                  return (REFERRAL_PERCENT_DURATION_OPTIONS as readonly number[]).includes(n)
                    ? (n as 3 | 6 | 8 | 12)
                    : 6
                })(),
                percent_tiers: parseReferralPercentTiers(
                  r.percent_tiers,
                  Number(r.percent_of_send ?? 0.005),
                ),
              })
            }
            break
          }
        }
      })

      setPlatformConfig(newPlatformConfig)
      setSecuritySettings(newSecuritySettings)
      setOriginalSecuritySettings(newSecuritySettings)
    } catch (error) {
      console.error("Error loading system settings:", error)
    }
  }

  const loadCurrencies = async () => {
    try {
      const { data, error } = await supabase.from("currencies").select("*").order("code", { ascending: true })

      if (error) throw error
      setCurrencies(data || [])
    } catch (error) {
      console.error("Error loading currencies:", error)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("currency", { ascending: true })
        .order("is_default", { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error("Error loading payment methods:", error)
    }
  }


  const updateSystemSetting = async (key: string, value: any, dataType = "string") => {
    try {
      const { error } = await supabase.from("system_settings").upsert(
        {
          key,
          value: String(value),
          data_type: dataType,
          category: "platform",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        },
      )

      if (error) throw error
      console.log(`Setting ${key} updated successfully`)
    } catch (error) {
      console.error("Error updating system setting:", error)
      throw error
    }
  }

  const handlePlatformConfigChange = async (key: string, value: any) => {
    try {
      setPlatformConfig({ ...platformConfig, [key]: value })

      const settingKey = key === "baseCurrency" ? "base_currency" : key.replace(/([A-Z])/g, "_$1").toLowerCase()
      await updateSystemSetting(settingKey, value, typeof value === "boolean" ? "boolean" : "string")

      // If base currency changed, refresh data
      if (key === "baseCurrency") {
        // Refresh currencies and payment methods when base currency changes
        await Promise.all([loadCurrencies(), loadPaymentMethods()])
      }
    } catch (error) {
      console.error("Error updating platform config:", error)
      // Revert the change if it failed
      setPlatformConfig(platformConfig)
    }
  }

  const handleSecuritySettingsChange = (key: string, value: number) => {
    setSecuritySettings({ ...securitySettings, [key]: value })
  }

  const handleSaveSecuritySettings = async () => {
    setSaving(true)
    try {
      const updates = [
        { key: "session_timeout", value: securitySettings.sessionTimeout, data_type: "number" },
        { key: "password_min_length", value: securitySettings.passwordMinLength, data_type: "number" },
        { key: "max_login_attempts", value: securitySettings.maxLoginAttempts, data_type: "number" },
        { key: "account_lockout_duration", value: securitySettings.accountLockoutDuration, data_type: "number" },
      ]

      for (const update of updates) {
        await updateSystemSetting(update.key, update.value, update.data_type)
      }

      setOriginalSecuritySettings(securitySettings)
      setIsEditingSecuritySettings(false)
      console.log("Security settings saved successfully")
    } catch (error) {
      console.error("Error saving security settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSecuritySettings = () => {
    setSecuritySettings(originalSecuritySettings)
    setIsEditingSecuritySettings(false)
  }

  const handleSaveReferralProgram = async () => {
    setSaving(true)
    try {
      const policy = referralProgram.policy_currency.trim().toUpperCase() || "USD"
      const normalizedTiers = parseReferralPercentTiers(
        referralProgram.percent_tiers,
        referralProgram.percent_of_send,
      )
      const payload = {
        program_active: referralProgram.program_active,
        mode: referralProgram.mode,
        policy_currency: policy,
        reward_amount: referralProgram.reward_amount,
        threshold_send_amount: referralProgram.threshold_send_amount,
        percent_of_send: referralProgram.percent_of_send,
        percent_reward_duration_months: referralProgram.percent_reward_duration_months,
        percent_tiers: normalizedTiers,
      }
      const { error } = await supabase.from("system_settings").upsert(
        {
          key: "referral_program",
          value: JSON.stringify(payload),
          data_type: "json",
          category: "referrals",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )
      if (error) throw error
      await loadSystemSettings()
    } catch (error) {
      console.error("Error saving referral program:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleQrCodeFileSelect = (file: File, isEditing = false) => {
    const allowedTypes = ["image/svg+xml", "image/png", "image/jpeg"]
    if (!allowedTypes.includes(file.type)) {
      console.error("Only SVG, PNG, and JPEG, files are allowed for QR codes")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error("File size must be less than 5MB")
      return
    }

    if (isEditing) {
      setEditingQrCodeFile(file)
    } else {
      setQrCodeFile(file)
    }
  }

  const uploadQrCodeFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `qr_${Date.now()}.${fileExt}`
    const filePath = `qr-codes/${fileName}`

    const { data, error } = await supabase.storage.from(PAYMENT_QR_CODES_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(PAYMENT_QR_CODES_BUCKET).getPublicUrl(filePath)

    return publicUrl
  }

  const handleAddPaymentMethod = async () => {
    setSaving(true)
    try {
      // If setting as default, unset other defaults for the same currency
      if (newPaymentMethod.is_default) {
        await supabase.from("payment_methods").update({ is_default: false }).eq("currency", newPaymentMethod.currency)
      }

      let qrCodeData = newPaymentMethod.qr_code_data

      // Upload QR code file if provided
      if (newPaymentMethod.type === "qr_code" && qrCodeFile) {
        setUploadingQrCode(true)
        qrCodeData = await uploadQrCodeFile(qrCodeFile)
      }

      const pt = newPaymentMethod.type
      const bankish = pt === "bank_account"
      const mobile = pt === "mobile_money"
      const stable = pt === "stablecoin"
      const qr = pt === "qr_code"

      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          currency: newPaymentMethod.currency,
          type: pt,
          name: newPaymentMethod.name,
          account_name: bankish || mobile ? newPaymentMethod.account_name || null : null,
          account_number: bankish || mobile ? newPaymentMethod.account_number || null : null,
          bank_name: bankish ? newPaymentMethod.bank_name || null : null,
          routing_number: bankish ? newPaymentMethod.routing_number || null : null,
          sort_code: bankish ? newPaymentMethod.sort_code || null : null,
          iban: bankish ? newPaymentMethod.iban || null : null,
          swift_bic: bankish ? newPaymentMethod.swift_bic || null : null,
          qr_code_data: qr ? qrCodeData || null : null,
          crypto_asset: stable ? newPaymentMethod.crypto_asset.trim() || null : null,
          crypto_network: stable ? newPaymentMethod.crypto_network.trim() || null : null,
          wallet_address: stable ? newPaymentMethod.wallet_address.trim() || null : null,
          instructions: newPaymentMethod.instructions || null,
          provider: newPaymentMethod.provider || "manual",
          is_default: newPaymentMethod.is_default,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      setPaymentMethods([...paymentMethods, data])
      setNewPaymentMethod({
        currency: "",
        type: "bank_account",
        name: "",
        account_name: "",
        account_number: "",
        bank_name: "",
        routing_number: "",
        sort_code: "",
        iban: "",
        swift_bic: "",
        qr_code_data: "",
        crypto_asset: "",
        crypto_network: "",
        wallet_address: "",
        instructions: "",
        is_default: false,
        provider: "manual",
      })
      setQrCodeFile(null)
      setIsAddPaymentMethodOpen(false)
      console.log("Payment method added successfully")
    } catch (error) {
      console.error("Error adding payment method:", error)
    } finally {
      setSaving(false)
      setUploadingQrCode(false)
    }
  }

  const handleEditPaymentMethod = async () => {
    if (!editingPaymentMethod) return

    setSaving(true)
    try {
      // If setting as default, unset other defaults for the same currency
      if (editingPaymentMethod.is_default) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("currency", editingPaymentMethod.currency)
          .neq("id", editingPaymentMethod.id)
      }

      let qrCodeData = editingPaymentMethod.qr_code_data

      // Upload new QR code file if provided
      if (editingPaymentMethod.type === "qr_code" && editingQrCodeFile) {
        setUploadingQrCode(true)
        qrCodeData = await uploadQrCodeFile(editingQrCodeFile)
      }

      const ept = editingPaymentMethod.type
      const ebank = ept === "bank_account"
      const emobile = ept === "mobile_money"
      const estable = ept === "stablecoin"
      const eqr = ept === "qr_code"

      const { data, error } = await supabase
        .from("payment_methods")
        .update({
          currency: editingPaymentMethod.currency,
          type: ept,
          name: editingPaymentMethod.name,
          account_name: ebank || emobile ? editingPaymentMethod.account_name || null : null,
          account_number: ebank || emobile ? editingPaymentMethod.account_number || null : null,
          bank_name: ebank ? editingPaymentMethod.bank_name || null : null,
          routing_number: ebank ? editingPaymentMethod.routing_number || null : null,
          sort_code: ebank ? editingPaymentMethod.sort_code || null : null,
          iban: ebank ? editingPaymentMethod.iban || null : null,
          swift_bic: ebank ? editingPaymentMethod.swift_bic || null : null,
          qr_code_data: eqr ? qrCodeData || null : null,
          crypto_asset: estable ? (editingPaymentMethod.crypto_asset || "").trim() || null : null,
          crypto_network: estable ? (editingPaymentMethod.crypto_network || "").trim() || null : null,
          wallet_address: estable ? (editingPaymentMethod.wallet_address || "").trim() || null : null,
          instructions: editingPaymentMethod.instructions || null,
          provider: editingPaymentMethod.provider || "manual",
          is_default: editingPaymentMethod.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPaymentMethod.id)
        .select()
        .single()

      if (error) throw error

      setPaymentMethods(paymentMethods.map((pm) => (pm.id === editingPaymentMethod.id ? data : pm)))
      setEditingPaymentMethod(null)
      setEditingQrCodeFile(null)
      setIsEditPaymentMethodOpen(false)
      console.log("Payment method updated successfully")
    } catch (error) {
      console.error("Error updating payment method:", error)
    } finally {
      setSaving(false)
      setUploadingQrCode(false)
    }
  }

  const handleTogglePaymentMethodStatus = async (id: string) => {
    const method = paymentMethods.find((pm) => pm.id === id)
    if (!method) return

    const newStatus = method.status === "active" ? "inactive" : "active"

    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      setPaymentMethods(paymentMethods.map((pm) => (pm.id === id ? { ...pm, status: newStatus } : pm)))
      console.log("Payment method status updated successfully")
    } catch (error) {
      console.error("Error updating payment method status:", error)
    }
  }

  const handleSetDefaultPaymentMethod = async (id: string) => {
    const targetMethod = paymentMethods.find((pm) => pm.id === id)
    if (!targetMethod) return

    try {
      // Unset other defaults for the same currency
      await supabase.from("payment_methods").update({ is_default: false }).eq("currency", targetMethod.currency)

      // Set this one as default
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      setPaymentMethods(
        paymentMethods.map((pm) => ({
          ...pm,
          is_default: pm.currency === targetMethod.currency ? pm.id === id : pm.is_default,
        })),
      )
      console.log("Default payment method updated successfully")
    } catch (error) {
      console.error("Error setting default payment method:", error)
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id)

      if (error) throw error

      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id))
      console.log("Payment method deleted successfully")
    } catch (error) {
      console.error("Error deleting payment method:", error)
    }
  }


  const handleEditClick = (method: PaymentMethod) => {
    setEditingPaymentMethod({ ...method })
    setIsEditPaymentMethodOpen(true)
  }


  const getPaymentMethodIcon = (type: string) => {
    if (type === "qr_code") return <QrCode className="h-4 w-4" />
    if (type === "stablecoin") return <Coins className="h-4 w-4" />
    if (type === "mobile_money") return <Smartphone className="h-4 w-4" />
    return <Building2 className="h-4 w-4" />
  }

  const getCurrencyFlag = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode)
    return currency?.flag_svg ? <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} /> : null
  }


  return (
    <OfficeDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleSettingsTabChange} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="hubServices">Hub Services</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* Platform Configuration */}
          <TabsContent value="platform">
            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Enable to temporarily disable user access</p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={platformConfig.maintenanceMode}
                      onCheckedChange={(checked) => handlePlatformConfigChange("maintenanceMode", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">Registration Enabled</Label>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <Switch
                      id="registration"
                      checked={platformConfig.registrationEnabled}
                      onCheckedChange={(checked) => handlePlatformConfigChange("registrationEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailVerification">Email Verification Required</Label>
                      <p className="text-sm text-gray-500">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      id="emailVerification"
                      checked={platformConfig.emailVerificationRequired}
                      onCheckedChange={(checked) => handlePlatformConfigChange("emailVerificationRequired", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="baseCurrency">Base Currency for Reporting</Label>
                      <p className="text-sm text-gray-500">
                        Default currency for displaying transaction amounts and reports
                      </p>
                    </div>
                    <Select
                      value={platformConfig.baseCurrency}
                      onValueChange={(value) => handlePlatformConfigChange("baseCurrency", value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select base currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies
                          .filter((c) => c.status === "active")
                          .map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              <div className="flex items-center gap-3">
                                <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} />
                                <div className="font-medium">{currency.code}</div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>


          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Methods</CardTitle>
                  <Dialog open={isAddPaymentMethodOpen} onOpenChange={setIsAddPaymentMethodOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Add New Payment Method</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency *</Label>
                            <Select
                              value={newPaymentMethod.currency}
                              onValueChange={(value) => setNewPaymentMethod({ ...newPaymentMethod, currency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies
                                  .filter((c) => c.status === "active")
                                  .map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                      <div className="flex items-center gap-3">
                                        <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} />
                                        <div className="font-medium">
                                          {currency.code} - {currency.name}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select
                              value={newPaymentMethod.type}
                              onValueChange={(value) => setNewPaymentMethod({ ...newPaymentMethod, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank_account">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Bank Account
                                  </div>
                                </SelectItem>
                                <SelectItem value="qr_code">
                                  <div className="flex items-center gap-2">
                                    <QrCode className="h-4 w-4" />
                                    QR Code
                                  </div>
                                </SelectItem>
                                <SelectItem value="stablecoin">
                                  <div className="flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    Stablecoin
                                  </div>
                                </SelectItem>
                                <SelectItem value="mobile_money">
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    Mobile money
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name *</Label>
                          <Input
                            id="name"
                            value={newPaymentMethod.name}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                            placeholder="e.g., Sberbank Russia, SberPay QR"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="provider">Provider</Label>
                          <Select
                            value={newPaymentMethod.provider || "manual"}
                            onValueChange={(value) =>
                              setNewPaymentMethod({
                                ...newPaymentMethod,
                                provider: value,
                                ...(value === "bitbanker"
                                  ? { type: "qr_code", currency: newPaymentMethod.currency || "RUB" }
                                  : {}),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual (bank / QR instructions)</SelectItem>
                              <SelectItem value="bitbanker">Bitbanker SBP (API, RUB)</SelectItem>
                            </SelectContent>
                          </Select>
                          {newPaymentMethod.provider === "bitbanker" ? (
                            <p className="text-xs text-muted-foreground">
                              No bank fields required. Checkout generates SBP QR via Bitbanker API.
                            </p>
                          ) : null}
                        </div>

                        {newPaymentMethod.type === "bank_account" && (() => {
                          const accountConfig = newPaymentMethod.currency
                            ? getAccountTypeConfigFromCurrency(newPaymentMethod.currency)
                            : null

                          if (!accountConfig) {
                            return (
                              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                Please select a currency first to see the required fields
                              </div>
                            )
                          }

                          return (
                            <>
                              {/* Account Name - Always required */}
                              <div className="space-y-2">
                                <Label htmlFor="accountName">
                                  {accountConfig.fieldLabels.account_name} *
                                </Label>
                                <Input
                                  id="accountName"
                                  value={newPaymentMethod.account_name}
                                  onChange={(e) =>
                                    setNewPaymentMethod({ ...newPaymentMethod, account_name: e.target.value })
                                  }
                                  placeholder={accountConfig.fieldPlaceholders.account_name}
                                />
                              </div>

                              {/* Bank Name - Always required */}
                              <div className="space-y-2">
                                <Label htmlFor="bankName">
                                  {accountConfig.fieldLabels.bank_name} *
                                </Label>
                                <Input
                                  id="bankName"
                                  value={newPaymentMethod.bank_name}
                                  onChange={(e) =>
                                    setNewPaymentMethod({ ...newPaymentMethod, bank_name: e.target.value })
                                  }
                                  placeholder={accountConfig.fieldPlaceholders.bank_name}
                                />
                              </div>

                              {/* US Account Fields */}
                              {accountConfig.accountType === "us" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="routingNumber">
                                      {accountConfig.fieldLabels.routing_number} *
                                    </Label>
                                    <Input
                                      id="routingNumber"
                                      value={newPaymentMethod.routing_number}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                                        setNewPaymentMethod({ ...newPaymentMethod, routing_number: value })
                                      }}
                                      placeholder={accountConfig.fieldPlaceholders.routing_number}
                                      maxLength={9}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="accountNumber">
                                      {accountConfig.fieldLabels.account_number} *
                                    </Label>
                                    <Input
                                      id="accountNumber"
                                      value={newPaymentMethod.account_number}
                                      onChange={(e) =>
                                        setNewPaymentMethod({ ...newPaymentMethod, account_number: e.target.value })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.account_number}
                                    />
                                  </div>
                                </>
                              )}

                              {/* UK Account Fields */}
                              {accountConfig.accountType === "uk" && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="sortCode">
                                        {accountConfig.fieldLabels.sort_code} *
                                      </Label>
                                      <Input
                                        id="sortCode"
                                        value={newPaymentMethod.sort_code}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                                          setNewPaymentMethod({ ...newPaymentMethod, sort_code: value })
                                        }}
                                        placeholder={accountConfig.fieldPlaceholders.sort_code}
                                        maxLength={6}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="accountNumber">
                                        {accountConfig.fieldLabels.account_number} *
                                      </Label>
                                      <Input
                                        id="accountNumber"
                                        value={newPaymentMethod.account_number}
                                        onChange={(e) =>
                                          setNewPaymentMethod({ ...newPaymentMethod, account_number: e.target.value })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.account_number}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="iban">
                                      {accountConfig.fieldLabels.iban} (Optional)
                                    </Label>
                                    <Input
                                      id="iban"
                                      value={newPaymentMethod.iban}
                                      onChange={(e) =>
                                        setNewPaymentMethod({ ...newPaymentMethod, iban: e.target.value.toUpperCase() })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.iban}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="swiftBic">
                                      {accountConfig.fieldLabels.swift_bic} (Optional)
                                    </Label>
                                    <Input
                                      id="swiftBic"
                                      value={newPaymentMethod.swift_bic}
                                      onChange={(e) =>
                                        setNewPaymentMethod({ ...newPaymentMethod, swift_bic: e.target.value.toUpperCase() })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.swift_bic}
                                    />
                                  </div>
                                </>
                              )}

                              {/* EURO Account Fields */}
                              {accountConfig.accountType === "euro" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="iban">
                                      {accountConfig.fieldLabels.iban} *
                                    </Label>
                                    <Input
                                      id="iban"
                                      value={newPaymentMethod.iban}
                                      onChange={(e) =>
                                        setNewPaymentMethod({ ...newPaymentMethod, iban: e.target.value.toUpperCase() })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.iban}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="swiftBic">
                                      {accountConfig.fieldLabels.swift_bic} (Optional)
                                    </Label>
                                    <Input
                                      id="swiftBic"
                                      value={newPaymentMethod.swift_bic}
                                      onChange={(e) =>
                                        setNewPaymentMethod({ ...newPaymentMethod, swift_bic: e.target.value.toUpperCase() })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.swift_bic}
                                    />
                                  </div>
                                </>
                              )}

                              {/* Generic Account Fields */}
                              {accountConfig.accountType === "generic" && (
                                <div className="space-y-2">
                                  <Label htmlFor="accountNumber">
                                    {accountConfig.fieldLabels.account_number} *
                                  </Label>
                                  <Input
                                    id="accountNumber"
                                    value={newPaymentMethod.account_number}
                                    onChange={(e) =>
                                      setNewPaymentMethod({ ...newPaymentMethod, account_number: e.target.value })
                                    }
                                    placeholder={accountConfig.fieldPlaceholders.account_number}
                                  />
                                </div>
                              )}
                            </>
                          )
                        })()}

                        {newPaymentMethod.type === "qr_code" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="qrCodeFile">Upload QR Code *</Label>
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleQrCodeFileSelect(file)
                                }}
                                accept=".svg,.png,.jpg,.jpeg,.pdf"
                                className="hidden"
                              />
                              <div className="flex items-center gap-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  {qrCodeFile ? "Change File" : "Select File"}
                                </Button>
                                {qrCodeFile && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{qrCodeFile.name}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setQrCodeFile(null)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">Supported formats: SVG, PNG, JPEG (Max 5MB)</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instructions">Instructions</Label>
                              <Textarea
                                id="instructions"
                                value={newPaymentMethod.instructions}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, instructions: e.target.value })
                                }
                                placeholder="Instructions for users on how to use this QR code"
                                rows={3}
                              />
                            </div>
                          </>
                        )}

                        {newPaymentMethod.type === "stablecoin" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="cryptoAsset">Asset *</Label>
                              <Input
                                id="cryptoAsset"
                                value={newPaymentMethod.crypto_asset}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, crypto_asset: e.target.value })
                                }
                                placeholder="e.g. USDC"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cryptoNetwork">Network *</Label>
                              <Input
                                id="cryptoNetwork"
                                value={newPaymentMethod.crypto_network}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, crypto_network: e.target.value })
                                }
                                placeholder="e.g. Solana, Ethereum"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="walletAddress">Wallet address *</Label>
                              <Input
                                id="walletAddress"
                                value={newPaymentMethod.wallet_address}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, wallet_address: e.target.value })
                                }
                                placeholder="Deposit address"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instructionsStable">Instructions</Label>
                              <Textarea
                                id="instructionsStable"
                                value={newPaymentMethod.instructions}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, instructions: e.target.value })
                                }
                                placeholder="Optional notes for users (e.g. confirm network before sending)"
                                rows={3}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              The app shows a QR code encoding this address so users can scan with a wallet.
                            </p>
                          </>
                        )}

                        {newPaymentMethod.type === "mobile_money" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="mobileMoneyName">Name *</Label>
                              <Input
                                id="mobileMoneyName"
                                value={newPaymentMethod.account_name}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, account_name: e.target.value })
                                }
                                placeholder="Account or business name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mobileMoneyPhone">Phone number *</Label>
                              <Input
                                id="mobileMoneyPhone"
                                type="tel"
                                value={newPaymentMethod.account_number}
                                onChange={(e) =>
                                  setNewPaymentMethod({
                                    ...newPaymentMethod,
                                    account_number: e.target.value.replace(/\s/g, ""),
                                  })
                                }
                                placeholder="e.g. +234…"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instructionsMobile">Instructions</Label>
                              <Textarea
                                id="instructionsMobile"
                                value={newPaymentMethod.instructions}
                                onChange={(e) =>
                                  setNewPaymentMethod({ ...newPaymentMethod, instructions: e.target.value })
                                }
                                placeholder="Optional instructions for paying via mobile money"
                                rows={3}
                              />
                            </div>
                          </>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isDefault"
                            checked={newPaymentMethod.is_default}
                            onCheckedChange={(checked) =>
                              setNewPaymentMethod({ ...newPaymentMethod, is_default: checked as boolean })
                            }
                          />
                          <Label htmlFor="isDefault" className="text-sm font-medium">
                            Set as default payment method for this currency
                          </Label>
                        </div>

                      </div>
                      <div className="flex gap-4 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => setIsAddPaymentMethodOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddPaymentMethod}
                          disabled={(() => {
                            if (saving || uploadingQrCode || !newPaymentMethod.currency || !newPaymentMethod.name) {
                              return true
                            }

                            if (newPaymentMethod.type === "qr_code") {
                              return !qrCodeFile && !newPaymentMethod.qr_code_data
                            }

                            if (newPaymentMethod.type === "bank_account") {
                              const accountConfig = getAccountTypeConfigFromCurrency(newPaymentMethod.currency)
                              const requiredFields = accountConfig.requiredFields

                              for (const field of requiredFields) {
                                const fieldValue = newPaymentMethod[field as keyof typeof newPaymentMethod]
                                if (!fieldValue || (typeof fieldValue === "string" && !fieldValue.trim())) {
                                  return true
                                }
                              }
                            }

                            if (newPaymentMethod.type === "stablecoin") {
                              if (
                                !newPaymentMethod.crypto_asset?.trim() ||
                                !newPaymentMethod.crypto_network?.trim() ||
                                !newPaymentMethod.wallet_address?.trim()
                              ) {
                                return true
                              }
                            }

                            if (newPaymentMethod.type === "mobile_money") {
                              if (
                                !newPaymentMethod.account_name?.trim() ||
                                !newPaymentMethod.account_number?.trim()
                              ) {
                                return true
                              }
                            }

                            return false
                          })()}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          {saving ? "Adding..." : "Add Payment Method"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Payment Method Dialog */}
                  <Dialog open={isEditPaymentMethodOpen} onOpenChange={setIsEditPaymentMethodOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Edit Payment Method</DialogTitle>
                      </DialogHeader>
                      {editingPaymentMethod && (
                        <>
                          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="editCurrency">Currency *</Label>
                              <Select
                                value={editingPaymentMethod.currency}
                                onValueChange={(value) =>
                                  setEditingPaymentMethod({ ...editingPaymentMethod, currency: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies
                                    .filter((c) => c.status === "active")
                                    .map((currency) => (
                                      <SelectItem key={currency.code} value={currency.code}>
                                        <div className="flex items-center gap-3">
                                          <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} />
                                          <div className="font-medium">
                                            {currency.code} - {currency.name}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editType">Type *</Label>
                              <Select
                                value={editingPaymentMethod.type}
                                onValueChange={(value) =>
                                  setEditingPaymentMethod({ ...editingPaymentMethod, type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bank_account">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Bank Account
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="qr_code">
                                    <div className="flex items-center gap-2">
                                      <QrCode className="h-4 w-4" />
                                      QR Code
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="stablecoin">
                                    <div className="flex items-center gap-2">
                                      <Coins className="h-4 w-4" />
                                      Stablecoin
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="mobile_money">
                                    <div className="flex items-center gap-2">
                                      <Smartphone className="h-4 w-4" />
                                      Mobile money
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="editName">Display Name *</Label>
                            <Input
                              id="editName"
                              value={editingPaymentMethod.name}
                              onChange={(e) =>
                                setEditingPaymentMethod({ ...editingPaymentMethod, name: e.target.value })
                              }
                              placeholder="e.g., Sberbank Russia, SberPay QR"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="editProvider">Provider</Label>
                            <Select
                              value={editingPaymentMethod.provider || "manual"}
                              onValueChange={(value) =>
                                setEditingPaymentMethod({ ...editingPaymentMethod, provider: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="bitbanker">Bitbanker SBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {editingPaymentMethod.type === "bank_account" && (() => {
                            const accountConfig = editingPaymentMethod.currency
                              ? getAccountTypeConfigFromCurrency(editingPaymentMethod.currency)
                              : null

                            if (!accountConfig) {
                              return (
                                <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                  Please select a currency first to see the required fields
                                </div>
                              )
                            }

                            return (
                              <>
                                {/* Account Name - Always required */}
                                <div className="space-y-2">
                                  <Label htmlFor="editAccountName">
                                    {accountConfig.fieldLabels.account_name} *
                                  </Label>
                                  <Input
                                    id="editAccountName"
                                    value={editingPaymentMethod.account_name || ""}
                                    onChange={(e) =>
                                      setEditingPaymentMethod({ ...editingPaymentMethod, account_name: e.target.value })
                                    }
                                    placeholder={accountConfig.fieldPlaceholders.account_name}
                                  />
                                </div>

                                {/* Bank Name - Always required */}
                                <div className="space-y-2">
                                  <Label htmlFor="editBankName">
                                    {accountConfig.fieldLabels.bank_name} *
                                  </Label>
                                  <Input
                                    id="editBankName"
                                    value={editingPaymentMethod.bank_name || ""}
                                    onChange={(e) =>
                                      setEditingPaymentMethod({ ...editingPaymentMethod, bank_name: e.target.value })
                                    }
                                    placeholder={accountConfig.fieldPlaceholders.bank_name}
                                  />
                                </div>

                                {/* US Account Fields */}
                                {accountConfig.accountType === "us" && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="editRoutingNumber">
                                        {accountConfig.fieldLabels.routing_number} *
                                      </Label>
                                      <Input
                                        id="editRoutingNumber"
                                        value={editingPaymentMethod.routing_number || ""}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                                          setEditingPaymentMethod({ ...editingPaymentMethod, routing_number: value })
                                        }}
                                        placeholder={accountConfig.fieldPlaceholders.routing_number}
                                        maxLength={9}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editAccountNumber">
                                        {accountConfig.fieldLabels.account_number} *
                                      </Label>
                                      <Input
                                        id="editAccountNumber"
                                        value={editingPaymentMethod.account_number || ""}
                                        onChange={(e) =>
                                          setEditingPaymentMethod({
                                            ...editingPaymentMethod,
                                            account_number: e.target.value,
                                          })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.account_number}
                                      />
                                    </div>
                                  </>
                                )}

                                {/* UK Account Fields */}
                                {accountConfig.accountType === "uk" && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="editSortCode">
                                          {accountConfig.fieldLabels.sort_code} *
                                        </Label>
                                        <Input
                                          id="editSortCode"
                                          value={editingPaymentMethod.sort_code || ""}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                                            setEditingPaymentMethod({ ...editingPaymentMethod, sort_code: value })
                                          }}
                                          placeholder={accountConfig.fieldPlaceholders.sort_code}
                                          maxLength={6}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="editAccountNumber">
                                          {accountConfig.fieldLabels.account_number} *
                                        </Label>
                                        <Input
                                          id="editAccountNumber"
                                          value={editingPaymentMethod.account_number || ""}
                                          onChange={(e) =>
                                            setEditingPaymentMethod({
                                              ...editingPaymentMethod,
                                              account_number: e.target.value,
                                            })
                                          }
                                          placeholder={accountConfig.fieldPlaceholders.account_number}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editIban">
                                        {accountConfig.fieldLabels.iban} (Optional)
                                      </Label>
                                      <Input
                                        id="editIban"
                                        value={editingPaymentMethod.iban || ""}
                                        onChange={(e) =>
                                          setEditingPaymentMethod({
                                            ...editingPaymentMethod,
                                            iban: e.target.value.toUpperCase(),
                                          })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.iban}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editSwiftBic">
                                        {accountConfig.fieldLabels.swift_bic} (Optional)
                                      </Label>
                                      <Input
                                        id="editSwiftBic"
                                        value={editingPaymentMethod.swift_bic || ""}
                                        onChange={(e) =>
                                          setEditingPaymentMethod({
                                            ...editingPaymentMethod,
                                            swift_bic: e.target.value.toUpperCase(),
                                          })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.swift_bic}
                                      />
                                    </div>
                                  </>
                                )}

                                {/* EURO Account Fields */}
                                {accountConfig.accountType === "euro" && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="editIban">
                                        {accountConfig.fieldLabels.iban} *
                                      </Label>
                                      <Input
                                        id="editIban"
                                        value={editingPaymentMethod.iban || ""}
                                        onChange={(e) =>
                                          setEditingPaymentMethod({
                                            ...editingPaymentMethod,
                                            iban: e.target.value.toUpperCase(),
                                          })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.iban}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editSwiftBic">
                                        {accountConfig.fieldLabels.swift_bic} (Optional)
                                      </Label>
                                      <Input
                                        id="editSwiftBic"
                                        value={editingPaymentMethod.swift_bic || ""}
                                        onChange={(e) =>
                                          setEditingPaymentMethod({
                                            ...editingPaymentMethod,
                                            swift_bic: e.target.value.toUpperCase(),
                                          })
                                        }
                                        placeholder={accountConfig.fieldPlaceholders.swift_bic}
                                      />
                                    </div>
                                  </>
                                )}

                                {/* Generic Account Fields */}
                                {accountConfig.accountType === "generic" && (
                                  <div className="space-y-2">
                                    <Label htmlFor="editAccountNumber">
                                      {accountConfig.fieldLabels.account_number} *
                                    </Label>
                                    <Input
                                      id="editAccountNumber"
                                      value={editingPaymentMethod.account_number || ""}
                                      onChange={(e) =>
                                        setEditingPaymentMethod({
                                          ...editingPaymentMethod,
                                          account_number: e.target.value,
                                        })
                                      }
                                      placeholder={accountConfig.fieldPlaceholders.account_number}
                                    />
                                  </div>
                                )}
                              </>
                            )
                          })()}

                          {editingPaymentMethod.type === "qr_code" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="editQrCodeFile">Upload QR Code *</Label>
                                <input
                                  type="file"
                                  ref={editFileInputRef}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleQrCodeFileSelect(file, true)
                                  }}
                                  accept=".svg,.png,.jpg,.jpeg,.pdf"
                                  className="hidden"
                                />
                                <div className="flex items-center gap-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => editFileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    {editingQrCodeFile
                                      ? "Change File"
                                      : editingPaymentMethod.qr_code_data
                                        ? "Replace File"
                                        : "Select File"}
                                  </Button>
                                  {editingQrCodeFile && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <span>{editingQrCodeFile.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingQrCodeFile(null)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                  {!editingQrCodeFile && editingPaymentMethod.qr_code_data && (
                                    <span className="text-sm text-gray-600">Current file uploaded</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  Supported formats: SVG, PNG, JPEG (Max 5MB)
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editInstructions">Instructions</Label>
                                <Textarea
                                  id="editInstructions"
                                  value={editingPaymentMethod.instructions || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({ ...editingPaymentMethod, instructions: e.target.value })
                                  }
                                  placeholder="Instructions for users on how to use this QR code"
                                  rows={3}
                                />
                              </div>
                            </>
                          )}

                          {editingPaymentMethod.type === "stablecoin" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="editCryptoAsset">Asset *</Label>
                                <Input
                                  id="editCryptoAsset"
                                  value={editingPaymentMethod.crypto_asset || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      crypto_asset: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. USDC"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editCryptoNetwork">Network *</Label>
                                <Input
                                  id="editCryptoNetwork"
                                  value={editingPaymentMethod.crypto_network || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      crypto_network: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Solana, Ethereum"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editWalletAddress">Wallet address *</Label>
                                <Input
                                  id="editWalletAddress"
                                  value={editingPaymentMethod.wallet_address || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      wallet_address: e.target.value,
                                    })
                                  }
                                  placeholder="Deposit address"
                                  className="font-mono text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editInstructionsStable">Instructions</Label>
                                <Textarea
                                  id="editInstructionsStable"
                                  value={editingPaymentMethod.instructions || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Optional notes for users"
                                  rows={3}
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                The app shows a QR code encoding this address so users can scan with a wallet.
                              </p>
                            </>
                          )}

                          {editingPaymentMethod.type === "mobile_money" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="editMobileMoneyName">Name *</Label>
                                <Input
                                  id="editMobileMoneyName"
                                  value={editingPaymentMethod.account_name || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      account_name: e.target.value,
                                    })
                                  }
                                  placeholder="Account or business name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editMobileMoneyPhone">Phone number *</Label>
                                <Input
                                  id="editMobileMoneyPhone"
                                  type="tel"
                                  value={editingPaymentMethod.account_number || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      account_number: e.target.value.replace(/\s/g, ""),
                                    })
                                  }
                                  placeholder="e.g. +234…"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editInstructionsMobile">Instructions</Label>
                                <Textarea
                                  id="editInstructionsMobile"
                                  value={editingPaymentMethod.instructions || ""}
                                  onChange={(e) =>
                                    setEditingPaymentMethod({
                                      ...editingPaymentMethod,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Optional instructions for mobile money"
                                  rows={3}
                                />
                              </div>
                            </>
                          )}

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editIsDefault"
                              checked={editingPaymentMethod.is_default}
                              onCheckedChange={(checked) =>
                                setEditingPaymentMethod({ ...editingPaymentMethod, is_default: checked as boolean })
                              }
                            />
                            <Label htmlFor="editIsDefault" className="text-sm font-medium">
                              Set as default payment method for this currency
                            </Label>
                          </div>

                          </div>
                          <div className="flex gap-4 pt-4 border-t mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setIsEditPaymentMethodOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleEditPaymentMethod}
                              disabled={(() => {
                                if (
                                  saving ||
                                  uploadingQrCode ||
                                  !editingPaymentMethod.currency ||
                                  !editingPaymentMethod.name
                                ) {
                                  return true
                                }

                                if (editingPaymentMethod.type === "qr_code") {
                                  return !editingQrCodeFile && !editingPaymentMethod.qr_code_data
                                }

                                if (editingPaymentMethod.type === "bank_account") {
                                  const accountConfig = getAccountTypeConfigFromCurrency(
                                    editingPaymentMethod.currency
                                  )
                                  const requiredFields = accountConfig.requiredFields

                                  for (const field of requiredFields) {
                                    const fieldValue = editingPaymentMethod[field as keyof typeof editingPaymentMethod]
                                    if (!fieldValue || (typeof fieldValue === "string" && !fieldValue.trim())) {
                                      return true
                                    }
                                  }
                                }

                                if (editingPaymentMethod.type === "stablecoin") {
                                  if (
                                    !(editingPaymentMethod.crypto_asset || "").trim() ||
                                    !(editingPaymentMethod.crypto_network || "").trim() ||
                                    !(editingPaymentMethod.wallet_address || "").trim()
                                  ) {
                                    return true
                                  }
                                }

                                if (editingPaymentMethod.type === "mobile_money") {
                                  if (
                                    !(editingPaymentMethod.account_name || "").trim() ||
                                    !(editingPaymentMethod.account_number || "").trim()
                                  ) {
                                    return true
                                  }
                                }

                                return false
                              })()}
                              className="flex-1 bg-primary hover:bg-primary/90"
                            >
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCurrencyFlag(method.currency)}
                            <span className="font-medium">{method.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.type)}
                            <span className="capitalize">{method.type.replace(/_/g, " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell className="capitalize text-sm text-gray-600">
                          {method.provider || "manual"}
                        </TableCell>
                        <TableCell>
                          {method.provider === "bitbanker" ? (
                            <div className="text-sm text-gray-600">SBP via Bitbanker API</div>
                          ) : method.type === "bank_account" ? (() => {
                            const accountConfig = getAccountTypeConfigFromCurrency(method.currency)
                            const accountType = accountConfig.accountType

                            return (
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>{method.account_name}</div>
                                {accountType === "us" && method.routing_number && (
                                  <div className="font-mono text-xs">
                                    Routing: {formatFieldValue(accountType, "routing_number", method.routing_number)}
                                  </div>
                                )}
                                {accountType === "uk" && method.sort_code && (
                                  <div className="font-mono text-xs">
                                    Sort Code: {formatFieldValue(accountType, "sort_code", method.sort_code)}
                                  </div>
                                )}
                                {method.account_number && (
                                  <div className="font-mono text-xs">
                                    {accountConfig.fieldLabels.account_number}: {method.account_number}
                                  </div>
                                )}
                                {method.iban && (
                                  <div className="font-mono text-xs">
                                    IBAN: {formatFieldValue(accountType, "iban", method.iban)}
                                  </div>
                                )}
                                {method.swift_bic && (
                                  <div className="font-mono text-xs">SWIFT/BIC: {method.swift_bic}</div>
                                )}
                                <div>{method.bank_name}</div>
                              </div>
                            )
                          })() : method.type === "qr_code" ? (
                            <div className="text-sm text-gray-600">
                              <div className="font-mono text-xs">{method.qr_code_data}</div>
                              {method.instructions && (
                                <div className="mt-1 text-xs">{method.instructions.substring(0, 50)}...</div>
                              )}
                            </div>
                          ) : method.type === "stablecoin" ? (
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                {method.crypto_asset} · {method.crypto_network}
                              </div>
                              {method.wallet_address && (
                                <div className="font-mono text-xs break-all">{method.wallet_address}</div>
                              )}
                            </div>
                          ) : method.type === "mobile_money" ? (
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>{method.account_name}</div>
                              <div className="font-mono text-xs">{method.account_number}</div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">—</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              method.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {method.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {method.is_default && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(method)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePaymentMethodStatus(method.id)}>
                                {method.status === "active" ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              {method.status === "active" && !method.is_default && (
                                <DropdownMenuItem onClick={() => handleSetDefaultPaymentMethod(method.id)}>
                                  Make Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeletePaymentMethod(method.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payment methods configured yet</p>
                    <p className="text-sm">Add payment methods to enable user transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Security Settings</CardTitle>
                  {!isEditingSecuritySettings && (
                    <Button
                      onClick={() => setIsEditingSecuritySettings(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleSecuritySettingsChange("sessionTimeout", Number(e.target.value))}
                      disabled={!isEditingSecuritySettings}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordLength">Password Min Length</Label>
                    <Input
                      id="passwordLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => handleSecuritySettingsChange("passwordMinLength", Number(e.target.value))}
                      disabled={!isEditingSecuritySettings}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => handleSecuritySettingsChange("maxLoginAttempts", Number(e.target.value))}
                      disabled={!isEditingSecuritySettings}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Account Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={securitySettings.accountLockoutDuration}
                      onChange={(e) => handleSecuritySettingsChange("accountLockoutDuration", Number(e.target.value))}
                      disabled={!isEditingSecuritySettings}
                    />
                  </div>
                </div>

                {isEditingSecuritySettings && (
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelSecuritySettings}
                      className="flex-1 bg-transparent"
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveSecuritySettings}
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Security Settings"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral program</CardTitle>
              </CardHeader>
              <TooltipProvider delayDuration={200}>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="referral-active">Program active</Label>
                      <p className="text-sm text-gray-500">When off, no new referral rewards are granted.</p>
                    </div>
                    <Switch
                      id="referral-active"
                    checked={referralProgram.program_active}
                    onCheckedChange={(checked) => setReferralProgram((p) => ({ ...p, program_active: checked }))}
                  />
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Policy currency</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={REFERRAL_HELP_POLICY_CURRENCY}
                            >
                              <Info className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {REFERRAL_HELP_POLICY_CURRENCY}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={referralProgram.policy_currency}
                      onValueChange={(value) => setReferralProgram((p) => ({ ...p, policy_currency: value }))}
                    >
                      <SelectTrigger className="w-full md:max-w-md">
                        <SelectValue placeholder="Select policy currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {referralProgram.policy_currency &&
                          !currencies.some(
                            (c) => c.code === referralProgram.policy_currency && c.status === "active",
                          ) && (
                            <SelectItem value={referralProgram.policy_currency}>
                              {referralProgram.policy_currency} (not in active list)
                            </SelectItem>
                          )}
                        {currencies
                          .filter((c) => c.status === "active")
                          .map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              <div className="flex items-center gap-3">
                                <div dangerouslySetInnerHTML={{ __html: currency.flag_svg }} />
                                <div className="font-medium">{currency.code}</div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reward mode</Label>
                    <Select
                      value={referralProgram.mode}
                      onValueChange={(v) =>
                        setReferralProgram((p) => ({
                          ...p,
                          mode: v === "tier" ? "tier" : v === "percent" ? "percent" : "threshold",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full md:max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="threshold">
                          Threshold — one-time reward when cumulative sends cross a total
                        </SelectItem>
                        <SelectItem value="percent">
                          Percent — flat rate on each completed send (within per-referral window)
                        </SelectItem>
                        <SelectItem value="tier">
                          Tier — commission rate by qualified referees in the current calendar quarter
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {referralProgram.mode === "threshold" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total send threshold ({referralProgram.policy_currency})</Label>
                      <p className="text-xs text-gray-500">
                        When a referee&apos;s lifetime completed send volume (in policy currency) reaches this amount,
                        the referrer gets the reward once.
                      </p>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={referralProgram.threshold_send_amount}
                        onChange={(e) =>
                          setReferralProgram((p) => ({ ...p, threshold_send_amount: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward amount ({referralProgram.policy_currency})</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={referralProgram.reward_amount}
                        onChange={(e) =>
                          setReferralProgram((p) => ({ ...p, reward_amount: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                ) : referralProgram.mode === "percent" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Percent of each completed send</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={REFERRAL_HELP_PERCENT_OF_SEND}
                            >
                              <Info className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {REFERRAL_HELP_PERCENT_OF_SEND}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={referralProgram.percent_of_send * 100}
                        onChange={(e) =>
                          setReferralProgram((p) => ({
                            ...p,
                            percent_of_send: Number(e.target.value) / 100,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Duration</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={REFERRAL_HELP_DURATION}
                            >
                              <Info className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {REFERRAL_HELP_DURATION}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={String(referralProgram.percent_reward_duration_months)}
                        onValueChange={(v) =>
                          setReferralProgram((p) => ({
                            ...p,
                            percent_reward_duration_months: Number(v) as 3 | 6 | 8 | 12,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full md:max-w-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REFERRAL_PERCENT_DURATION_OPTIONS.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {m} months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Label>Commission tiers</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={REFERRAL_HELP_COMMISSION_TIERS}
                            >
                              <Info className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {REFERRAL_HELP_COMMISSION_TIERS}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {referralProgram.percent_tiers.map((row, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-2">
                          <div className="space-y-1 flex-1 min-w-[8rem]">
                            <Label className="text-xs">Qualified referees up to (this quarter)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={row.min_qualified_referees_in_quarter}
                              onChange={(e) =>
                                setReferralProgram((p) => {
                                  const next = [...p.percent_tiers]
                                  next[i] = {
                                    ...next[i],
                                    min_qualified_referees_in_quarter: Math.max(
                                      1,
                                      Math.floor(Number(e.target.value) || 0),
                                    ),
                                  }
                                  return { ...p, percent_tiers: next }
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1 flex-1 min-w-[8rem]">
                            <Label className="text-xs">Percent (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.percent_of_send * 100}
                              onChange={(e) =>
                                setReferralProgram((p) => {
                                  const next = [...p.percent_tiers]
                                  next[i] = {
                                    ...next[i],
                                    percent_of_send: Number(e.target.value) / 100,
                                  }
                                  return { ...p, percent_tiers: next }
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            disabled={referralProgram.percent_tiers.length <= 1}
                            onClick={() =>
                              setReferralProgram((p) => ({
                                ...p,
                                percent_tiers: p.percent_tiers.filter((_, j) => j !== i),
                              }))
                            }
                            aria-label="Remove tier"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReferralProgram((p) => ({
                            ...p,
                            percent_tiers: [
                              ...p.percent_tiers,
                              {
                                min_qualified_referees_in_quarter:
                                  (p.percent_tiers[p.percent_tiers.length - 1]
                                    ?.min_qualified_referees_in_quarter ?? 0) + 5,
                                percent_of_send: 0.005,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add tier
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Duration</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={REFERRAL_HELP_DURATION}
                            >
                              <Info className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {REFERRAL_HELP_DURATION}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={String(referralProgram.percent_reward_duration_months)}
                        onValueChange={(v) =>
                          setReferralProgram((p) => ({
                            ...p,
                            percent_reward_duration_months: Number(v) as 3 | 6 | 8 | 12,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full md:max-w-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REFERRAL_PERCENT_DURATION_OPTIONS.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {m} months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveReferralProgram}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save referral program"}
                </Button>
              </CardContent>
              </TooltipProvider>
            </Card>
          </TabsContent>

          <TabsContent value="hubServices">
            <HubServiceLinesManager
              lines={hubServiceLines}
              onReload={loadHubServiceLines}
              settingsBootComplete={initialSettingsLoadComplete}
            />
          </TabsContent>

          <TabsContent value="rates">
            <OfficeRatesPanel settingsBootComplete={initialSettingsLoadComplete} />
          </TabsContent>

          <TabsContent value="admin">
            <OfficeAdminUsersPanel
              settingsBootComplete={initialSettingsLoadComplete}
              adminUsers={adminUsers}
              onReloadAdminUsers={loadAdminUsers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </OfficeDashboardLayout>
  )
}
