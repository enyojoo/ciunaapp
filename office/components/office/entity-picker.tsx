"use client"
import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface Option { id: string; label: string; sub?: string }

/** Pick one thing by typing its name. Shows the chosen name (not its id) with a clear button. */
export function EntityPicker({ label, value, onChange, search, placeholder }: {
  label: string
  value: Option | null
  onChange: (v: Option | null) => void
  search: (q: string) => Promise<Option[]>
  placeholder?: string
}) {
  const [text, setText] = useState("")
  const [options, setOptions] = useState<Option[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)

  useEffect(() => {
    const term = text.trim()
    if (term.length < 2) { setOptions([]); setLoading(false); return }
    const id = ++seq.current
    setLoading(true)
    const t = setTimeout(async () => {
      const r = await search(term).catch(() => [] as Option[])
      if (id !== seq.current) return
      setOptions(r); setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className="relative space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {value ? (
        <div className="flex h-10 w-52 items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm">
          <span className="truncate">{value.label}</span>
          <button type="button" aria-label={`Clear ${label}`} className="text-muted-foreground hover:text-foreground" onClick={() => { onChange(null); setText("") }}><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <Input
          className="w-52"
          value={text}
          placeholder={placeholder ?? "Type a name"}
          onChange={(e) => { setText(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-label={label}
        />
      )}
      {!value && open && text.trim().length >= 2 ? (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-56 w-64 overflow-auto rounded-md border bg-popover p-1 text-sm shadow-md">
          {loading && options.length === 0 ? <li className="px-2 py-1.5 text-muted-foreground">Searching...</li> : null}
          {!loading && options.length === 0 ? <li className="px-2 py-1.5 text-muted-foreground">No match.</li> : null}
          {options.map((o) => (
            <li key={o.id}>
              <button type="button" role="option" aria-selected={false} className="w-full rounded px-2 py-1.5 text-left hover:bg-accent" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(o); setOpen(false); setText("") }}>
                <span className="block truncate">{o.label}</span>
                {o.sub ? <span className="block truncate text-xs text-muted-foreground">{o.sub}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
