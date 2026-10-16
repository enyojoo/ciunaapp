import { useMemo } from "react"
import { Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useHubProduct } from "@/lib/use-hub-product"
import { hubProductEffectivePrice } from "@/lib/money"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
import { HubTopBar } from "@/components/hub-top-bar"
import { hubLineHomePath } from "@/lib/hub"

function ProductCheckoutBody() {
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

/** Same top bar as Food, store and product: back chip and the screen title. */
export default function ProductCheckout() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { t } = useTranslation("app")
  return (
    <View style={{ flex: 1 }}>
      <HubTopBar title={t("marketplace.checkout", { defaultValue: "Checkout" })} backHref={hubLineHomePath(String(slug || "food").toLowerCase())} />
      <ProductCheckoutBody />
    </View>
  )
}
