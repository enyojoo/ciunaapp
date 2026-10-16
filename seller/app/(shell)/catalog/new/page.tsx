"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { ProductForm } from "@/components/catalog/product-form"

export default function NewProductPage() {
  const { t } = useT()
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        back={<Link href="/catalog" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("catalog.back")}</Link>}
        title={t("catalog.new.title")}
      />
      <ProductForm product={null} />
    </div>
  )
}
