"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { officeFetch } from "@/lib/api-client"

type Data = {
  credentials: Array<{ title: string; issuer?: string; year?: number }>
  yearsExperience: number | null
  review: "none" | "pending" | "approved" | "rejected"
  reason: string | null
  reviewedAt: string | null
}

const LABEL: Record<Data["review"], string> = { none: "No credentials", pending: "Pending review", approved: "Approved", rejected: "Rejected" }

/** Approve or reject an expert's listed credentials. A rejection needs a reason the expert sees in Seller. */
export function ExpertCredentialsReview({ profileId }: { profileId: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError("")
    const res = await officeFetch(`/api/admin/expert/profiles/${profileId}/credentials`)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) return setError(j?.error || "Could not load credentials")
    setData(j)
  }, [profileId])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (decision: "approved" | "rejected") => {
    setBusy(true)
    setError("")
    try {
      const res = await officeFetch(`/api/admin/expert/profiles/${profileId}/credentials`, { method: "POST", body: JSON.stringify({ decision, reason }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) return setError(j?.error === "REASON_REQUIRED" ? "Give a reason for the rejection." : j?.error || "Could not save the decision")
      setReason("")
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (error && !data) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return <p className="text-sm text-muted-foreground">Loading credentials…</p>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Credentials</CardTitle>
        <Badge variant={data.review === "approved" ? "default" : data.review === "rejected" ? "destructive" : "secondary"}>{LABEL[data.review]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">This expert has not listed any credentials.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.credentials.map((c, i) => (
              <li key={i} className="rounded-md border p-3">
                <div className="font-medium">{c.title}</div>
                <div className="text-muted-foreground">{[c.issuer, c.year].filter(Boolean).join(", ") || "No issuer or year"}</div>
              </li>
            ))}
          </ul>
        )}
        {data.yearsExperience != null ? <p className="text-sm">Years of experience: {data.yearsExperience}</p> : null}
        {data.review === "rejected" && data.reason ? <p className="text-sm text-destructive">Reason: {data.reason}</p> : null}
        {data.credentials.length > 0 ? (
          <div className="space-y-2">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required to reject, shown to the expert)" rows={2} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => void decide("approved")}>Approve</Button>
              <Button variant="outline" disabled={busy} onClick={() => void decide("rejected")}>Reject</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
