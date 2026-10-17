import { RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineTileCopy, type HubServiceLineRow } from "@ciuna/shared"
import { AppHeader } from "@/components/app-header"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { HomeSlider } from "@/components/home-slider"
import { HOME_SLIDES } from "@/lib/home-slides"
import { Screen } from "@/components/screen"
import { Tile, TileSkeleton } from "@/components/tile"
import { useExternalLink } from "@/lib/external-link"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubServiceLines } from "@/lib/use-hub-service-line"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { lineHref } from "@/lib/hub"
import { useCatalogGridColumns } from "@/lib/responsive-layout"
import { useTabContentPadding } from "@/lib/use-tab-content-padding"
import { colors, space } from "@/lib/theme"

export default function HomeScreen() {
  const { t } = useTranslation("app")
  const tabContentPadding = useTabContentPadding()
  const router = useRouter()
  const { openLink } = useExternalLink()
  const { data, loading, error, refreshing, refresh, revalidate } = useHubServiceLines()
  const lines = data || []
  // Phones show two tiles per row and fill the screen. Wide web screens show them all in one row,
  // with a height cap so the tiles stay a sensible size instead of stretching across a big window.
  const wide = useCatalogGridColumns() > 2
  const perRow = wide ? Math.max(2, lines.length || 4) : 2

  useFocusRevalidate(revalidate)
  useRevalidateOnForeground(revalidate)

  const open = (line: HubServiceLineRow) => {
    const href = lineHref(line)
    if (!href) return
    if (line.grid_kind === "external_url") {
      const { title } = hubServiceLineTileCopy(line, t)
      void openLink(href, title)
      return
    }
    router.push(href as never)
  }

  return (
    <Screen edges={["top", "left", "right"]}>
      {/* Header stays fixed; search, slider and tiles scroll under it. */}
      <AppHeader />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabContentPadding }]}
        // Tiles keep their own height and sit right under the slider. Stretching rows to fill the screen left
        // a dead gap between rows when Office has only four lines switched on.
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <HomeSlider slides={HOME_SLIDES} />
        {loading ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((r) => (
              <View key={r} style={styles.row}>
                <View style={styles.cell}>
                  <TileSkeleton />
                </View>
                <View style={styles.cell}>
                  <TileSkeleton />
                </View>
              </View>
            ))}
          </View>
        ) : lines.length === 0 && error ? (
          <LoadError onRetry={() => void revalidate()} />
        ) : lines.length === 0 ? (
          <EmptyState
            title={t("hub.unavailableTitle", { defaultValue: "Unavailable" })}
            body={t("hub.serviceUnavailable", { defaultValue: "This service is currently unavailable." })}
          />
        ) : (
          <View style={styles.grid}>
            {Array.from({ length: Math.ceil(lines.length / perRow) }).map((_, r) => (
              <View key={r} style={[styles.row, wide && styles.rowWide]}>
                {lines.slice(r * perRow, r * perRow + perRow).map((line) => {
                  const { title, shortDescription } = hubServiceLineTileCopy(line, t)
                  return (
                    <View key={line.id} style={styles.cell}>
                      <Tile title={title} description={shortDescription} slug={line.slug} onPress={() => open(line)} />
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 16, paddingBottom: 40 },
  grid: { paddingHorizontal: space.page, gap: 12, paddingBottom: 10 },
  row: { flexDirection: "row", gap: 12 },
  rowWide: { flexGrow: 0, flexShrink: 0, flexBasis: 320, height: 320 },
  cell: { flex: 1 },
})
