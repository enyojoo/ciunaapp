import { useCallback, useEffect, useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { hubServiceLineTileCopy, type HubServiceLineRow } from "@ciuna/shared"
import { AppHeader } from "@/components/app-header"
import { EmptyState } from "@/components/empty-state"
import { HubHero } from "@/components/hub-hero"
import { Screen } from "@/components/screen"
import { Tile, TileSkeleton } from "@/components/tile"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useExternalLink } from "@/lib/external-link"
import { lineHref } from "@/lib/hub"
import { colors, space } from "@/lib/theme"

export default function HomeScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { openLink } = useExternalLink()
  const { showError } = useToast()
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (soft?: boolean) => {
      if (!soft) setLoading(true)
      try {
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("load")
        const data = (await res.json()) as { serviceLines?: HubServiceLineRow[] }
        setLines(data.serviceLines || [])
      } catch {
        if (!soft) setLines([])
        showError(t("errors.loadFailed", { defaultValue: "Could not load data. Please try again." }))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [showError, t],
  )

  useEffect(() => {
    void load()
  }, [load])

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
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void load(true)
            }}
            tintColor={colors.primary}
          />
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
