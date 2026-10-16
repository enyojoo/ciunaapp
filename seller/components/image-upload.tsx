"use client"
import * as React from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { cn } from "@ciuna/ui-web"
import { uploadFile, ApiError } from "@/lib/api"
import { useErrorText, useT } from "@/lib/i18n"

/** One image, uploaded straight to storage. Shows the current image, replace and remove. 4:3 by default. */
export function ImageUpload({ value, onChange, folder, label, aspect = "aspect-[4/3]", className }: { value: string | null; onChange: (url: string | null) => void; folder: string; label: string; aspect?: string; className?: string }) {
  const { t } = useT()
  const errText = useErrorText()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const res = await uploadFile(file, "image", folder)
      onChange(res.url)
    } catch (e) {
      setError(errText(e instanceof ApiError ? e.code : undefined))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <div className={cn("relative overflow-hidden rounded-2xl border border-dashed border-input-edge bg-white", aspect)}>
        {value ? <img src={value} alt="" className="size-full object-cover" /> : null}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} aria-label={label} className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-semibold text-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", value ? "bg-ink/0 opacity-0 hover:bg-ink/40 hover:text-white hover:opacity-100 focus-visible:opacity-100" : "hover:bg-neutral-surface")}>
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {busy ? t("state.loading") : value ? t("image.replace") : label}
        </button>
        {value && !busy ? (
          <button type="button" onClick={() => onChange(null)} aria-label={t("action.remove")} className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-white/95 text-destructive-text shadow">
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      {error ? <p role="alert" className="mt-1.5 text-sm text-destructive-text">{error}</p> : null}
    </div>
  )
}
