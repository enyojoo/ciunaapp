import { Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useHubProduct } from "@/lib/use-hub-product"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
export default function ProductCheckout() {
  const { productId } = useLocalSearchParams<{ productId: string }>(),
    { data: product } = useHubProduct(productId),
    { t } = useTranslation("app")
  return product ? (
    <MarketplaceCheckout
      source={{ kind: "product", hubProductId: productId }}
      customAmount={product.pricing_type === "user_input"}
    />
  ) : (
    <Text>{t("marketplace.loading")}</Text>
  )
}
