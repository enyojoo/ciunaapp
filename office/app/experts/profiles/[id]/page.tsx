"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { normalizePublicSlug } from "@ciuna/shared"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ExpertServiceScheduleEditor } from "@/components/experts/expert-service-schedule-editor"
import { officeFetch } from "@/lib/api-client"
import { useOfficeData } from "@/hooks/use-office-data"
import { formatCurrencySymbolOnly } from "@/utils/currency"

type Profile = {
  id: string
  slug: string | null
  display_name: string
  headline: string | null
  bio: string | null
  is_published: boolean
  category: string
  image_url: string | null
  service_area: string | null
  meeting_hint: string | null
}

type Service = {
  id: string
  title: string
  short_description: string | null
  fulfillment_type?: string
  sort_order: number
  is_published: boolean
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  package_label: string | null
}

type Slot = {
  id: string
  slot_start: string
  slot_end: string
  status: string
  source?: string
}

function localInputToIso(local: string): string {
  return new Date(local).toISOString()
}

export default function OfficeExpertProfileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params?.id || "")

  const [tab, setTab] = useState("profile")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceDialog, setServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [savingService, setSavingService] = useState(false)

  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotDialog, setSlotDialog] = useState(false)
  const [slotStartLocal, setSlotStartLocal] = useState("")
  const [slotEndLocal, setSlotEndLocal] = useState("")
  const [savingSlot, setSavingSlot] = useState(false)
  const [slotSubTab, setSlotSubTab] = useState<"schedule" | "manual">("schedule")
  const [slugTouched, setSlugTouched] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await officeFetch(`/api/admin/expert/profiles/${id}`)
      if (res.status === 404) {
        setProfile(null)
        return
      }
      if (!res.ok) throw new Error("profile")
      const j = await res.json()
      setProfile(j.profile as Profile)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadServices = useCallback(async () => {
    if (!id) return
    setLoadingServices(true)
    try {
      const res = await officeFetch(`/api/admin/expert/profiles/${id}/services`)
      if (!res.ok) throw new Error("svc")
      const j = await res.json()
      const list = (j.services || []) as Service[]
      setServices(list)
      setSelectedServiceId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev
        return list[0]?.id ?? ""
      })
    } catch {
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }, [id])

  const loadSlots = useCallback(async () => {
    if (!selectedServiceId) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    try {
      const res = await officeFetch(`/api/admin/expert/services/${selectedServiceId}/slots`)
      if (!res.ok) throw new Error("slots")
      const j = await res.json()
      setSlots((j.slots || []) as Slot[])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedServiceId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (tab === "services" || tab === "slots") void loadServices()
  }, [tab, loadServices])

  useEffect(() => {
    if (tab !== "slots") return
    void loadSlots()
  }, [tab, loadSlots, selectedServiceId])

  const [form, setForm] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (profile) {
      setForm(profile)
      setSlugTouched(true)
    }
  }, [profile])

  const saveProfile = async () => {
    if (!id || !profile) return
    const slugNorm = normalizePublicSlug(String(form.slug ?? ""))
    if (!slugNorm) {
      alert("Please set a URL slug.")
      return
    }
    setSavingProfile(true)
    try {
      const res = await officeFetch(`/api/admin/expert/profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          display_name: form.display_name,
          slug: String(form.slug ?? "").trim() || undefined,
          headline: form.headline,
          bio: form.bio,
          category: form.category,
          image_url: form.image_url,
          service_area: form.service_area,
          meeting_hint: form.meeting_hint,
          is_published: form.is_published,
        }),
      })
      if (!res.ok) throw new Error("patch")
      await loadProfile()
    } finally {
      setSavingProfile(false)
    }
  }

  const openEditService = (s: Service) => {
    setEditingService(s)
    setServiceDialog(true)
  }

  const ServiceForm = () => {
    const { data: officeData } = useOfficeData()
    const currencyList = useMemo(() => {
      const raw = officeData?.currencies?.filter((c: { code?: string; status?: string }) => c?.code && c.status !== "inactive") ?? []
      return raw.length ? raw : [{ code: "USD", name: "US Dollar", flag_svg: "" }]
    }, [officeData])

    const [title, setTitle] = useState(editingService?.title ?? "")
    const [shortDescription, setShortDescription] = useState(editingService?.short_description ?? "")
    const [fulfillmentType, setFulfillmentType] = useState(editingService?.fulfillment_type ?? "online")
    const [sortOrder, setSortOrder] = useState(String(editingService?.sort_order ?? 0))
    const [pub, setPub] = useState(Boolean(editingService?.is_published))
    const [pricingType, setPricingType] = useState(editingService?.pricing_type ?? "quote")
    const [hourlyRate, setHourlyRate] = useState(editingService?.hourly_rate != null ? String(editingService.hourly_rate) : "")
    const [hourlyCur, setHourlyCur] = useState(editingService?.hourly_currency ?? "USD")
    const [fixedAmt, setFixedAmt] = useState(editingService?.fixed_amount != null ? String(editingService.fixed_amount) : "")
    const [fixedCur, setFixedCur] = useState(editingService?.fixed_currency ?? "USD")
    const [packageLabel, setPackageLabel] = useState(editingService?.package_label ?? "")

    const submit = async () => {
      setSavingService(true)
      try {
        const body: Record<string, unknown> = {
          title: title.trim() || "Service",
          short_description: shortDescription.trim() || null,
          fulfillment_type: fulfillmentType,
          sort_order: Number(sortOrder) || 0,
          is_published: pub,
          pricing_type: pricingType,
        }
        if (pricingType === "hourly") {
          body.hourly_rate = Number(hourlyRate)
          body.hourly_currency = hourlyCur.trim().toUpperCase()
        }
        if (pricingType === "fixed") {
          body.fixed_amount = Number(fixedAmt)
          body.fixed_currency = fixedCur.trim().toUpperCase()
          body.package_label = packageLabel.trim() || null
        }
        const url = editingService
          ? `/api/admin/expert/profiles/${id}/services/${editingService.id}`
          : `/api/admin/expert/profiles/${id}/services`
        const res = await officeFetch(url, {
          method: editingService ? "PATCH" : "POST",
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("svc save")
        setServiceDialog(false)
        await loadServices()
      } finally {
        setSavingService(false)
      }
    }

    return (
      <div className="space-y-3 py-2">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Short description</Label>
          <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} />
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
          <p className="text-xs text-muted-foreground">How this session is delivered.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="flex items-end justify-between rounded-md border p-3">
            <span className="text-sm font-medium">Published</span>
            <Switch checked={pub} onCheckedChange={setPub} disabled={pricingType === "quote"} />
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
              Quote services stay draft and have no online payment CTA.
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
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setServiceDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={savingService || !title.trim()}>
            {savingService ? "Saving…" : editingService ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </div>
    )
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm("Delete this service and all its slots?")) return
    const res = await officeFetch(`/api/admin/expert/profiles/${id}/services/${serviceId}`, { method: "DELETE" })
    if (res.ok) await loadServices()
  }

  const createSlot = async () => {
    if (!selectedServiceId || !slotStartLocal || !slotEndLocal) return
    setSavingSlot(true)
    try {
      const res = await officeFetch(`/api/admin/expert/services/${selectedServiceId}/slots`, {
        method: "POST",
        body: JSON.stringify({
          slot_start: localInputToIso(slotStartLocal),
          slot_end: localInputToIso(slotEndLocal),
        }),
      })
      if (!res.ok) throw new Error("slot")
      setSlotDialog(false)
      setSlotStartLocal("")
      setSlotEndLocal("")
      await loadSlots()
    } finally {
      setSavingSlot(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!selectedServiceId) return
    if (!confirm("Remove this offered time?")) return
    const res = await officeFetch(`/api/admin/expert/services/${selectedServiceId}/slots/${slotId}`, { method: "DELETE" })
    if (res.ok) await loadSlots()
  }

  const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId) ?? null, [services, selectedServiceId])

  if (!id) return null

  if (loading) {
    return (
      <OfficeDashboardLayout>
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </OfficeDashboardLayout>
    )
  }

  if (!profile) {
    return (
      <OfficeDashboardLayout>
        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">Profile not found.</p>
          <Button variant="outline" asChild>
            <Link href="/experts/profiles">Back to profiles</Link>
          </Button>
        </div>
      </OfficeDashboardLayout>
    )
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2" asChild>
              <Link href="/experts/profiles">← Profiles</Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!confirm("Delete this expert and all services, slots, and booking links?")) return
              void (async () => {
                const res = await officeFetch(`/api/admin/expert/profiles/${id}`, { method: "DELETE" })
                if (res.ok) router.push("/experts/profiles")
              })()
            }}
          >
            Delete profile
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="slots">Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Identity &amp; discovery</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl space-y-4">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input
                    value={form.display_name ?? ""}
                    onChange={(e) => {
                      const display_name = e.target.value
                      setForm((f) => ({
                        ...f,
                        display_name,
                        slug: slugTouched ? f.slug : normalizePublicSlug(display_name),
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL slug</Label>
                  <Input
                    value={form.slug ?? ""}
                    onChange={(e) => {
                      setSlugTouched(true)
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Public URL: /experts/{normalizePublicSlug(String(form.slug ?? "")) || "…"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={form.headline ?? ""} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={form.bio ?? ""} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={form.image_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.service_area ?? ""} onChange={(e) => setForm((f) => ({ ...f, service_area: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Shown on the public profile (no &quot;Area:&quot; prefix).</p>
                </div>
                <div className="space-y-2">
                  <Label>Meeting hint</Label>
                  <Textarea value={form.meeting_hint ?? ""} onChange={(e) => setForm((f) => ({ ...f, meeting_hint: e.target.value }))} rows={2} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-xs text-muted-foreground">Experts must be published to appear on the hub.</p>
                  </div>
                  <Switch checked={Boolean(form.is_published)} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
                </div>
                <Button onClick={() => void saveProfile()} disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingService(null)
                  setServiceDialog(true)
                }}
              >
                Add service
              </Button>
              <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingService ? "Edit service" : "New service"}</DialogTitle>
                  </DialogHeader>
                  {serviceDialog ? <ServiceForm key={editingService?.id ?? "new"} /> : null}
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingServices ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Fulfillment</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">
                            {(s.fulfillment_type || "online").replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.pricing_type === "hourly" && s.hourly_rate != null && s.hourly_currency
                              ? `${formatCurrencySymbolOnly(Number(s.hourly_rate), s.hourly_currency)}/hr`
                              : s.pricing_type === "fixed" && s.fixed_amount != null && s.fixed_currency
                                ? formatCurrencySymbolOnly(Number(s.fixed_amount), s.fixed_currency)
                                : s.pricing_type}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {s.is_published ? <Badge>On</Badge> : <Badge variant="secondary">Off</Badge>}
                              {s.pricing_type === "quote" ? (
                                <Badge variant="outline">Not bookable online</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Button size="sm" variant="outline" onClick={() => openEditService(s)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void deleteService(s.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slots" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offered times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={selectedServiceId || "__none__"} onValueChange={(v) => setSelectedServiceId(v === "__none__" ? "" : v)}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length === 0 ? <SelectItem value="__none__">No services</SelectItem> : null}
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void loadSlots()} disabled={!selectedServiceId || loadingSlots}>
                    Refresh slots list
                  </Button>
                </div>
                {!selectedServiceId ? (
                  <p className="text-sm text-muted-foreground">Add a service first, then pick it here to manage slots.</p>
                ) : (
                  <Tabs value={slotSubTab} onValueChange={(v) => setSlotSubTab(v as "schedule" | "manual")}>
                    <TabsList>
                      <TabsTrigger value="schedule">Weekly schedule</TabsTrigger>
                      <TabsTrigger value="manual">Manual slots</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule" className="mt-4">
                      <ExpertServiceScheduleEditor
                        serviceId={selectedServiceId}
                        onScheduleSaved={() => void loadSlots()}
                      />
                    </TabsContent>
                    <TabsContent value="manual" className="mt-4 space-y-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <Button type="button" disabled={!selectedServiceId} onClick={() => setSlotDialog(true)}>
                          Add one-off slot
                        </Button>
                        <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>New slot{selectedService ? ` — ${selectedService.title}` : ""}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                              <div className="space-y-2">
                                <Label>Start (local)</Label>
                                <Input type="datetime-local" value={slotStartLocal} onChange={(e) => setSlotStartLocal(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>End (local)</Label>
                                <Input type="datetime-local" value={slotEndLocal} onChange={(e) => setSlotEndLocal(e.target.value)} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSlotDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => void createSlot()} disabled={savingSlot || !slotStartLocal || !slotEndLocal}>
                                {savingSlot ? "Saving…" : "Create"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {loadingSlots ? (
                        <p className="text-sm text-muted-foreground">Loading slots…</p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No slots yet. Use weekly schedule or add manually.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slots.map((sl) => (
                              <TableRow key={sl.id}>
                                <TableCell className="whitespace-nowrap text-xs">{new Date(sl.slot_start).toLocaleString()}</TableCell>
                                <TableCell className="whitespace-nowrap text-xs">{new Date(sl.slot_end).toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{sl.source || "manual"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{sl.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    disabled={sl.status === "booked"}
                                    onClick={() => void deleteSlot(sl.id)}
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OfficeDashboardLayout>
  )
}
