import { useEffect, useState } from "react"
import { ScrollView, Text } from "react-native"
import { EmptyState } from "@/components/empty-state"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"
import type { RecipientRow } from "@/lib/types"

export default function RecipientsScreen() {
  const [rows, setRows] = useState<RecipientRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void (async () => {
      const res = await fetchWithAuth("/api/recipients")
      const data = (await res.json()) as { recipients?: RecipientRow[] }
      setRows(data.recipients || [])
      setLoading(false)
    })()
  }, [])
  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <Text className="py-8 text-center text-muted">Loading…</Text> : null}
        {!loading && rows.length === 0 ? (
          <EmptyState title="No recipients" body="Add someone when you send money." />
        ) : null}
        {rows.map((r) => (
          <Text key={r.id} className="border-b border-border py-3.5 text-base text-gray-900">
            {r.full_name}
            {r.bank_name ? `\n${r.bank_name}` : ""}
          </Text>
        ))}
      </ScrollView>
    </Screen>
  )
}
