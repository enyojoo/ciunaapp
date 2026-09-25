"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ExpertServiceScheduleEditor } from "@/components/experts/expert-service-schedule-editor"
import { officeFetch } from "@/lib/api-client"
import { useOfficeData } from "@/hooks/use-office-data"
import { formatCurrencySymbolOnly } from "@/utils/currency"

type ExpertProfilePick = { id: string; display_name: string; slug: string | null }

type ExpertServiceRow = {
  id: string
  expert_profile_id: string
  title: string
  short_description: string | null
  fulfillment_type?: string | null
  sort_order: number
  is_published: boolean
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  package_label: string | null
  default_duration_minutes?: number | null
  min_session_minutes?: number | null
  max_session_minutes?: number | null
  updated_at: string
  expert_profile: ExpertProfilePick | null
  upcoming_slots?: number
}

function pricingSummary(s: ExpertServiceRow): string {
  if (s.pricing_type === "quote") return "Quote"
  if (s.pricing_type === "hourly" && s.hourly_rate != null && s.hourly_currency)
    return `${formatCurrencySymbolOnly(Number(s.hourly_rate), s.hourly_currency)}/hr`
  if (s.pricing_type === "fixed" && s.fixed_amount != null && s.fixed_currency)
    return formatCurrencySymbolOnly(Number(s.fixed_amount), s.fixed_currency)
  return s.pricing_type
}

export function OfficeExpertServicesView() {
  const { data: officeData } = useOfficeData()
  const currencyList = useMemo(() => {
    const raw = officeData?.currencies?.filter((c: { code?: string; status?: string }) => c?.code && c.status !== "inactive") ?? []
    return raw.length ? raw : [{ code: "USD", name: "US Dollar", flag_svg: "" }]
  }, [officeData])

  const [services, setServices] = useState<ExpertServiceRow[]>([])
  const [profiles, setProfiles] = useState<ExpertProfilePick[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [fulfillmentType, setFulfillmentType] = useState("online")
  const [sortOrder, setSortOrder] = useState("0")
  const [pub, setPub] = useState(false)
  const [pricingType, setPricingType] = useState("quote")
  const [hourlyRate, setHourlyRate] = useState("")
  const [hourlyCur, setHourlyCur] = useState("USD")
  const [fixedAmt, setFixedAmt] = useState("")
  const [fixedCur, setFixedCur] = useState("USD")
  const [packageLabel, setPackageLabel] = useState("")
  const [defaultDur, setDefaultDur] = useState("")
  const [profileIdDraft, setProfileIdDraft] = useState("")

  const loadProfiles = useCallback(async () => {
    const res = await officeFetch("/api/admin/expert/profiles")
    if (!res.ok) return
    const j = await res.json()
    const list = (j.profiles || []) as { id: string; display_name: string; slug: string | null }[]
    setProfiles(
      list.map((p) => ({
        id: p.id,
        display_name: String(p.display_name || ""),
        slug: p.slug != null ? String(p.slug) : null,
      })),
    )
  }, [])

  const loadServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await officeFetch("/api/admin/expert/services")
      if (!res.ok) throw new Error("load")
      const j = await res.json()
      setServices((j.services || []) as ExpertServiceRow[])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  const resetForm = () => {
    setActiveServiceId(null)
    setActiveProfileId(null)
    setTitle("")
    setShortDescription("")
    setFulfillmentType("online")
    setSortOrder("0")
    setPub(false)
    setPricingType("quote")
    setHourlyRate("")
    setHourlyCur("USD")
    setFixedAmt("")
    setFixedCur("USD")
    setPackageLabel("")
    setDefaultDur("")
    setProfileIdDraft("")
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (s: ExpertServiceRow) => {
    setActiveServiceId(s.id)
    setActiveProfileId(s.expert_profile_id)
    setProfileIdDraft(s.expert_profile_id)
    setTitle(s.title)
    setShortDescription(s.short_description ?? "")
    setFulfillmentType(s.fulfillment_type ?? "online")
    setSortOrder(String(s.sort_order ?? 0))
    setPub(Boolean(s.is_published))
    setPricingType(s.pricing_type || "quote")
    setHourlyRate(s.hourly_rate != null ? String(s.hourly_rate) : "")
    setHourlyCur(s.hourly_currency ?? "USD")
    setFixedAmt(s.fixed_amount != null ? String(s.fixed_amount) : "")
    setFixedCur(s.fixed_currency ?? "USD")
    setPackageLabel(s.package_label ?? "")
    setDefaultDur(s.default_duration_minutes != null ? String(s.default_duration_minutes) : "")
    setDialogOpen(true)
  }

  const submitDetails = async () => {
    const pid = activeProfileId || profileIdDraft
    if (!pid.trim()) {
      alert("Choose an expert profile.")
      return
    }
    if (!title.trim()) {
      alert("Title is required.")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        short_description: shortDescription.trim() || null,
        fulfillment_type: fulfillmentType,
        sort_order: Number(sortOrder) || 0,
        is_published: pub,
        pricing_type: pricingType,
        package_label: packageLabel.trim() || null,
        default_duration_minutes: defaultDur.trim() ? Number(defaultDur) : null,
      }
      if (pricingType === "hourly") {
        body.hourly_rate = Number(hourlyRate)
        body.hourly_currency = hourlyCur.trim().toUpperCase()
      }
      if (pricingType === "fixed") {
        body.fixed_amount = Number(fixedAmt)
        body.fixed_currency = fixedCur.trim().toUpperCase()
      }

      if (activeServiceId && activeProfileId) {
        const res = await officeFetch(`/api/admin/expert/profiles/${activeProfileId}/services/${activeServiceId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || "Save failed")
        }
      } else {
        const res = await officeFetch(`/api/admin/expert/profiles/${pid}/services`, {
          method: "POST",
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || "Create failed")
        }
        const j = await res.json()
        const svc = j.service as { id: string; expert_profile_id?: string }
        setActiveServiceId(svc.id)
        setActiveProfileId(String(svc.expert_profile_id || pid))
        setProfileIdDraft(String(svc.expert_profile_id || pid))
      }
      await loadServices()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const deleteService = async () => {
    if (!activeServiceId || !activeProfileId) return
    if (!confirm("Delete this service and its slots / schedule links?")) return
    const res = await officeFetch(`/api/admin/expert/profiles/${activeProfileId}/services/${activeServiceId}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      alert("Delete failed")
      return
    }
    setDialogOpen(false)
    resetForm()
    await loadServices()
  }

  const scheduleEditorServiceId = activeServiceId || ""

  const profileLabel = useMemo(() => {
    const id = activeProfileId || profileIdDraft
    const p = profiles.find((x) => x.id === id)
    return p?.display_name || "—"
  }, [profiles, activeProfileId, profileIdDraft])

  return (
    <OfficeDashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expert services</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadServices()} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={openCreate}>New service</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No services yet. Create an expert profile first, then add a service here (or from a profile page).
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expert</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.expert_profile?.display_name ?? "—"}
                        {s.expert_profile?.slug ? (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">/{s.expert_profile.slug}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{s.title}</TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">
                        {(s.fulfillment_type || "online").replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-xs">{pricingSummary(s)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.is_published ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                          {s.pricing_type === "quote" ? (
                            <Badge variant="outline">Not bookable online</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.is_published && s.pricing_type !== "quote" && (s.upcoming_slots ?? 0) === 0 ? (
                          <Badge variant="destructive">No slots</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {s.upcoming_slots ?? 0} upcoming
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o)
            if (!o) resetForm()
          }}
        >
          <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{activeServiceId ? "Edit expert service" : "New expert service"}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details &amp; pricing</TabsTrigger>
                <TabsTrigger value="schedule" disabled={!activeServiceId}>
                  Weekly availability
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Expert profile</Label>
                  <Select
                    value={activeProfileId || profileIdDraft || "__none__"}
                    onValueChange={(v) => {
                      if (activeServiceId) return
                      setProfileIdDraft(v === "__none__" ? "" : v)
                    }}
                    disabled={Boolean(activeServiceId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select…</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeProfileId || profileIdDraft ? (
                    <p className="text-xs text-muted-foreground">
                      Manual one-off slots:{" "}
                      <Link
                        href={`/experts/profiles/${activeProfileId || profileIdDraft}`}
                        className="text-primary underline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Open profile → Slots tab
                      </Link>
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Short description</Label>
                  <Textarea rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fulfillment</Label>
                  <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in_person">In person</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sort order</Label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                  </div>
                  <div className="flex items-end justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">Published</span>
                    <Switch
                      checked={pub}
                      onCheckedChange={setPub}
                      disabled={pricingType === "quote"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pricing type</Label>
                  <Select
                    value={pricingType}
                    onValueChange={(v) => {
                      setPricingType(v)
                      if (v === "quote") setPub(false)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="fixed">Fixed package</SelectItem>
                      <SelectItem value="quote">Quote (not bookable online)</SelectItem>
                    </SelectContent>
                  </Select>
                  {pricingType === "quote" ? (
                    <p className="text-xs text-muted-foreground">
                      Quote services stay draft and have no online payment CTA. Use hourly or fixed to publish.
                    </p>
                  ) : null}
                </div>
                {pricingType === "hourly" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Hourly rate</Label>
                      <Input type="number" min={0} step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={hourlyCur} onValueChange={setHourlyCur}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] overflow-y-auto">
                          {currencyList.map((c: { code: string; name?: string; flag_svg?: string }) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="inline-flex items-center gap-2">
                                {c.flag_svg ? (
                                  <span className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: c.flag_svg }} />
                                ) : null}
                                <span>{c.code}</span>
                                {c.name ? <span className="text-gray-500">— {c.name}</span> : null}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
                {pricingType === "fixed" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" min={0} step="0.01" value={fixedAmt} onChange={(e) => setFixedAmt(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={fixedCur} onValueChange={setFixedCur}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] overflow-y-auto">
                          {currencyList.map((c: { code: string; name?: string; flag_svg?: string }) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="inline-flex items-center gap-2">
                                {c.flag_svg ? (
                                  <span className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: c.flag_svg }} />
                                ) : null}
                                <span>{c.code}</span>
                                {c.name ? <span className="text-gray-500">— {c.name}</span> : null}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Package label</Label>
                      <Input value={packageLabel} onChange={(e) => setPackageLabel(e.target.value)} />
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>Default session length (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={defaultDur}
                    onChange={(e) => setDefaultDur(e.target.value)}
                    placeholder="Used when splitting schedule ranges"
                  />
                </div>
              </TabsContent>
              <TabsContent value="schedule" className="mt-4">
                {!activeServiceId ? (
                  <p className="text-sm text-muted-foreground">Save details first — then you can set weekly hours and regenerate slots.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Availability for <strong>{profileLabel}</strong> — service <strong>{title || "—"}</strong>
                    </p>
                    <ExpertServiceScheduleEditor serviceId={scheduleEditorServiceId} onScheduleSaved={() => void loadServices()} />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                {activeServiceId && activeProfileId ? (
                  <Button type="button" variant="destructive" size="sm" onClick={() => void deleteService()}>
                    Delete service
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                <Button type="button" onClick={() => void submitDetails()} disabled={saving}>
                  {saving ? "Saving…" : activeServiceId ? "Save details" : "Create service"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OfficeDashboardLayout>
  )
}
