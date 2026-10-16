"use client"
import { MessageSquare } from "lucide-react"
import { EmptyState } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"

/** The list lives in the layout. On wide screens this is the right pane before a thread is chosen. */
export default function MessagesIndexPage() {
  const { t } = useT()
  return (
    <div className="rounded-2xl border border-hairline bg-white">
      <EmptyState icon={<MessageSquare />} title={t("messages.pick.title")} description={t("messages.pick.body")} />
    </div>
  )
}
