import { formatMoneyDisplay } from "@ciuna/shared"
import { cn } from "./cn"

/** The only way money is rendered. Cents are smaller at display sizes. */
export function Amount({ value, currency, size = "body", breakdown, signed, className }: { value: number | string | null | undefined; currency: string | null | undefined; size?: "body" | "large" | "display"; breakdown?: boolean; signed?: boolean; className?: string }) {
  const text = formatMoneyDisplay(value, currency, { breakdown, signed })
  const dot = text.lastIndexOf(".")
  const sizeCls = { body: "text-[15px]", large: "text-xl font-semibold", display: "text-3xl font-bold" }[size]
  if (size === "body" || dot < 0) return <span className={cn("tabular-nums", sizeCls, className)}>{text}</span>
  return (
    <span className={cn("tabular-nums", sizeCls, className)}>
      {text.slice(0, dot)}
      <span className={size === "display" ? "text-[0.6em]" : "text-[0.8em]"}>{text.slice(dot)}</span>
    </span>
  )
}
