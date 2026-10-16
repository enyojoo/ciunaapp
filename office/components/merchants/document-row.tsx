"use client"

import { ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MerchantStatusBadge } from "./merchant-status-badge"
import { formatDate, formatDateTime } from "./merchant-lib"

export interface MerchantDocument {
  id: string
  kind: string
  file_name?: string | null
  status: string
  expires_at?: string | null
  reviewed_at?: string | null
  reason?: string | null
  created_at: string
  url?: string | null
}

export function DocumentRow({
  doc, label, canReview, busy, onApprove, onReject,
}: {
  doc: MerchantDocument
  label?: string
  canReview: boolean
  busy?: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const expired = doc.expires_at && new Date(doc.expires_at).getTime() < Date.now()
  return (
    <div className="flex items-start gap-3 py-3">
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label || doc.kind}</span>
          <MerchantStatusBadge status={doc.status} />
          {expired && <span className="text-xs font-medium text-destructive-text">Expired</span>}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {doc.file_name || "File"} {"•"} uploaded {formatDateTime(doc.created_at)}
          {doc.expires_at ? ` • expires ${formatDate(doc.expires_at)}` : ""}
        </p>
        {doc.reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {doc.reason}</p>}
        {doc.reviewed_at && <p className="text-xs text-muted-foreground">Reviewed {formatDateTime(doc.reviewed_at)}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {doc.url && (
          <Button asChild variant="outline" size="sm">
            <a href={doc.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" />Open</a>
          </Button>
        )}
        {canReview && doc.status !== "approved" && (
          <Button size="sm" className="bg-primary text-primary-foreground" disabled={busy} onClick={onApprove}>Approve</Button>
        )}
        {canReview && doc.status !== "rejected" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>Reject</Button>
        )}
      </div>
    </div>
  )
}
