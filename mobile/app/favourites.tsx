import { useCallback, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { Heart } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { ExpertDirectoryCard } from "@/components/expert-catalog"
import { LoadError } from "@/components/load-error"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { ScreenScroll } from "@/components/screen"
import { StoreGridCard, StoreGridSkeleton } from "@/components/store-item"
import { hubMarketplaceVendorPath, hubProductDetailPath } from "@/lib/hub"
import { useFavourites } from "@/lib/favourites"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Tab = "stores" | "products" | "experts"

export default function FavouritesScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { signedIn, data, loading, failed, reload } = useFavourites()
  const [tab, setTab] = useState<Tab>("stores")

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload]),
  )

  const keys = new Set(data?.keys || [])
  const stores = (data?.vendors || []).filter((v) => keys.has(`vendor:${v.id}`))
  const products = (data?.products || []).filter((p) => keys.has(`product:${p.id}`))
  const experts = (data?.experts || []).filter((e) => keys.has(`expert:${e.id}`))

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "stores", label: t("favourites.stores", { defaultValue: "Stores" }), count: stores.length },
    { id: "products", label: t("favourites.products", { defaultValue: "Products" }), count: products.length },
    { id: "experts", label: t("favourites.experts", { defaultValue: "Experts" }), count: experts.length },
  ]

  if (!signedIn) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <EmptyState
          title={t("favourites.signedOutTitle", { defaultValue: "Sign in to see your favourites" })}
          body={t("favourites.signedOutBody", { defaultValue: "Your favourites follow your account across devices." })}
          actionLabel={t("favourites.signIn", { defaultValue: "Sign in" })}
          onAction={() => router.push("/auth/login" as never)}
        />
      </ScreenScroll>
    )
  }

  const emptyCopy = {
    stores: {
      body: t("favourites.emptyStores", { defaultValue: "No favourite stores yet. Tap the heart on a store to save it here." }),
      action: t("favourites.browseFood", { defaultValue: "Browse Food" }),
      href: "/(app)/hub/food",
    },
    products: {
      body: t("favourites.emptyProducts", { defaultValue: "No favourite products yet. Tap the heart on a product to save it here." }),
      action: t("favourites.browseMart", { defaultValue: "Browse Mart" }),
      href: "/(app)/hub/mart",
    },
    experts: {
      body: t("favourites.emptyExperts", { defaultValue: "No favourite experts yet. Tap the heart on an expert to save them here." }),
      action: t("favourites.browseExperts", { defaultValue: "Browse experts" }),
      href: "/experts",
    },
  }[tab]

  const list = (() => {
    if (loading) {
      return (
        <View style={styles.grid}>
          <StoreGridSkeleton />
          <StoreGridSkeleton />
          {tab === "products" ? (
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          ) : null}
        </View>
      )
    }
    if (failed) return <LoadError onRetry={() => void reload()} />
    const count = tabs.find((x) => x.id === tab)!.count
    if (count === 0) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Heart size={26} color={colors.primaryText} strokeWidth={2} />
          </View>
          <EmptyState
            title={emptyCopy.body}
            actionLabel={emptyCopy.action}
            onAction={() => router.push(emptyCopy.href as never)}
          />
        </View>
      )
    }
    if (tab === "stores") {
      return (
        <View style={styles.grid}>
          {stores.map((v) => (
            <StoreGridCard
              key={v.id}
              vendor={v}
              onPress={() => router.push(hubMarketplaceVendorPath(String(v.service_line_slug || "food"), v.slug) as never)}
            />
          ))}
        </View>
      )
    }
    if (tab === "products") {
      return (
        <View style={styles.grid}>
          {products.map((p) => {
            const lineSlug = (p.service_line_slug === "mart" ? "mart" : "food") as "food" | "mart"
            return (
              <ProductCard
                key={p.id}
                product={p}
                showVendor={false}
                cta={p.pricing_type === "user_input" ? t("hub.order", { defaultValue: "Order" }) : t("hub.buy", { defaultValue: "Buy" })}
                cartLineSlug={lineSlug}
                onPress={() => router.push(hubProductDetailPath(lineSlug, p.id) as never)}
              />
            )
          })}
        </View>
      )
    }
    return (
      <View style={styles.grid}>
        {experts.map((e) => (
          <ExpertDirectoryCard key={e.id} expert={e} />
        ))}
      </View>
    )
  })()

  return (
    <ScreenScroll edges={["left", "right"]}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((x) => (
          <Pressable
            key={x.id}
            onPress={() => setTab(x.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === x.id }}
            style={[styles.tab, tab === x.id && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === x.id && styles.tabTextOn]}>{x.label}</Text>
          </Pressable>
        ))}
      </View>
      {list}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: "#E5E7EB",
  },
  tab: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.surface },
  tabText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  tabTextOn: { color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  empty: { alignItems: "center", paddingTop: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryTint },
})
