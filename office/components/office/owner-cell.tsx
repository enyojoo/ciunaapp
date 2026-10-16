"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api, jsonBody } from "@/components/merchants/merchant-lib"

export interface Owner { id: string; name: string | null; email: string | null; claimed_at: string | null; mine: boolean }

export const ownerLabel = (o: Owner | null | undefined) => (o ? (o.mine ? "You" : o.name || o.email || "Teammate") : "Unassigned")

/**
 * Owner of a queue item with Claim / Release. A claim that loses the race shows who got it (409) and refreshes.
 * `canClaim` hides the buttons for roles that may not work the queue.
 */
export function OwnerCell({ owner, claimUrl, canClaim, onChanged, onError }: { owner: Owner | null; claimUrl: string; canClaim: boolean; onChanged: () => void; onError?: (m: string) => void }) {
  const [busy, setBusy] = useState(false)
  const act = async (release: boolean) => {
    setBusy(true)
    const r = await api(claimUrl, jsonBody("POST", release ? { release: true } : {}))
    setBusy(false)
    onChanged() // refresh first: the list shows the real owner, then the message about a lost race stays on screen
    if (!r.ok) onError?.(r.code === "CLAIMED_BY_OTHER" ? "Someone else claimed this first. The list was refreshed." : r.error)
  }
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <span className={owner ? "text-sm" : "text-sm text-muted-foreground"}>{ownerLabel(owner)}</span>
      {canClaim && !owner ? <Button size="sm" variant="outline" disabled={busy} onClick={() => act(false)}>Claim</Button> : null}
      {canClaim && owner?.mine ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(true)}>Release</Button> : null}
    </div>
  )
}
