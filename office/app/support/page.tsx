"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, formatDateTime, jsonBody } from "@/components/merchants/merchant-lib"
import { usePermissions } from "@/lib/permissions"

type Status = "open" | "awaiting_customer" | "resolved"
interface Row {
  id: string
  public_id: string
  topic: string
  subject: string
  status: Status
  assigned_to: string | null
  agent_unread: number
  last_message_at: string
  last_message_preview: string | null
  customer: { name: string | null; email: string | null }
}
interface Message { id: number; sender_kind: "customer" | "agent" | "system"; body: string; created_at: string }
interface Thread { request: Row & { created_at: string; resolved_at: string | null }; messages: Message[] }

const TABS = [
  { value: "open", label: "Needs reply" },
  { value: "awaiting_customer", label: "Waiting for customer" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
]
const STATUS_LABEL: Record<Status, string> = { open: "Needs reply", awaiting_customer: "Waiting for customer", resolved: "Resolved" }
const STATUS_TONE: Record<Status, string> = {
  open: "bg-warning-surface text-warning-text",
  awaiting_customer: "bg-muted text-muted-foreground",
  resolved: "bg-success-surface text-success-text",
}
const MAX = 4000

export default function SupportPage() {
  const { can } = usePermissions()
  const canManage = can("support.manage")
  const [tab, setTab] = useState("open")
  const [assigned, setAssigned] = useState("all")
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadList = useCallback(async () => {
    const p = new URLSearchParams({ limit: "50" })
    if (tab !== "all") p.set("status", tab)
    if (assigned !== "all") p.set("assigned", assigned)
    if (q) p.set("q", q)
    const res = await api<{ requests: Row[]; total: number }>(`/api/admin/support?${p}`)
    if (res.ok) { setRows(res.data.requests); setTotal(res.data.total); setError(null) } else setError(res.error)
    setLoading(false)
  }, [tab, assigned, q])

  const loadThread = useCallback(async (id: string) => {
    const res = await api<Thread>(`/api/admin/support/${id}`)
    if (res.ok) { setThread(res.data); setThreadError(null) } else setThreadError(res.error)
  }, [])

  useEffect(() => { setLoading(true); void loadList() }, [loadList])
  useEffect(() => {
    const timer = setInterval(() => { void loadList(); if (selected) void loadThread(selected) }, 20000)
    return () => clearInterval(timer)
  }, [loadList, loadThread, selected])
  useEffect(() => { if (selected) { setThread(null); void loadThread(selected) } }, [selected, loadThread])
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [thread?.messages.length])

  async function send() {
    if (!selected || !reply.trim() || busy) return
    setBusy(true)
    setThreadError(null)
    const res = await api(`/api/admin/support/${selected}/messages`, jsonBody("POST", { body: reply.trim() }))
    setBusy(false)
    if (!res.ok) { setThreadError(res.error); return }
    setReply("")
    await Promise.all([loadThread(selected), loadList()])
  }

  async function patch(body: Record<string, unknown>) {
    if (!selected) return
    setBusy(true)
    setThreadError(null)
    const res = await api(`/api/admin/support/${selected}`, jsonBody("PATCH", body))
    setBusy(false)
    if (!res.ok) { setThreadError(res.error); return }
    await Promise.all([loadThread(selected), loadList()])
  }

  const r = thread?.request
  const over = [...reply].length > MAX

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Support requests</h1>
          <p className="text-sm text-muted-foreground">Customers write from the app. Reply here; the customer sees it in My requests.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>{TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
          </Tabs>
          <Select value={assigned} onValueChange={setAssigned}>
            <SelectTrigger className="w-40" aria-label="Assigned"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anyone</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search subject or reference" aria-label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p className="rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="max-h-[calc(100vh-18rem)] divide-y overflow-auto">
              {loading && rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p>}
              {!loading && rows.length === 0 && !error && <p className="p-6 text-center text-sm text-muted-foreground">No requests match.</p>}
              {rows.map((row) => (
                <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={`block w-full px-4 py-3 text-left hover:bg-muted/50 ${selected === row.id ? "bg-muted" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">{row.subject}</span>
                    {row.agent_unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="New message" />}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.customer.name || row.customer.email || "Customer"} · {row.public_id} · {row.topic}</div>
                  {row.last_message_preview && <div className="mt-1 truncate text-sm text-muted-foreground">{row.last_message_preview}</div>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(row.last_message_at)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">{total} {total === 1 ? "request" : "requests"}</div>
          </Card>

          <Card className="flex min-h-[28rem] flex-col">
            {!selected ? (
              <p className="m-auto p-6 text-sm text-muted-foreground">Pick a request to read it.</p>
            ) : !r ? (
              <p className="m-auto p-6 text-sm text-muted-foreground">{threadError || "Loading..."}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-3 border-b p-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{r.subject}</h2>
                    <p className="text-sm text-muted-foreground">{r.customer.name || "Customer"} {r.customer.email ? `· ${r.customer.email}` : ""} · {r.public_id} · {r.topic}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => patch({ assignTo: r.assigned_to ? null : "me" })}>{r.assigned_to ? "Unassign" : "Assign to me"}</Button>
                      {r.status !== "resolved" && <Button size="sm" disabled={busy} onClick={() => patch({ status: "resolved" })}>Resolve</Button>}
                    </div>
                  )}
                </div>
                <div className="max-h-[calc(100vh-30rem)] min-h-48 flex-1 space-y-3 overflow-auto p-4">
                  {thread!.messages.map((m) => m.sender_kind === "system" ? (
                    <p key={m.id} className="text-center text-xs font-medium text-muted-foreground">{m.body === "resolved" ? "Marked as resolved" : m.body} · {formatDateTime(m.created_at)}</p>
                  ) : (
                    <div key={m.id} className={`flex flex-col ${m.sender_kind === "agent" ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.sender_kind === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.body}</div>
                      <span className="mt-0.5 text-xs text-muted-foreground">{m.sender_kind === "agent" ? "Support" : "Customer"} · {formatDateTime(m.created_at)}</span>
                    </div>
                  ))}
                  <div ref={end} />
                </div>
                {threadError && <p className="mx-4 mb-2 rounded-md bg-destructive-surface px-3 py-2 text-sm text-destructive-text" role="alert">{threadError}</p>}
                {canManage ? (
                  <div className="space-y-2 border-t p-4">
                    <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" aria-label="Reply" />
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${over ? "font-semibold text-destructive-text" : "text-muted-foreground"}`}>{[...reply].length} / {MAX}</span>
                      <Button disabled={busy || !reply.trim() || over} onClick={send}>Send reply</Button>
                    </div>
                  </div>
                ) : (
                  <p className="border-t p-4 text-sm text-muted-foreground">Your role can read requests but not reply.</p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </OfficeDashboardLayout>
  )
}
