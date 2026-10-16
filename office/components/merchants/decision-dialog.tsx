"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { REJECTION_TEMPLATES } from "./merchant-lib"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  destructive?: boolean
  minLength?: number
  templates?: string[] | false
  busy?: boolean
  error?: string | null
  onConfirm: (reason: string) => void
}

/** Reason dialog. The reason is shown to the merchant verbatim, so templates are quick-fill chips. */
export function DecisionDialog({
  open, onOpenChange, title, description, confirmLabel, destructive, minLength = 5, templates, busy, error, onConfirm,
}: Props) {
  const [reason, setReason] = useState("")
  useEffect(() => { if (open) setReason("") }, [open])
  const chips = templates === false ? [] : templates || REJECTION_TEMPLATES
  const valid = reason.trim().length >= minLength
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description || "The merchant sees this reason exactly as written."}</DialogDescription>
        </DialogHeader>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReason(t)}
                className="rounded-full border px-3 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Reason"
          autoFocus
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && valid && !busy) onConfirm(reason.trim()) }}
        />
        {error && <p className="text-sm text-destructive-text" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            className={destructive ? undefined : "bg-primary text-primary-foreground"}
            disabled={!valid || busy}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
