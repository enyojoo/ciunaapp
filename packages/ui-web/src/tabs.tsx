"use client"
import * as React from "react"
import { cn } from "./cn"
import { useUiStrings } from "./strings"

/** Segmented tabs with optional counts; scrolls horizontally on narrow screens. */
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: string; count?: number }>; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto rounded-2xl bg-neutral-surface p-1 [scrollbar-width:none]", className)}>
      {items.map((it) => {
        const active = it.value === value
        return (
          <button key={it.value} role="tab" aria-selected={active} type="button" onClick={() => onChange(it.value)} className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50", active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>
            {it.label}
            {typeof it.count === "number" && it.count > 0 ? <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold text-primary-foreground">{it.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export const LANGUAGE_LABELS: Record<string, string> = { en: "English", ru: "Русский", fr: "Français", es: "Español", zh: "中文", pt: "Português" }

/** Edit listing copy per language; the default language is required. */
export function LanguageTabs({ languages, defaultLanguage, active, onChange, filled }: { languages: string[]; defaultLanguage: string; active: string; onChange: (l: string) => void; filled?: Record<string, boolean> }) {
  const strings = useUiStrings()
  return (
    <div role="tablist" aria-label="Language" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {languages.map((l) => (
        <button key={l} role="tab" type="button" aria-selected={active === l} onClick={() => onChange(l)} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", active === l ? "border-primary bg-primary text-primary-foreground" : "border-input-edge bg-white text-ink")}>
          {LANGUAGE_LABELS[l] ?? l}
          {l === defaultLanguage ? <span className="text-xs font-medium opacity-80">· {strings.defaultLabel}</span> : filled?.[l] ? <span aria-label="filled" className="size-1.5 rounded-full bg-success" /> : null}
        </button>
      ))}
    </div>
  )
}
