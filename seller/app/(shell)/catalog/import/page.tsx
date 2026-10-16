"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { BulkImport } from "@/components/catalog/bulk-import"

export default function ImportPage() {
  const { t } = useT()
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        back={<Link href="/catalog" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("catalog.back")}</Link>}
        title={t("catalog.import.title")}
        description={t("catalog.import.intro")}
      />
      <BulkImport />
    </div>
  )
}
