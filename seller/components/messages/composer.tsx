"use client"
import * as React from "react"
import { Send } from "lucide-react"
import { Button, Textarea, cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { insertQuick, MAX_BODY, QUICK_REPLY_KEYS } from "./format"

/** Sticky above the bottom nav on phones. Cmd/Ctrl+Enter sends; Enter adds a line. */
export function Composer({ busy, disabled, error, onSend }: { busy: boolean; disabled: boolean; error?: string | null; onSend: (body: string) => Promise<boolean> }) {
  const { t } = useT()
  const [draft, setDraft] = React.useState("")
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const length = [...draft].length
  const empty = draft.trim().length === 0
  const over = length > MAX_BODY

  async function submit() {
    if (empty || over || busy || disabled) return
    if (await onSend(draft.trim())) setDraft("")
  }
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-white px-4 py-3 md:static md:z-auto md:rounded-2xl md:border md:p-3">
      <div className="mx-auto max-w-[1100px]">
        {!disabled ? (
          <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label={t("messages.quick.label")}>
            {QUICK_REPLY_KEYS.map((k) => (
              <button key={k} type="button" onClick={() => { setDraft((d) => insertQuick(d, t(k))); ref.current?.focus() }}
                className="min-h-10 shrink-0 rounded-full border border-hairline bg-neutral-surface px-3.5 text-sm font-medium text-ink outline-none hover:bg-primary-tint focus-visible:ring-[3px] focus-visible:ring-ring/50">
                {t(k)}
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p role="alert" className="mb-2 text-sm font-medium text-destructive-text">{error}</p> : null}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="chat-draft" className="sr-only">{t("messages.composer.label")}</label>
            <Textarea
              id="chat-draft" ref={ref} rows={2} value={draft} disabled={disabled}
              placeholder={t(disabled ? "messages.composer.closed" : "messages.composer.placeholder")}
              aria-invalid={over || undefined}
              className="max-h-40 min-h-12 resize-none"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void submit() } }}
            />
            {length > MAX_BODY - 200 ? <p className={cn("mt-1 text-xs", over ? "font-semibold text-destructive-text" : "text-muted")}>{length}/{MAX_BODY}</p> : null}
          </div>
          <Button size="lg" className="min-h-12" busy={busy} disabled={disabled || empty || over} onClick={() => void submit()}>
            <Send className="size-4" aria-hidden />
            {t("messages.send")}
          </Button>
        </div>
      </div>
    </div>
  )
}
