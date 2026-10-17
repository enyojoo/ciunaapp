import { StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { resolveTransactionListLine, transactionListLineIconKind } from "@ciuna/shared"
import { Amount, AppText, Badge, Card, Icon, IconWell, SectionHeader, type IconName } from "@/components/ui"
import { statusLabel, transactionTitle } from "@/lib/transactions"
import type { CombinedTransaction } from "@/lib/types"
import { colors, space } from "@/lib/theme"

const MAX_SHOWN = 2

function iconFor(tx: CombinedTransaction): IconName {
  const line = resolveTransactionListLine(
    { type: tx.type, transaction_source: tx.transaction_source, reference: tx.reference },
    tx.hub_product_category,
    tx.hub_snapshot,
  )
  const kind = transactionListLineIconKind(line)
  if (kind === "hub_food") return "food"
  if (kind === "hub_mart") return "mart"
  if (kind === "experts") return "experts"
  return "send"
}

/** What is happening right now: pending and processing orders and transfers, newest first. Renders nothing when there are none. */
export function NowSection({ rows }: { rows: CombinedTransaction[] }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  if (rows.length === 0) return null
  return (
    <View style={styles.wrap}>
      <SectionHeader title={t("home.now.title", { defaultValue: "In progress" })} />
      <View style={styles.list}>
        {rows.slice(0, MAX_SHOWN).map((tx) => {
          const amount = tx.send_amount ?? tx.total_amount
          const title = transactionTitle(tx, t as never)
          return (
            <Card key={tx.transaction_id} onPress={() => router.push(`/orders/${String(tx.transaction_id).toLowerCase()}` as never)} accessibilityLabel={title} style={styles.card}>
              <IconWell tone="primary" size={44}>
                <Icon name={iconFor(tx)} size={22} color={colors.primaryText} />
              </IconWell>
              <View style={styles.body}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {title}
                </AppText>
                <View style={styles.meta}>
                  <Badge label={statusLabel(t as never, tx.status)} tone="warning" icon={(c) => <Icon name="clock" size={12} color={c} strokeWidth={2.4} />} />
                </View>
              </View>
              <Amount value={amount} currency={tx.send_currency} size="body" />
            </Card>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.gutter, marginBottom: space.lg },
  list: { gap: space.sm },
  card: { flexDirection: "row", alignItems: "center", gap: space.md },
  body: { flex: 1, minWidth: 0, gap: 6 },
  meta: { flexDirection: "row" },
})
