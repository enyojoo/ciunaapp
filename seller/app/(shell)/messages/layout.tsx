"use client"
import * as React from "react"
import { usePathname } from "next/navigation"
import { PageHeader, cn } from "@ciuna/ui-web"
import { RequirePermission } from "@/components/no-access"
import { ThreadList } from "@/components/messages/thread-list"
import { useT } from "@/lib/i18n"

/** One route tree, two presentations. Phones: the list page, then a thread page. From 1024px: list on the left, the open thread on the right, same URLs so alert links still land on the right thread. */
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useT()
  const pathname = usePathname()
  const match = pathname.match(/^\/messages\/([^/]+)/)
  const selected = match ? decodeURIComponent(match[1]) : null
  return (
    <RequirePermission permission="messages" titleKey="messages.noAccess.title" bodyKey="messages.noAccess.body">
      <div className={cn(selected && "max-lg:hidden")}>
        <PageHeader title={t("messages.title")} description={t("messages.subtitle")} />
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside aria-label={t("messages.title")} className={cn("lg:sticky lg:top-20 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:pr-1", selected && "max-lg:hidden")}>
          <ThreadList selectedId={selected} />
        </aside>
        <section className={cn("min-w-0", !selected && "max-lg:hidden")}>{children}</section>
      </div>
    </RequirePermission>
  )
}
