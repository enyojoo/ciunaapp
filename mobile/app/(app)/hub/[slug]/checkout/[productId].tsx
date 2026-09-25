import { useMemo } from "react"
import { Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useHubProduct } from "@/lib/use-hub-product"
import { hubProductEffectivePrice } from "@/lib/money"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"

export default function ProductCheckout() {
  const { productId } = useLocalSearchParams<{ productId: string }>(),
    { data: product } = useHubProduct(productId),
    { t } = useTranslation("app")
  const seed = useMemo(() => {
    if (!product) return undefined
    const currency = product.fixed_currency || product.default_input_currency || ""
    const unitPrice = hubProductEffectivePrice(product)
    return {
      title: product.title,
      lines: [{ id: product.id, quantity: 1, title: product.title, unitPrice }],
      currency,
      total: unitPrice,
    }
  }, [product])
  return product ? (
    <MarketplaceCheckout
      source={{ kind: "product", hubProductId: productId }}
      customAmount={product.pricing_type === "user_input"}
      seed={seed}
    />
  ) : (
    <Text>{t("marketplace.loading")}</Text>
  )
}
