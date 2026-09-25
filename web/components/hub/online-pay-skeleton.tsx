"use client"

import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

/** Stable pay frame while the YooKassa attempt / widget boots. */
export function OnlinePaySkeleton({
  caption,
  className,
}: {
  caption?: string
  className?: string
}) {
  const { t } = useTranslation("app")
  const label =
    caption ||
    t("hub.pay.loading", { defaultValue: "Loading secure payment…" })

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-7 text-center",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
