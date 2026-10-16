"use client"
import * as React from "react"
import Link from "next/link"
import { Download, FileUp } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, ProgressBar, useToast } from "@ciuna/ui-web"
import { api, ApiError } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { MAX_IMPORT_ROWS, mapImportRows, parseCsv, templateCsv, type ParsedImport } from "./csv"
import { categoriesFor, PRODUCTS_KEY } from "./shared"

interface Failure { line: number; title: string; reason: string }

export function BulkImport() {
  const { t } = useT()
  const errText = useErrorText()
  const toast = useToast()
  const { merchant } = useSeller()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = React.useState<ParsedImport | null>(null)
  const [fileName, setFileName] = React.useState("")
  const [readError, setReadError] = React.useState<string | null>(null)
  const [running, setRunning] = React.useState(false)
  const [done, setDone] = React.useState(0)
  const [created, setCreated] = React.useState(0)
  const [failures, setFailures] = React.useState<Failure[]>([])
  const [finished, setFinished] = React.useState(false)

  const currency = merchant?.default_currency ?? "USD"
  const categories = merchant?.service_line ? categoriesFor(merchant.service_line) : null
  const valid = parsed?.rows.filter((r) => r.payload) ?? []

  function downloadTemplate() {
    const blob = new Blob(["﻿" + templateCsv(currency, merchant?.service_line ?? null)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ciuna-products-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setReadError(null)
    setFinished(false)
    setFailures([])
    setCreated(0)
    setDone(0)
    try {
      if (file.size > 2_000_000) throw new Error("big")
      const res = mapImportRows(parseCsv(await file.text()), { defaultCurrency: currency, categories })
      setFileName(file.name)
      setParsed(res)
      if (res.missingColumns.length || res.rows.length === 0) setReadError(t("catalog.import.badFile"))
    } catch {
      setParsed(null)
      setReadError(t("catalog.import.badFile"))
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function run() {
    const queue = valid.slice()
    if (!queue.length) return
    setRunning(true)
    setFinished(false)
    setDone(0)
    setCreated(0)
    setFailures([])
    let next = 0
    const worker = async () => {
      while (next < queue.length) {
        const row = queue[next++]
        try {
          await api("/api/merchant/products", { method: "POST", json: row.payload })
          setCreated((c) => c + 1)
        } catch (e) {
          const reason = errText(e instanceof ApiError ? e.code : undefined)
          setFailures((f) => [...f, { line: row.line, title: row.payload?.title ?? "", reason }])
        } finally {
          setDone((d) => d + 1)
        }
      }
    }
    await Promise.all([worker(), worker(), worker()])
    invalidate(PRODUCTS_KEY)
    setRunning(false)
    setFinished(true)
    toast.show(t("catalog.import.finished"))
  }

  function reset() {
    setParsed(null)
    setFinished(false)
    setFailures([])
    setReadError(null)
  }

  const pct = valid.length ? Math.round((done / valid.length) * 100) : 0
  const headers = [t("catalog.import.col.row"), t("catalog.field.title"), t("catalog.field.category"), t("catalog.field.listPrice"), t("catalog.field.salePrice"), t("catalog.field.currency"), t("catalog.field.stock"), t("catalog.section.fulfilment"), t("catalog.import.col.status")]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={t("catalog.import.step1")} description={t("catalog.import.step1Hint", { max: MAX_IMPORT_ROWS })} />
        <CardBody className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" variant="secondary" size="lg" onClick={downloadTemplate}><Download />{t("catalog.import.template")}</Button>
          <Button type="button" size="lg" disabled={running} onClick={() => fileRef.current?.click()}><FileUp />{t("catalog.import.choose")}</Button>
          <p className="text-sm text-muted sm:ml-1">{t("catalog.import.fileHint")}</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-label={t("catalog.import.choose")} onChange={(e) => void onFile(e.target.files?.[0])} />
        </CardBody>
      </Card>

      {readError ? <Banner tone="destructive" title={readError} /> : null}

      {parsed && !readError ? (
        <Card>
          <CardHeader title={t("catalog.import.step2")} description={t("catalog.import.summary", { file: fileName, valid: valid.length, invalid: parsed.rows.length - valid.length })} />
          <CardBody className="space-y-4">
            {parsed.tooMany ? <Banner tone="warning" title={t("catalog.import.tooMany", { max: MAX_IMPORT_ROWS, total: parsed.total })} /> : null}
            {categories === null ? <Banner tone="neutral" title={t("catalog.import.lineUnknown")} /> : null}
            <ul className="space-y-2 md:hidden">
              {parsed.rows.map((r) => {
                const p = r.payload
                const get = (i: number) => r.raw[i] ?? ""
                const ok = r.errors.length === 0
                return (
                  <li key={r.line} className="rounded-xl border border-hairline p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-xs text-muted">{t("catalog.import.col.row")} {r.line}</p><p className="font-semibold text-ink">{p?.title ?? get(0)}</p></div>
                      <span className={ok ? "shrink-0 text-sm font-semibold text-success-text" : "shrink-0 text-sm font-semibold text-destructive-text"}>{ok ? t("catalog.import.ready") : t("catalog.import.problem")}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{[p?.category ?? get(2), p ? `${p.list_price} ${p.fixed_currency}` : get(3), p ? t(`catalog.mode.${p.fulfillment_mode}`) : get(7)].filter(Boolean).join(" · ")}</p>
                    {!ok ? <ul className="mt-1.5 space-y-0.5 text-sm text-destructive-text">{r.errors.map((c) => <li key={c} role="alert">{t(`errors.${c}`)}</li>)}</ul> : null}
                  </li>
                )
              })}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-hairline md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-neutral-surface text-xs font-semibold uppercase text-muted">
                  <tr>{headers.map((h) => <th key={h} scope="col" className="px-3 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => {
                    const p = r.payload
                    const get = (i: number) => r.raw[i] ?? ""
                    return (
                      <tr key={r.line} className="border-t border-hairline align-top">
                        <td className="px-3 py-2.5 tabular-nums text-muted">{r.line}</td>
                        <td className="px-3 py-2.5 font-medium text-ink">{p?.title ?? get(0)}</td>
                        <td className="px-3 py-2.5">{p?.category ?? get(2)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{p?.list_price ?? get(3)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{p ? p.sale_price ?? "" : get(4)}</td>
                        <td className="px-3 py-2.5">{p?.fixed_currency ?? get(5)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{p ? p.stock_quantity ?? t("catalog.stock.unlimited") : get(6)}</td>
                        <td className="px-3 py-2.5">{p ? t(`catalog.mode.${p.fulfillment_mode}`) : get(7)}</td>
                        <td className="px-3 py-2.5">
                          {r.errors.length ? (
                            <ul className="space-y-0.5 text-destructive-text">{r.errors.map((c) => <li key={c} role="alert">{t(`errors.${c}`)}</li>)}</ul>
                          ) : (
                            <span className="font-medium text-success-text">{t("catalog.import.ready")}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {running || finished ? (
              <ProgressBar value={done} max={valid.length || 1} label={t("catalog.import.step3")} valueText={`${t("catalog.import.progress", { done, total: valid.length })} · ${pct}%`} />
            ) : null}

            {finished ? (
              <div className="space-y-3">
                <Banner tone={failures.length ? "warning" : "success"} title={t("catalog.import.result", { created, failed: failures.length })}>
                  {t("catalog.import.draftNote")}
                </Banner>
                {failures.length ? (
                  <ul className="space-y-1 text-sm">
                    {failures.sort((a, b) => a.line - b.line).map((f) => <li key={f.line} className="text-destructive-text">{t("catalog.import.failedRow", { line: f.line, title: f.title, reason: f.reason })}</li>)}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {finished ? (
                <>
                  <Button type="button" size="lg" variant="secondary" onClick={reset}>{t("catalog.import.another")}</Button>
                  <Button asChild size="lg"><Link href="/catalog">{t("catalog.import.viewCatalog")}</Link></Button>
                </>
              ) : (
                <Button type="button" size="lg" busy={running} disabled={valid.length === 0} onClick={() => void run()}>{t("catalog.import.start", { n: valid.length })}</Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
