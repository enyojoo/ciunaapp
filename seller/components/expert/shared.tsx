"use client"
import * as React from "react"
import Link from "next/link"
import { Briefcase } from "lucide-react"
import { Button, EmptyState, Skeleton, cn } from "@ciuna/ui-web"
import { ApiError, api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"

export interface ExpertService {
  id: string
  title: string
  short_description: string | null
  pricing_type: "hourly" | "fixed" | "quote"
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  default_duration_minutes: number | null
  min_session_minutes: number | null
  max_session_minutes: number | null
  fulfillment_type: "online" | "in_person" | "both"
  meeting_instructions: string | null
  booking_lead_minutes: number
  payment_cutoff_minutes: number
  timezone: string
  translations: Record<string, { title?: string; short_description?: string }> | null
  is_published: boolean
  review_status?: string | null
  upcoming_slots?: number
}

export interface Slot { id: string; expert_service_id: string; slot_start: string; slot_end: string; status: "available" | "booked" | "blocked"; source: string }

export interface Booking {
  id: string
  publicId: string
  status: "new" | "accepted" | "preparing" | "completed" | "cancelled"
  paymentState: string
  slot: { start: string; end: string; timezone: string | null } | null
  customerName: string | null
  serviceTitle: string | null
  totals: { currency: string; subtotal: number } | null
  actions: string[]
  exception: string | null
  dueAt: string | null
  overdue: boolean
}

export const SERVICES_KEY = "expert/services"
export const useServices = () => useQuery<{ services: ExpertService[] }>(SERVICES_KEY, () => api("/api/merchant/expert/services"))

/** Maps a thrown error to text. SERVICE_INVALID prefers the server's own message; counts and limits are interpolated. */
export function useExpertError() {
  const { t } = useT()
  return (e: unknown): string => {
    const code = e instanceof ApiError ? e.code : undefined
    const details = e instanceof ApiError ? e.details : undefined
    if (code === "SERVICE_INVALID" && details?.message) return String(details.message)
    const key = `errors.${code}`
    const msg = t(key, { count: details?.count ?? 0, maxDays: details?.maxDays ?? 120 })
    return code && msg !== key ? msg : t("errors.generic")
  }
}

export function Chip({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "warning"; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tone === "warning" ? "bg-warning-surface text-warning-text" : "bg-neutral-surface text-neutral-text", className)}>{children}</span>
}

/** Only expert merchants see these pages. */
export function ExpertOnly({ children }: { children: React.ReactNode }) {
  const { t } = useT()
  const { ready, merchant } = useSeller()
  if (!ready || !merchant) return <div className="space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-32" /></div>
  if (merchant.type !== "expert") {
    return <EmptyState icon={<Briefcase />} title={t("expert.only.title")} description={t("expert.only.body")} action={<Button asChild variant="secondary"><Link href="/">{t("expert.only.home")}</Link></Button>} />
  }
  return <>{children}</>
}

export const CURRENCIES = ["RUB", "USD", "EUR", "CNY", "GBP", "BRL", "AED", "KZT", "TRY"]
export const FULFILLMENT_KEYS = { online: "expert.delivery.online", in_person: "expert.delivery.in_person", both: "expert.delivery.both" } as const

/** BCP-47 locale for Intl from the app locale. */
export const intlLocale = (l: string) => (l === "zh" ? "zh-CN" : l === "pt" ? "pt-BR" : l)
