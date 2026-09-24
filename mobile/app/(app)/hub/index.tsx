import { RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineTileCopy, type HubServiceLineRow } from "@ciuna/shared"
import { AppHeader } from "@/components/app-header"
import { EmptyState } from "@/components/empty-state"
import { HubHero } from "@/components/hub-hero"
import { Screen } from "@/components/screen"
import { Tile, TileSkeleton } from "@/components/tile"
import { useExternalLink } from "@/lib/external-link"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useHubServiceLines } from "@/lib/use-hub-service-line"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"
import { lineHref } from "@/lib/hub"
import { useTabContentPadding } from "@/lib/use-tab-content-padding"
import { colors, space } from "@/lib/theme"

export default function HomeScreen() {
  const { t } = useTranslation("app")
  const tabContentPadding = useTabContentPadding()
  const router = useRouter()
  const { openLink } = useExternalLink()
  const { data, loading, refreshing, refresh, revalidate } = useHubServiceLines()
  const lines = data || []

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
      <AppHeader />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabContentPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <HubHero />
        {loading ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.cell}>
                <TileSkeleton />
              </View>
            ))}
          </View>
        ) : lines.length === 0 ? (
          <EmptyState
            title={t("hub.unavailableTitle", { defaultValue: "Unavailable" })}
            body={t("hub.serviceUnavailable", { defaultValue: "This service is currently unavailable." })}
          />
        ) : (
          <View style={styles.grid}>
            {lines.map((line) => {
              const { title, shortDescription } = hubServiceLineTileCopy(line, t)
              return (
                <View key={line.id} style={styles.cell}>
                  <Tile title={title} description={shortDescription} iconUrl={line.icon_url} onPress={() => open(line)} />
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: space.page },
  cell: { width: "48.5%", marginBottom: 10 },
})
