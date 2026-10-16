"use client"
import * as React from "react"
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react"
import { cn } from "./cn"

export type FileDropState = "idle" | "dragging" | "uploading" | "error" | "done"

export interface FileDropProps {
  onFiles: (files: File[]) => void
  /** Accepted MIME types; default PDF, JPG, PNG. */
  accept?: string[]
  maxBytes?: number
  multiple?: boolean
  /** Upload state driven by the caller; "dragging" is handled internally. */
  state?: Exclude<FileDropState, "dragging">
  progress?: number
  /** Name of the uploaded file, shown with a remove button in the done state. */
  fileName?: string
  onRemove?: () => void
  label?: string
  hint?: string
  /** Error text from the caller; local validation errors use `messages`. */
  error?: string
  messages?: { tooLarge: (name: string, maxMb: number) => string; wrongType: (name: string) => string; remove: string }
  disabled?: boolean
  className?: string
}

const DEFAULT_ACCEPT = ["application/pdf", "image/jpeg", "image/png"]
const DEFAULT_MESSAGES = {
  tooLarge: (name: string, maxMb: number) => `${name} is larger than ${maxMb} MB.`,
  wrongType: (name: string) => `${name} must be a PDF, JPG or PNG.`,
  remove: "Remove",
}

/** Drop zone for documents and images. Validates type and size before handing files to the caller. */
export function FileDrop({ onFiles, accept = DEFAULT_ACCEPT, maxBytes = 10 * 1024 * 1024, multiple, state = "idle", progress, fileName, onRemove, label = "Drop a file here or choose one", hint = "PDF, JPG or PNG, up to 10 MB", error, messages = DEFAULT_MESSAGES, disabled, className }: FileDropProps) {
  const [dragging, setDragging] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const shown: FileDropState = dragging ? "dragging" : localError || error ? "error" : state
  const message = localError ?? error

  function take(list: FileList | null) {
    if (!list || list.length === 0) return
    const ok: File[] = []
    for (const f of Array.from(list)) {
      if (!accept.includes(f.type)) { setLocalError(messages.wrongType(f.name)); return }
      if (f.size > maxBytes) { setLocalError(messages.tooLarge(f.name, Math.round(maxBytes / 1024 / 1024))); return }
      ok.push(f)
    }
    setLocalError(null)
    onFiles(multiple ? ok : ok.slice(0, 1))
  }

  const Icon = shown === "done" ? CheckCircle2 : shown === "uploading" ? Loader2 : shown === "error" ? AlertCircle : UploadCloud
  return (
    <div className={className}>
      <div
        data-state={shown}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) take(e.dataTransfer.files) }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          shown === "dragging" && "border-primary bg-primary-tint",
          shown === "error" && "border-destructive-text bg-destructive-surface",
          shown === "done" && "border-success-text/40 bg-success-surface",
          (shown === "idle" || shown === "uploading") && "border-input-edge bg-white",
          disabled && "opacity-50",
        )}
      >
        <Icon className={cn("size-7", shown === "uploading" && "animate-spin", shown === "error" ? "text-destructive-text" : shown === "done" ? "text-success-text" : "text-muted")} aria-hidden />
        {shown === "done" && fileName ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-success-text">
            <span className="truncate">{fileName}</span>
            {onRemove ? (
              <button type="button" onClick={onRemove} aria-label={messages.remove} className="flex size-8 items-center justify-center rounded-full hover:bg-white/60">
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <button type="button" disabled={disabled || state === "uploading"} onClick={() => inputRef.current?.click()} className="min-h-11 rounded-xl px-3 text-[15px] font-semibold text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              {label}
            </button>
            <p className="text-xs text-muted">{hint}</p>
          </>
        )}
        {shown === "uploading" && typeof progress === "number" ? (
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-1.5 w-40 overflow-hidden rounded-full bg-neutral-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        ) : null}
        <input ref={inputRef} type="file" hidden accept={accept.join(",")} multiple={multiple} onChange={(e) => { take(e.target.files); e.target.value = "" }} />
      </div>
      {message ? <p role="alert" className="mt-1.5 text-sm text-destructive-text">{message}</p> : null}
    </div>
  )
}
