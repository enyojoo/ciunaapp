import { useEffect, useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/empty-state"
import { ExpertDirectoryCard } from "@/components/expert-catalog"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { apiFetch } from "@/lib/api"
import type { ExpertProfile } from "@/lib/types"
import { colors } from "@/lib/theme"

export default function ExpertsBrowseScreen() {
  const { t } = useTranslation("app")
  const [profiles, setProfiles] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiFetch("/api/expert/profiles")
        const body = (await res.json().catch(() => ({}))) as { profiles?: ExpertProfile[] }
        if (!cancelled) setProfiles(res.ok ? body.profiles || [] : [])
      } catch {
        if (!cancelled) setProfiles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(
    () =>
      [...profiles].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      }),
    [profiles],
  )

  return (
    <HubLinePageShell
      title={t("hub.expertsDirectoryTitle", { defaultValue: "All experts" })}
      subtitle={t("hub.expertsDirectorySubtitle", { defaultValue: "Browse every expert on Ciuna." })}
      backAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
      backHref="/experts"
    >
      {loading && profiles.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skel} />
          ))}
        </View>
      ) : null}
      {!loading && sorted.length === 0 ? (
        <EmptyState title={t("hub.expertsEmpty", { defaultValue: "No experts listed yet." })} />
      ) : (
        <View style={styles.grid}>
          {sorted.map((ex) => (
            <ExpertDirectoryCard key={ex.id} expert={ex} />
          ))}
        </View>
      )}
    </HubLinePageShell>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  skel: { width: "48.5%", aspectRatio: 0.85, marginBottom: 12, borderRadius: 16, backgroundColor: colors.paper },
})
