import { useCallback, useEffect, useRef, useState } from "react"
import { publicJson } from "./social-api"

export type PublicReview = {
  id: string
  rating: number
  body: string
  language: string | null
  created_at: string
  customer_first_name: string | null
  reply: string | null
  reply_at: string | null
}

export type ReviewSummary = {
  avg: number | null
  count: number
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>
}

type Page = { summary: ReviewSummary; reviews: PublicReview[] }

export type ReviewTarget = { kind: "vendor"; line: string; slug: string } | { kind: "expert"; slug: string }

const FIRST = 3
const MORE = 10

function path(target: ReviewTarget, limit: number, offset: number) {
  const q = `limit=${limit}&offset=${offset}`
  return target.kind === "vendor"
    ? `/api/hub/vendors/${encodeURIComponent(target.slug)}/reviews?service_line=${encodeURIComponent(target.line)}&${q}`
    : `/api/expert/profiles/${encodeURIComponent(target.slug)}/reviews?${q}`
}

/** Public reviews and summary for a store or expert. Fails soft: `error` is set, the page keeps working. */
export function useReviews(target: ReviewTarget | null) {
  const targetKey = target ? (target.kind === "vendor" ? `v:${target.line}:${target.slug}` : `e:${target.slug}`) : null
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [loading, setLoading] = useState(Boolean(targetKey))
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [moreError, setMoreError] = useState(false)
  const targetRef = useRef(target)
  targetRef.current = target
  const seq = useRef(0)

  const load = useCallback(async () => {
    const tgt = targetRef.current
    if (!tgt) return
    const id = ++seq.current
    setLoading(true)
    setError(false)
    try {
      const page = await publicJson<Page>(path(tgt, FIRST, 0))
      if (seq.current !== id) return
      setSummary(page.summary)
      setReviews(page.reviews || [])
    } catch {
      if (seq.current === id) setError(true)
    } finally {
      if (seq.current === id) setLoading(false)
    }
  }, [])

  useEffect(() => {
    setSummary(null)
    setReviews([])
    if (targetKey) void load()
    else setLoading(false)
  }, [targetKey, load])

  const loadMore = useCallback(async () => {
    const tgt = targetRef.current
    if (!tgt) return
    setLoadingMore(true)
    setMoreError(false)
    try {
      const page = await publicJson<Page>(path(tgt, MORE, reviews.length))
      setReviews((cur) => {
        const seen = new Set(cur.map((r) => r.id))
        return [...cur, ...(page.reviews || []).filter((r) => !seen.has(r.id))]
      })
      setSummary(page.summary)
    } catch {
      setMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }, [reviews.length])

  const hasMore = Boolean(summary && reviews.length < summary.count)
  return { summary, reviews, loading, loadingMore, error, moreError, hasMore, reload: load, loadMore }
}

export type ReviewsState = ReturnType<typeof useReviews>
