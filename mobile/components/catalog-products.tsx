import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { ChevronDown } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { SheetPicker } from "@/components/sheet-picker"
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
}: {
  products: HubProduct[]
  loading?: boolean
  showVendor?: boolean
  showCategory?: boolean
  onProductPress: (product: HubProduct) => void
  onVendorPress?: (product: HubProduct) => void
}) {
  const { t } = useTranslation("app")
  const [category, setCategory] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const ordered = useMemo(() => sortHubCatalogProducts(products), [products])
  const options = useMemo(() => catalogCategories(ordered, category), [ordered, category])
  const visible = useMemo(() => filterCatalogByCategory(ordered, category), [ordered, category])
  const buy = t("hub.buy", { defaultValue: "Buy" })
  const order = t("hub.order", { defaultValue: "Order" })
  const allLabel = t("hub.allCategories", { defaultValue: "All categories" })
  const heading = t("hub.marketplaceProductsHeading", { defaultValue: "Products" })
  const filterAria = t("hub.categoryFilterAria", { defaultValue: "Filter by category" })
  const pickerItems = useMemo(
    () => [{ id: ALL_VALUE, label: allLabel }, ...options.map((c) => ({ id: c, label: c }))],
    [allLabel, options],
  )
  const selectedLabel = category || allLabel

  const toolbar = (
    <View style={styles.toolbar}>
      <Text style={styles.heading} numberOfLines={1}>
        {heading}
      </Text>
      {options.length > 0 ? (
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={filterAria}
          style={styles.selectHit}
        >
          <View style={styles.select}>
            <Text style={styles.selectValue} numberOfLines={1}>
              {selectedLabel}
            </Text>
            <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
          </View>
        </Pressable>
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
      <SheetPicker
        open={pickerOpen}
        title={filterAria}
        items={pickerItems}
        keyExtractor={(item) => item.id}
        labelExtractor={(item) => item.label}
        selectedId={category || ALL_VALUE}
        onSelect={(item) => setCategory(item.id === ALL_VALUE ? "" : item.id)}
        onClose={() => setPickerOpen(false)}
      />
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
              onPress={() => onProductPress(p)}
              onVendorPress={onVendorPress ? () => onVendorPress(p) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: "600", color: colors.text, marginRight: 8 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
