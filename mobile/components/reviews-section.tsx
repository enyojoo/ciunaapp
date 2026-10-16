import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { LoadError } from "@/components/load-error"
import { PrimaryButton } from "@/components/primary-button"
import { RatingStars } from "@/components/rating-stars"
import type { PublicReview, ReviewSummary, ReviewsState } from "@/lib/use-reviews"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** "★★★★★ 4.8 (23)" under a store or expert name. Renders nothing until there is at least one review. */
export function RatingLine({ summary }: { summary: ReviewSummary | null }) {
  const { t } = useTranslation("app")
  if (!summary || !summary.count || summary.avg == null) return null
  return (
    <View style={styles.line}>
      <RatingStars value={summary.avg} size={13} />
      <Text style={styles.lineText}>
        {summary.avg.toFixed(1)} · {t("reviews.count", { count: summary.count, defaultValue: "{{count}} reviews" })}
      </Text>
    </View>
  )
}

function Distribution({ summary }: { summary: ReviewSummary }) {
  return (
    <View style={styles.dist}>
      {([5, 4, 3, 2, 1] as const).map((n) => {
        const count = summary.distribution[String(n) as "1"] || 0
        const pct = summary.count ? Math.round((count / summary.count) * 100) : 0
        return (
          <View key={n} style={styles.distRow}>
            <Text style={styles.distLabel}>{n}</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.distCount}>{count}</Text>
          </View>
        )
      })}
    </View>
  )
}

function ReviewCard({ review, locale }: { review: PublicReview; locale: string }) {
  const { t } = useTranslation("app")
  let date = ""
  try {
    date = new Date(review.created_at).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })
  } catch {
    date = ""
  }
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.name} numberOfLines={1}>
          {review.customer_first_name || t("reviews.anonymous", { defaultValue: "Customer" })}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <RatingStars value={review.rating} size={13} />
      {review.body ? <Text style={styles.body}>{review.body}</Text> : null}
      {review.reply ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>{t("reviews.sellerReply", { defaultValue: "Reply from the seller" })}</Text>
          <Text style={styles.replyBody}>{review.reply}</Text>
        </View>
      ) : null}
    </View>
  )
}

/** Summary, distribution and a short list of public reviews with "Show more". Loading, empty and error states included. */
export function ReviewsSection({ state }: { state: ReviewsState }) {
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const { summary, reviews, loading, error, hasMore, loadingMore, moreError } = state

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t("reviews.sectionTitle", { defaultValue: "Reviews" })}</Text>
      {loading && !summary ? (
        <View style={styles.skeleton} />
      ) : error && !summary ? (
        <LoadError onRetry={() => void state.reload()} />
      ) : !summary || summary.count === 0 ? (
        <Text style={styles.empty}>{t("reviews.none", { defaultValue: "No reviews yet." })}</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <View style={styles.avgBox}>
              <Text style={styles.avg}>{(summary.avg ?? 0).toFixed(1)}</Text>
              <RatingStars value={summary.avg ?? 0} size={14} />
              <Text style={styles.avgCount}>
                {t("reviews.count", { count: summary.count, defaultValue: "{{count}} reviews" })}
              </Text>
            </View>
            <Distribution summary={summary} />
          </View>
          <View style={styles.list}>
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} locale={locale} />
            ))}
          </View>
          {moreError ? <LoadError onRetry={() => void state.loadMore()} /> : null}
          {hasMore && !moreError ? (
            <PrimaryButton
              label={t("reviews.showMore", { defaultValue: "Show more reviews" })}
              variant="secondary"
              busy={loadingMore}
              onPress={() => void state.loadMore()}
            />
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 28 },
  heading: { marginBottom: 12, fontSize: 18, fontWeight: "600", color: colors.text },
  line: { flexDirection: "row", alignItems: "center", gap: 6 },
  lineText: { fontSize: typeSize.meta, color: colors.muted },
  skeleton: { height: 96, borderRadius: radius.card, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  empty: { fontSize: typeSize.body, color: colors.muted },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  avgBox: { alignItems: "center", gap: 4, minWidth: 84 },
  avg: { fontSize: 32, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
  avgCount: { fontSize: 12, color: colors.muted },
  dist: { flex: 1, gap: 4 },
  distRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  distLabel: { width: 10, fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "right" },
  distTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  distFill: { height: 6, borderRadius: 3, backgroundColor: colors.primaryText },
  distCount: { width: 22, fontSize: 12, color: colors.muted },
  list: { marginTop: 12, marginBottom: 12, gap: 10 },
  card: {
    gap: 6,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  date: { fontSize: 12, color: colors.muted },
  body: { fontSize: typeSize.meta, lineHeight: 19, color: colors.text },
  reply: { marginTop: 4, borderRadius: radius.row, backgroundColor: colors.paper, padding: 10, gap: 2 },
  replyLabel: { fontSize: 12, fontWeight: "700", color: colors.muted },
  replyBody: { fontSize: typeSize.meta, lineHeight: 18, color: colors.text },
})
