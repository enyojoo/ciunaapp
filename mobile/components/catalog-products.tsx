import { FilterChips } from "@/components/filter-chips"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { catalogCategories, filterCatalogByCategory, sortHubCatalogProducts } from "@/lib/hub-catalog"
import type { HubProduct } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

const ALL_VALUE = "__all__"

export function CatalogProducts({
  products,
  loading,
  showVendor = true,
  showCategory = false,
  onProductPress,
  onVendorPress,
  cartLineSlug,
  heading: headingProp,
}: {
  products: HubProduct[]
  loading?: boolean
  showVendor?: boolean
  showCategory?: boolean
  onProductPress?: (product: HubProduct) => void
  onVendorPress?: (product: HubProduct) => void
  /** Food/Mart, any listing: fixed-price cards render Add-to-cart/stepper (each card owns its own cart lookup by `product.vendor_id`) instead of navigating. */
  cartLineSlug?: "food" | "mart"
  /** Overrides the default "Products" heading — e.g. "More from {vendor}" on the product detail screen's recommendations. */
  heading?: string
}) {
  const { t } = useTranslation("app")
  const [category, setCategory] = useState("")
  const ordered = useMemo(() => sortHubCatalogProducts(products), [products])
  const options = useMemo(() => catalogCategories(ordered, category), [ordered, category])
  const visible = useMemo(() => filterCatalogByCategory(ordered, category), [ordered, category])
  const buy = t("hub.buy", { defaultValue: "Buy" })
  const order = t("hub.order", { defaultValue: "Order" })
  const allLabel = t("hub.allCategories", { defaultValue: "All categories" })
  const heading = headingProp || t("hub.marketplaceProductsHeading", { defaultValue: "Products" })
  const filterAria = t("hub.categoryFilterAria", { defaultValue: "Filter by category" })

  /** Design: heading, then a row of category chips ("All" plus each category); the selected chip is filled. */
  const chips = [{ id: ALL_VALUE, label: allLabel }, ...options.map((c) => ({ id: c, label: c }))]
  const toolbar = (
    <View style={styles.toolbar}>
      <Text style={styles.heading} numberOfLines={1}>
        {heading}
      </Text>
      {options.length > 0 ? (
        <FilterChips
          options={chips}
          value={category || ALL_VALUE}
          onChange={(id) => setCategory(id === ALL_VALUE ? "" : id)}
          ariaLabel={filterAria}
        />
      ) : loading ? (
        <View style={styles.selectSkeleton} />
      ) : null}
    </View>
  )

  if (loading && products.length === 0) {
    return (
      <View>
        {toolbar}
        <View style={styles.grid}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    )
  }

  if (products.length === 0) {
    return <EmptyState title={t("hub.noProducts", { defaultValue: "No products available yet." })} />
  }

  return (
    <View>
      {toolbar}
      {visible.length === 0 ? (
        <EmptyState
          title={t("hub.noProductsInCategory", { defaultValue: "No products in this category." })}
          actionLabel={allLabel}
          onAction={() => setCategory("")}
        />
      ) : (
        <View style={styles.grid}>
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cta={p.pricing_type === "user_input" ? order : buy}
              showVendor={showVendor}
              showCategory={showCategory}
              onPress={onProductPress ? () => onProductPress(p) : undefined}
              onVendorPress={onVendorPress ? () => onVendorPress(p) : undefined}
              cartLineSlug={cartLineSlug}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: "700", color: colors.text, letterSpacing: -0.2 },
  toolbar: {
    gap: 12,
    marginBottom: 16,
  },
  selectHit: { maxWidth: 176, minWidth: 132 },
  select: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: 12,
    paddingRight: 10,
  },
  selectValue: { flex: 1, minWidth: 0, fontSize: typeSize.meta, fontWeight: "500", color: colors.text },
  selectSkeleton: {
    width: 160,
    height: 40,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
})
