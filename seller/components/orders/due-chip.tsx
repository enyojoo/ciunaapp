"use client"
import * as React from "react"
import { DueTimer, type DueTimerLabels } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"

/** Seller wrapper over the shared DueTimer: localised words, running, warning under 5 minutes, overdue. 28px on cards, 36px (`md`) in the detail header. */
export function DueChip({ dueAt, size = "sm", className }: { dueAt: string | null; size?: "sm" | "md"; className?: string }) {
  const { t } = useT()
  const labels = React.useMemo<DueTimerLabels>(() => ({
    dueIn: (time) => t("orders.due.in", { time }),
    overdue: (time) => t("orders.due.overdue", { time }),
    span: (h, m) => (h > 0 ? t("orders.duration.hm", { h, m }) : t("orders.duration.m", { m })),
  }), [t])
  return <DueTimer dueAt={dueAt} size={size} labels={labels} className={className} />
}
