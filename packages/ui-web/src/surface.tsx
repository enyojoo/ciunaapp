import * as React from "react"
import { cn } from "./cn"

export function Card({ className, selected, ...props }: React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }) {
  return <div className={cn("rounded-2xl border bg-white", selected ? "border-primary-border bg-primary-tint" : "border-hairline", className)} {...props} />
}
export function CardHeader({ title, action, description, className }: { title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-hairline px-4 py-3.5 sm:px-5", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-neutral-surface", className)} />
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-tint text-primary-text [&_svg]:size-6">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function PageHeader({ title, description, action, back }: { title: string; description?: string; action?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <header className="mb-5 sm:mb-6">
      {back ? <div className="mb-2">{back}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-[15px] text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}

export function Banner({ tone = "neutral", title, children, action }: { tone?: "neutral" | "warning" | "destructive" | "success"; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const cls = { neutral: "bg-neutral-surface text-neutral-text", warning: "bg-warning-surface text-warning-text", destructive: "bg-destructive-surface text-destructive-text", success: "bg-success-surface text-success-text" }[tone]
  return (
    <div role={tone === "destructive" ? "alert" : "status"} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5", cls)}>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {children ? <div className="mt-0.5 text-sm opacity-90">{children}</div> : null}
      </div>
      {action}
    </div>
  )
}
