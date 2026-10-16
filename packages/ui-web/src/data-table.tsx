"use client"
import * as React from "react"
import { cn } from "./cn"
import { Skeleton } from "./surface"

export interface DataColumn<T> {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Money and counts: right-aligned, tabular figures. */
  align?: "left" | "right"
  className?: string
}

/** Dense list with a sticky header, row click, loading skeleton rows and an empty state. Wrap in a scroll container for height. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, loading, loadingRows = 6, empty, error, className, maxHeight }: { columns: DataColumn<T>[]; rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; loading?: boolean; loadingRows?: number; empty?: React.ReactNode; error?: React.ReactNode; className?: string; maxHeight?: string }) {
  const align = (c: DataColumn<T>) => (c.align === "right" ? "text-right tabular-nums" : "text-left")
  return (
    <div className={cn("overflow-auto rounded-2xl border border-hairline bg-white", className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("sticky top-0 z-10 border-b border-hairline bg-neutral-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted", align(c), c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`sk${i}`} aria-hidden>
                  {columns.map((c) => (
                    <td key={c.key} className="border-b border-hairline px-4 py-3"><Skeleton className="h-4 w-full max-w-40" /></td>
                  ))}
                </tr>
              ))
            : error
              ? <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-destructive-text">{error}</td></tr>
              : rows.length === 0
                ? <tr><td colSpan={columns.length}>{empty ?? <p className="px-4 py-10 text-center text-muted">No results</p>}</td></tr>
                : rows.map((r) => (
                    <tr
                      key={rowKey(r)}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(r) } } : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      className={cn("border-b border-hairline last:border-b-0", onRowClick && "cursor-pointer outline-none hover:bg-neutral-surface focus-visible:bg-neutral-surface")}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-4 py-3 text-ink", align(c), c.className)}>{c.cell(r)}</td>
                      ))}
                    </tr>
                  ))}
        </tbody>
      </table>
    </div>
  )
}
