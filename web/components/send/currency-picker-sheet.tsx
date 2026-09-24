"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  currenciesForReceivePicker,
  currenciesForSendPicker,
} from "@ciuna/shared"
import type { Currency } from "@/types"
import { cn } from "@/lib/utils"

/** Scroll area height so ~3 currency rows show in {@link CurrencyPickerPopover}; rest scrolls. */
const POPOVER_CURRENCY_LIST_MAX_H = "max-h-[12.5rem]"

/** Desktop / tablet popover trigger (md+) */
export const CURRENCY_PICKER_TRIGGER_CLASSES =
  "inline-flex min-h-11 min-w-[5.5rem] shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent active:bg-accent/80"

/** Mobile-only trigger (paired with CurrencyPickerSheet; smaller flag + code) */
const CURRENCY_PICKER_TRIGGER_CLASSES_MOBILE =
  "inline-flex min-h-9 min-w-[4.25rem] shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent active:bg-accent/80"

function currencyFlagBoxSize(size: "default" | "compact") {
  const height = size === "compact" ? 20 : 24
  const width = Math.round(height * (4 / 3))
  return { height, width }
}

export function CurrencyFlagIcon({
  currency,
  size = "default",
}: {
  currency: Currency
  size?: "default" | "compact"
}) {
  const { height, width } = currencyFlagBoxSize(size)
  const iconBox = cn(
    "shrink-0 overflow-hidden rounded-[3px] border border-border/30 [&_svg]:block [&_svg]:h-full [&_svg]:w-full",
  )

  if (!currency.flag) return null

  if (currency.flag.startsWith("<svg")) {
    return (
      <div
        className={iconBox}
        style={{ width, height }}
        dangerouslySetInnerHTML={{ __html: currency.flag }}
      />
    )
  }

  if (currency.flag.startsWith("http") || currency.flag.startsWith("/")) {
    return (
      <img
        src={currency.flag || "/placeholder.svg"}
        alt=""
        width={width}
        height={height}
        className={cn(iconBox, "object-cover")}
      />
    )
  }

  return (
    <span className={cn("font-medium", size === "compact" ? "text-xs leading-none" : "text-sm")}>
      {currency.code}
    </span>
  )
}

function useCurrencySearchFilter(
  currencies: Currency[],
  type: "send" | "receive",
  search: string,
  otherCurrency: string,
) {
  return useMemo(() => {
    let list =
      type === "send"
        ? currenciesForSendPicker(currencies, otherCurrency)
        : currenciesForReceivePicker(currencies, otherCurrency)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      )
    }
    return list
  }, [currencies, type, search, otherCurrency])
}

function codesEqual(a: string, b: string) {
  return a.trim().toUpperCase() === b.trim().toUpperCase()
}

/** Same rows for sheet + popover: optional title, search (aligned icon), scrollable list */
function CurrencyPickerPanel({
  title,
  search,
  onSearchChange,
  filtered,
  selectedCurrency,
  onPick,
  listClassName,
  listOpen,
}: {
  /** When omitted or empty, no heading is shown (send flow uses search-only chrome). */
  title?: string
  search: string
  onSearchChange: (v: string) => void
  filtered: Currency[]
  selectedCurrency: string
  onPick: (code: string) => void
  listClassName?: string
  /** When true, scroll the selected row into view (popover / sheet just opened). */
  listOpen?: boolean
}) {
  const showTitle = Boolean(title?.trim())
  const searchId = useId()
  const selectedRowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!listOpen || !selectedCurrency.trim()) return
    let cancelled = false
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          selectedRowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
        }
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [listOpen, selectedCurrency, filtered])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "sticky top-0 z-20 shrink-0 border-b border-border bg-background px-4 pb-3 pt-3 text-left",
        )}
      >
        {showTitle ? (
          <h2 className="text-base font-semibold leading-none">{title}</h2>
        ) : null}
        <div className={cn("relative", showTitle && "mt-3")}>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            type="search"
            name={`currency-filter-${searchId.replace(/:/g, "")}`}
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
            inputMode="search"
            enterKeyHint="search"
            aria-autocomplete="none"
            data-1p-ignore="true"
            data-lpignore="true"
            data-bwignore="true"
            data-form-type="other"
          />
        </div>
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
          listClassName,
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filtered.length > 0 ? (
          <ul className="pb-[env(safe-area-inset-bottom,0px)]">
            {filtered.map((currency) => {
              const isSelected = codesEqual(selectedCurrency, currency.code)
              return (
                <li key={currency.code} className="border-b border-border last:border-0">
                  <button
                    ref={isSelected ? selectedRowRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onPick(currency.code)}
                    className={cn(
                      "touch-manipulation flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-accent active:bg-accent/80",
                      isSelected &&
                        "bg-primary/[0.09] shadow-sm ring-2 ring-inset ring-primary/45 hover:bg-primary/[0.12]",
                    )}
                  >
                    <CurrencyFlagIcon currency={currency} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{currency.code}</div>
                      <div className="truncate text-sm text-muted-foreground">{currency.name}</div>
                    </div>
                    {isSelected ? (
                      <Check
                        className="h-5 w-5 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <span className="h-5 w-5 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No currencies found</div>
        )}
      </div>
    </div>
  )
}

export function CurrencyPickerTrigger({
  selectedCurrency,
  onOpen,
  currencies,
  pickerEnabled,
  type,
  otherCurrency = "",
}: {
  selectedCurrency: string
  onOpen: () => void
  currencies: Currency[]
  pickerEnabled?: boolean
  type?: "send" | "receive"
  otherCurrency?: string
}) {
  const resolvedPickerEnabled = useMemo(() => {
    if (pickerEnabled != null) return pickerEnabled
    if (!type) return true
    const list =
      type === "send"
        ? currenciesForSendPicker(currencies, otherCurrency)
        : currenciesForReceivePicker(currencies, otherCurrency)
    return list.length > 1
  }, [pickerEnabled, type, currencies, otherCurrency])

  const selected = currencies.find((c) => codesEqual(c.code, selectedCurrency))
  const inner = (
    <>
      {selected && <CurrencyFlagIcon currency={selected} size="compact" />}
      <span>{selected?.code ?? selectedCurrency}</span>
      {resolvedPickerEnabled ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
    </>
  )
  if (!resolvedPickerEnabled) {
    return (
      <span className={cn(CURRENCY_PICKER_TRIGGER_CLASSES_MOBILE, "cursor-default")}>{inner}</span>
    )
  }
  return (
    <button type="button" onClick={onOpen} className={CURRENCY_PICKER_TRIGGER_CLASSES_MOBILE}>
      {inner}
    </button>
  )
}

export function isCurrencyPickerEnabled(
  currencies: Currency[],
  type: "send" | "receive",
  otherCurrency: string,
): boolean {
  const list =
    type === "send"
      ? currenciesForSendPicker(currencies, otherCurrency)
      : currenciesForReceivePicker(currencies, otherCurrency)
  return list.length > 1
}

export function CurrencyPickerSheet({
  open,
  onOpenChange,
  selectedCurrency,
  onSelect,
  currencies,
  type,
  title,
  otherCurrency = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCurrency: string
  onSelect: (code: string) => void
  currencies: Currency[]
  type: "send" | "receive"
  title?: string
  /** Opposite lane currency — excluded from this picker (send vs receive). */
  otherCurrency?: string
}) {
  const [search, setSearch] = useState("")
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  /** Keep sheet bottom clear of the iOS keyboard (visual viewport). */
  useEffect(() => {
    if (!open) {
      setKeyboardInset(0)
      return
    }
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardInset(hidden)
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [open])

  const filtered = useCurrencySearchFilter(currencies, type, search, otherCurrency)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent
        className={cn(
          "max-h-[min(88vh,820px)] flex-col gap-0 overflow-hidden p-0",
          "currency-picker-vaul-drawer",
        )}
        style={
          keyboardInset > 0
            ? {
                paddingBottom: `calc(${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
              }
            : undefined
        }
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CurrencyPickerPanel
            title={title}
            search={search}
            onSearchChange={setSearch}
            filtered={filtered}
            selectedCurrency={selectedCurrency}
            listOpen={open}
            onPick={(code) => {
              onOpenChange(false)
              queueMicrotask(() => onSelect(code))
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * Tablet/desktop: anchored popover with the same search + list UI as mobile (not a native Select).
 * Mobile: use {@link CurrencyPickerSheet} + {@link CurrencyPickerTrigger}.
 */
export function CurrencyPickerPopover({
  selectedCurrency,
  onSelect,
  currencies,
  type,
  title,
  otherCurrency = "",
}: {
  selectedCurrency: string
  onSelect: (code: string) => void
  currencies: Currency[]
  type: "send" | "receive"
  title?: string
  otherCurrency?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  const filtered = useCurrencySearchFilter(currencies, type, search, otherCurrency)
  const selected = currencies.find((c) => codesEqual(c.code, selectedCurrency))
  const pickerOptions = useMemo(
    () =>
      type === "send"
        ? currenciesForSendPicker(currencies, otherCurrency)
        : currenciesForReceivePicker(currencies, otherCurrency),
    [currencies, type, otherCurrency],
  )
  const pickerEnabled = pickerOptions.length > 1

  if (!pickerEnabled) {
    return (
      <span className={cn(CURRENCY_PICKER_TRIGGER_CLASSES, "cursor-default")}>
        {selected && <CurrencyFlagIcon currency={selected} />}
        <span>{selected?.code ?? selectedCurrency}</span>
      </span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={CURRENCY_PICKER_TRIGGER_CLASSES}>
          {selected && <CurrencyFlagIcon currency={selected} />}
          <span>{selected?.code ?? selectedCurrency}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="flex max-h-[min(calc(100vh-6rem),28rem)] min-h-0 w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] flex-col overflow-hidden p-0"
      >
        <CurrencyPickerPanel
          title={title}
          search={search}
          onSearchChange={setSearch}
          filtered={filtered}
          selectedCurrency={selectedCurrency}
          listOpen={open}
          onPick={(code) => {
            onSelect(code)
            setOpen(false)
          }}
          listClassName={POPOVER_CURRENCY_LIST_MAX_H}
        />
      </PopoverContent>
    </Popover>
  )
}
