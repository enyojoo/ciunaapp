"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { formatSlaDuration, fulfillmentModeI18nKey } from "@ciuna/shared"
import { MarketplaceCheckout } from "@/components/hub/marketplace-checkout"
import { fetchWithAuth } from "@/lib/fetch-with-auth"

export default function ProductCheckout() {
  const { productId } = useParams<{ productId: string }>(),
    [product, setProduct] = useState<any>(null),
    { t } = useTranslation("app")
  useEffect(() => {
    void fetchWithAuth(`/api/hub/products/${productId}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product || d))
  }, [productId])

  if (!product) return <p>{t("marketplace.loading")}</p>

  const modeKey = fulfillmentModeI18nKey(product.fulfillment_mode)
  const sla = formatSlaDuration(product.sla_text)

  return (
    <>
      <section className="mx-auto max-w-2xl space-y-3 p-4">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.title}
            className="max-h-72 w-full rounded-2xl object-contain"
          />
        )}
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="flex flex-wrap gap-2">
          {modeKey ? (
            <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {t(modeKey)}
            </span>
          ) : null}
          {sla ? (
            <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {t("marketplace.usuallyWithin", { duration: sla })}
            </span>
          ) : null}
        </div>
        {product.long_description || product.short_description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {product.long_description || product.short_description}
          </p>
        ) : null}
      </section>
      <MarketplaceCheckout
        source={{ kind: "product", hubProductId: productId }}
        customAmount={product.pricing_type === "user_input"}
      />
    </>
  )
}
