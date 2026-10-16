"use client"
import * as React from "react"
import { Button } from "./button"
import { Chip } from "./chip"
import { Textarea } from "./form"
import { Sheet } from "./overlay"
import { useUiStrings } from "./strings"

/** Asks for a reason before a consequential action. A chip or free text is required; picking a chip fills the text, which stays editable. */
export function ReasonDialog({ open, onOpenChange, title, description, reasons = [], confirmLabel, cancelLabel = "Cancel", textLabel = "Reason", destructive, busy, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; reasons?: string[]; confirmLabel: string; cancelLabel?: string; textLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: (reason: string) => void }) {
  const strings = useUiStrings()
  const [text, setText] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  React.useEffect(() => { if (open) { setText(""); setTouched(false) } }, [open])
  const reason = text.trim()
  const missing = touched && !reason
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>{cancelLabel}</Button>
          <Button variant={destructive ? "destructive" : "default"} busy={busy} onClick={() => { setTouched(true); if (reason) onConfirm(reason) }}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="space-y-3">
        {reasons.length ? (
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => <Chip key={r} selected={text === r} onClick={() => setText(r)}>{r}</Chip>)}
          </div>
        ) : null}
        <label className="block text-sm font-semibold text-ink" htmlFor="reason-dialog-text">{textLabel}</label>
        <Textarea id="reason-dialog-text" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={missing} aria-required rows={3} />
        {missing ? <p role="alert" className="text-sm text-destructive-text">{strings.required}</p> : null}
      </div>
    </Sheet>
  )
}
