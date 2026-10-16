"use client"
import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Banner, Button, PageHeader, Skeleton, StatusBadge } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { useErrorText, useT } from "@/lib/i18n"
import { ProductForm } from "@/components/catalog/product-form"
import type { Product } from "@/components/catalog/shared"

export default function EditProductPage() {
  const { t } = useT()
  const errText = useErrorText()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [attempt, setAttempt] = React.useState(0)

  // Fetched fresh (not cached-first): the form seeds its state once, so it must start from current data.
  React.useEffect(() => {
    let cancelled = false
    setError(null)
    api<{ product: Product }>(`/api/merchant/products/${id}`)
      .then((r) => { if (!cancelled) setProduct(r.product) })
      .catch((e) => { if (!cancelled) setError(errText(e instanceof ApiError ? e.code : undefined)) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, attempt])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        back={<Link href="/catalog" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("catalog.back")}</Link>}
        title={product?.title ?? t("catalog.edit.title")}
        action={product ? <StatusBadge status={product.status} label={t(`catalog.status.${product.status}`)} /> : undefined}
      />
      {error ? (
        <Banner tone="destructive" title={error} action={<Button size="sm" variant="secondary" onClick={() => setAttempt((a) => a + 1)}>{t("action.retry")}</Button>} />
      ) : product ? (
        <ProductForm key={product.id} product={product} />
      ) : (
        <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>
      )}
    </div>
  )
}
