import { FilterChips } from "@/components/filter-chips"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { ArrowLeft, Clock, Search as SearchIcon, X } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { AppTextInput } from "@/components/app-text-input"
import { ExpertDirectoryCard, expertProfilePath } from "@/components/expert-catalog"
import { LoadError } from "@/components/load-error"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { Screen } from "@/components/screen"
import { StoreGridCard, StoreGridSkeleton } from "@/components/store-item"
import { useAuth } from "@/lib/auth-context"
import { attachVendorsToProducts } from "@/lib/hub-catalog"
import { hubMarketplaceVendorPath, hubProductDetailPath } from "@/lib/hub"
import { addRecentSearch, clearRecentSearches, readRecentSearches } from "@/lib/recent-searches"
import { ApiError, authJson, isAbort } from "@/lib/social-api"
import type { ExpertProfile, HubProduct, HubVendor } from "@/lib/types"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

type Scope = "all" | "food" | "mart" | "experts"
type Group = "all" | "products" | "stores" | "experts"
type Results = { products: HubProduct[]; vendors: HubVendor[]; experts: ExpertProfile[] }
type Phase = "idle" | "loading" | "ready" | "error" | "limited"

const MIN = 2
const DEBOUNCE_MS = 350

export default function SearchScreen() {
  const { line } = useLocalSearchParams<{ line?: string }>()
  const initialScope: Scope = ["food", "mart", "experts"].includes(String(line)) ? (String(line) as Scope) : "all"
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation("app")
  const router = useRouter()
  const inputRef = useRef<{ focus: () => void } | null>(null)

  const [scope, setScope] = useState<Scope>(initialScope)
  const [text, setText] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [results, setResults] = useState<Results | null>(null)
  const [group, setGroup] = useState<Group>("all")
  const [recents, setRecents] = useState<string[]>([])
  const [retryTick, setRetryTick] = useState(0)

  const term = text.trim()
  const tooShort = term.length > 0 && term.length < MIN

  useEffect(() => {
    void readRecentSearches().then(setRecents)
  }, [])

  useEffect(() => {
    if (term.length < MIN) {
      setPhase("idle")
      setResults(null)
      return
    }
    const ctrl = new AbortController()
    setPhase("loading")
    const timer = setTimeout(async () => {
      try {
        const body = await authJson<Partial<Results>>(
          `/api/hub/search?q=${encodeURIComponent(term)}&line=${scope}&limit=12`,
          { signal: ctrl.signal },
        )
        if (ctrl.signal.aborted) return
        setResults({ products: body.products || [], vendors: body.vendors || [], experts: body.experts || [] })
        setGroup("all")
        setPhase("ready")
      } catch (e) {
        if (isAbort(e) || ctrl.signal.aborted) return
        setPhase(e instanceof ApiError && e.status === 429 ? "limited" : "error")
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [term, scope, retryTick])

  const remember = useCallback(() => {
    if (term.length >= MIN) void addRecentSearch(term).then(setRecents)
  }, [term])

  const products = useMemo(
    () =>
      attachVendorsToProducts(results?.products || [], results?.vendors || [], scope === "all" ? "food" : scope).filter(
        (p) => p.service_line_slug === "food" || p.service_line_slug === "mart",
      ),
    [results, scope],
  )
  const vendors = (results?.vendors || []).filter((v) => v.service_line_slug === "food" || v.service_line_slug === "mart")
  const experts = results?.experts || []
  const total = products.length + vendors.length + experts.length

  if (!authLoading && !user) return <Redirect href="/auth/login" />

  const showProducts = products.length > 0 && (group === "all" || group === "products")
  const showStores = vendors.length > 0 && (group === "all" || group === "stores")
  const showExperts = experts.length > 0 && (group === "all" || group === "experts")

  const chips: { id: Group; label: string }[] = [
    { id: "all", label: t("search.all", { defaultValue: "All" }) },
    ...(products.length ? [{ id: "products" as Group, label: t("search.products", { defaultValue: "Products" }) }] : []),
    ...(vendors.length ? [{ id: "stores" as Group, label: t("search.stores", { defaultValue: "Stores" }) }] : []),
    ...(experts.length ? [{ id: "experts" as Group, label: t("search.experts", { defaultValue: "Experts" }) }] : []),
  ]

  const placeholder =
    scope === "food"
      ? t("search.placeholderFood", { defaultValue: "Search Food" })
      : scope === "mart"
        ? t("search.placeholderMart", { defaultValue: "Search Mart" })
        : scope === "experts"
          ? t("search.placeholderExperts", { defaultValue: "Search experts" })
          : t("search.placeholder", { defaultValue: "Search products, stores, experts" })

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(app)/hub" as never))

  const grid = (children: React.ReactNode) => <View style={styles.grid}>{children}</View>

  return (
    <Screen edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={t("search.back", { defaultValue: "Back" })}
          hitSlop={8}
          style={styles.back}
        >
          <ArrowLeft size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.field}>
          <SearchIcon size={18} color={colors.muted} strokeWidth={2.2} />
          <AppTextInput
            ref={inputRef as never}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={placeholder}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={remember}
            style={styles.input}
          />
          {text ? (
            <Pressable
              onPress={() => setText("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("search.clear", { defaultValue: "Clear" })}
            >
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {term.length === 0 || tooShort ? (
          <>
            {tooShort ? (
              <Text style={styles.hint}>{t("search.minHint", { defaultValue: "Type at least 2 characters." })}</Text>
            ) : null}
            {recents.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{t("search.recent", { defaultValue: "Recent searches" })}</Text>
                  <Pressable
                    onPress={() => {
                      void clearRecentSearches()
                      setRecents([])
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={styles.link}>{t("search.clearRecent", { defaultValue: "Clear" })}</Text>
                  </Pressable>
                </View>
                {recents.map((r) => (
                  <Pressable key={r} onPress={() => setText(r)} accessibilityRole="button" style={styles.recentRow}>
                    <Clock size={16} color={colors.muted} strokeWidth={2} />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : !tooShort ? (
              <Text style={styles.hintMuted}>{t("search.empty", { defaultValue: "Search for products, stores and experts." })}</Text>
            ) : null}
          </>
        ) : phase === "loading" ? (
          <View>
            {grid(
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <StoreGridSkeleton />
                <StoreGridSkeleton />
              </>,
            )}
          </View>
        ) : phase === "limited" ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {t("search.rateLimited", { defaultValue: "Too many searches. Try again in a minute." })}
            </Text>
          </View>
        ) : phase === "error" ? (
          <LoadError onRetry={() => setRetryTick((n) => n + 1)} />
        ) : phase === "ready" && total === 0 ? (
          <View style={styles.none}>
            <Text style={styles.noneTitle}>{t("search.noResultsTitle", { q: term, defaultValue: "No results for “{{q}}”" })}</Text>
            <Text style={styles.noneBody}>{t("search.noResultsBody", { defaultValue: "Check the spelling or try a shorter word." })}</Text>
            <View style={styles.suggest}>
              {scope !== "all" ? (
                <Pressable onPress={() => setScope("all")} accessibilityRole="button" style={styles.chip}>
                  <Text style={styles.chipText}>{t("search.searchAll", { defaultValue: "Search everywhere" })}</Text>
                </Pressable>
              ) : null}
              {recents
                .filter((r) => r.toLowerCase() !== term.toLowerCase())
                .slice(0, 4)
                .map((r) => (
                  <Pressable key={r} onPress={() => setText(r)} accessibilityRole="button" style={styles.chip}>
                    <Text style={styles.chipText}>{r}</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        ) : phase === "ready" ? (
          <View>
            {chips.length > 2 ? (
              <View style={styles.chips}>
                <FilterChips options={chips} value={group} onChange={setGroup} />
              </View>
            ) : null}
            {showProducts ? (
              <View style={styles.group}>
                <Text style={styles.sectionTitle}>{t("search.products", { defaultValue: "Products" })}</Text>
                {grid(
                  products.map((p) => {
                    const lineSlug = p.service_line_slug as "food" | "mart"
                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        cta={p.pricing_type === "user_input" ? t("hub.order", { defaultValue: "Order" }) : t("hub.buy", { defaultValue: "Buy" })}
                        cartLineSlug={lineSlug}
                        onPress={() => {
                          remember()
                          router.push(hubProductDetailPath(lineSlug, p.id) as never)
                        }}
                        onVendorPress={() => {
                          if (p.vendor?.slug) {
                            remember()
                            router.push(hubMarketplaceVendorPath(lineSlug, p.vendor.slug) as never)
                          }
                        }}
                      />
                    )
                  }),
                )}
              </View>
            ) : null}
            {showStores ? (
              <View style={styles.group}>
                <Text style={styles.sectionTitle}>{t("search.stores", { defaultValue: "Stores" })}</Text>
                {grid(
                  vendors.map((v) => (
                    <StoreGridCard
                      key={v.id}
                      vendor={v}
                      onPress={() => {
                        remember()
                        router.push(hubMarketplaceVendorPath(String(v.service_line_slug), v.slug) as never)
                      }}
                    />
                  )),
                )}
              </View>
            ) : null}
            {showExperts ? (
              <View style={styles.group}>
                <Text style={styles.sectionTitle}>{t("search.experts", { defaultValue: "Experts" })}</Text>
                {grid(
                  experts.map((ex) => (
                    <ExpertDirectoryCard key={ex.id} expert={ex} onBeforeNavigate={remember} />
                  )),
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  field: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  input: { flex: 1, minWidth: 0, minHeight: 44, fontSize: typeSize.body, color: colors.text },
  body: { paddingHorizontal: space.page, paddingTop: 12, paddingBottom: 40 },
  hint: { marginBottom: 16, fontSize: typeSize.meta, color: colors.muted },
  hintMuted: { paddingVertical: 32, textAlign: "center", fontSize: typeSize.body, color: colors.muted },
  section: { marginTop: 4 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  sectionTitle: { marginBottom: 12, fontSize: 18, fontWeight: "600", color: colors.text },
  link: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primaryText },
  recentRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentText: { flex: 1, fontSize: typeSize.body, color: colors.text },
  group: { marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  chips: { paddingBottom: 12 },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  chipTextOn: { color: colors.onPrimary },
  notice: { borderRadius: radius.row, backgroundColor: colors.warningSurface, padding: 16 },
  noticeText: { fontSize: typeSize.body, color: colors.warningText, textAlign: "center" },
  none: { alignItems: "center", paddingVertical: 40 },
  noneTitle: { textAlign: "center", fontSize: 18, fontWeight: "600", color: colors.text },
  noneBody: { marginTop: 8, textAlign: "center", fontSize: typeSize.body, color: colors.muted },
  suggest: { marginTop: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
})
