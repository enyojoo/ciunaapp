"use client"

import { useEffect, useMemo, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react"
import { officeFetch } from "@/lib/api-client"
import { uploadHubVendorPhoto } from "@/lib/upload-hub-assets"
import { type HubMarketplaceLineSlug } from "@/lib/hub-office-paths"
import { useOfficeData } from "@/hooks/use-office-data"
import { OFFICE_UI_CACHE_TTL_MS } from "@/lib/office-ui-cache"
import { OFFICE_HUB_VENDORS_CACHE_KEY, clearOfficeHubProductsListCache } from "@/lib/hub-office-client-cache"

const HUB_VENDORS_CACHE_VERSION = 2

const DEFAULT_VENDOR_LOCATIONS = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Accra, Ghana",
  "Nairobi, Kenya",
  "London, UK",
  "Saint Petersburg, Russia",
  "Moscow, Russia",
  "United States",
  "Online / nationwide",
  "Other",
]

/** Display name for a community id ("latin_american" becomes "Latin American"). */
function communityName(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

type HubVendor = {
  id: string
  service_line_slug: string
  name: string
  slug: string
  photo_url: string | null
  short_bio: string | null
  location?: string | null
  /** Communities the store serves (set by the seller; read-only here). Ids from @ciuna/shared. */
  communities?: string[]
  is_published: boolean
  is_verified?: boolean
}

type HubVendorsDisk = {
  vendors: HubVendor[]
  timestamp: number
  v: number
}

function readHubVendorsCacheEntry(): { vendors: HubVendor[]; fresh: boolean } {
  if (typeof window === "undefined") return { vendors: [], fresh: false }
  try {
    const raw = localStorage.getItem(OFFICE_HUB_VENDORS_CACHE_KEY)
    if (!raw) return { vendors: [], fresh: false }
    const parsed = JSON.parse(raw) as HubVendorsDisk
    if (parsed.v !== HUB_VENDORS_CACHE_VERSION) {
      try {
        localStorage.removeItem(OFFICE_HUB_VENDORS_CACHE_KEY)
      } catch {
        /* ignore */
      }
      return { vendors: [], fresh: false }
    }
    const vendors = Array.isArray(parsed.vendors) ? parsed.vendors : []
    const ts = typeof parsed.timestamp === "number" ? parsed.timestamp : 0
    const fresh = vendors.length > 0 && ts > 0 && Date.now() - ts < OFFICE_UI_CACHE_TTL_MS
    return { vendors, fresh }
  } catch {
    return { vendors: [], fresh: false }
  }
}

function writeHubVendorsCache(vendors: HubVendor[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      OFFICE_HUB_VENDORS_CACHE_KEY,
      JSON.stringify({ vendors, timestamp: Date.now(), v: HUB_VENDORS_CACHE_VERSION }),
    )
  } catch {
    /* ignore */
  }
}

function normalizeVendorSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function OfficeHubVendorsView({ fixedLineSlug }: { fixedLineSlug: HubMarketplaceLineSlug }) {
  useOfficeData()
  const initial = typeof window !== "undefined" ? readHubVendorsCacheEntry() : { vendors: [] as HubVendor[], fresh: false }
  const [vendors, setVendors] = useState<HubVendor[]>(initial.vendors)
  const [loading, setLoading] = useState(() => !initial.fresh && initial.vendors.length === 0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const [form, setForm] = useState({
    service_line_slug: fixedLineSlug,
    name: "",
    slug: "",
    photo_url: "",
    short_bio: "",
    location: "",
    is_published: false,
    is_verified: false,
  })

  const load = async () => {
    const res = await officeFetch("/api/admin/hub/vendors")
    if (!res.ok) throw new Error("load")
    const data = await res.json()
    const list = data.vendors || []
    setVendors(list)
    writeHubVendorsCache(list)
  }

  useEffect(() => {
    let c = false
    const entry = readHubVendorsCacheEntry()
    if (entry.fresh) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        await load()
      } catch {
        if (!c) setVendors([])
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const visibleVendors = useMemo(
    () => vendors.filter((v) => v.service_line_slug === fixedLineSlug),
    [vendors, fixedLineSlug],
  )

  const locationSuggestions = useMemo(() => {
    const fromVendors = visibleVendors
      .map((v) => String(v.location || "").trim())
      .filter(Boolean)
    return Array.from(new Set([...DEFAULT_VENDOR_LOCATIONS, ...fromVendors]))
  }, [visibleVendors])

  const filteredLocations = useMemo(() => {
    const q = form.location.trim().toLowerCase()
    if (!q) return locationSuggestions
    if (locationSuggestions.some((c) => c.toLowerCase() === q)) return locationSuggestions
    return locationSuggestions.filter((c) => c.toLowerCase().includes(q))
  }, [form.location, locationSuggestions])

  const reset = () => {
    setForm({
      service_line_slug: fixedLineSlug,
      name: "",
      slug: "",
      photo_url: "",
      short_bio: "",
      location: "",
      is_published: false,
      is_verified: false,
    })
    setEditingId(null)
    setSlugTouched(false)
  }

  const openCreate = () => {
    reset()
    setDialogOpen(true)
  }

  const openEdit = (v: HubVendor) => {
    setEditingId(v.id)
    setSlugTouched(true)
    setForm({
      service_line_slug: fixedLineSlug,
      name: v.name,
      slug: v.slug,
      photo_url: v.photo_url || "",
      short_bio: v.short_bio || "",
      location: (v.location || "").trim(),
      is_published: v.is_published,
      is_verified: Boolean(v.is_verified),
    })
    setDialogOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        service_line_slug: fixedLineSlug,
        name: form.name,
        slug: normalizeVendorSlug(form.slug),
        photo_url: form.photo_url || null,
        short_bio: form.short_bio || null,
        location: form.location.trim() || null,
        is_published: form.is_published,
        is_verified: form.is_verified,
      }
      const path = editingId ? `/api/admin/hub/vendors/${editingId}` : "/api/admin/hub/vendors"
      const method = editingId ? "PATCH" : "POST"
      const res = await officeFetch(path, { method, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Save failed")
      }
      clearOfficeHubProductsListCache()
      await load()
      setDialogOpen(false)
      reset()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this vendor?")) return
    const res = await officeFetch(`/api/admin/hub/vendors/${id}`, { method: "DELETE" })
    if (!res.ok) {
      alert("Delete failed")
      return
    }
    clearOfficeHubProductsListCache()
    await load()
  }

  const lineTitle = fixedLineSlug === "food" ? "Food" : "Mart"

  return (
    <OfficeDashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lineTitle} vendors</h1>
          </div>
          <div className="flex shrink-0">
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New vendor
            </Button>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? `Edit ${lineTitle} vendor` : `New ${lineTitle} vendor`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="vendor-name">Name</Label>
                <Input
                  id="vendor-name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: slugTouched ? prev.slug : normalizeVendorSlug(name),
                    }))
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vendor-slug">URL slug</Label>
                <Input
                  id="vendor-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setForm({ ...form, slug: e.target.value })
                  }}
                  placeholder="acme-kitchen"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-logo">Vendor logo</Label>
                <Input
                  id="vendor-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setUploadingPhoto(true)
                      const url = await uploadHubVendorPhoto(file)
                      setForm((prev) => ({ ...prev, photo_url: url }))
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Image upload failed")
                    } finally {
                      setUploadingPhoto(false)
                      e.target.value = ""
                    }
                  }}
                />
                {uploadingPhoto ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
                {form.photo_url ? (
                  <div className="inline-block rounded-md border p-2">
                    <img src={form.photo_url} alt="" className="h-20 w-20 rounded object-cover" />
                  </div>
                ) : null}
              </div>
              <div>
                <Label>Short bio</Label>
                <Textarea value={form.short_bio} onChange={(e) => setForm({ ...form, short_bio: e.target.value })} rows={3} />
              </div>
              <div>
                <Label htmlFor="vendor-location">Location</Label>
                <p className="mb-1.5 text-xs text-muted-foreground">Shown on the vendor storefront. Select a suggestion or type your own.</p>
                <div className="relative">
                  <Input
                    id="vendor-location"
                    value={form.location}
                    onFocus={() => setLocationMenuOpen(true)}
                    onBlur={() => setTimeout(() => setLocationMenuOpen(false), 120)}
                    onChange={(e) => {
                      setForm({ ...form, location: e.target.value })
                      setLocationMenuOpen(true)
                    }}
                    placeholder="Select or type location"
                    autoComplete="off"
                  />
                  {locationMenuOpen ? (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-white shadow-sm">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setForm({ ...form, location: loc })
                              setLocationMenuOpen(false)
                            }}
                          >
                            {loc}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No suggestion. Press save to use your custom value.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pub"
                  checked={form.is_published}
                  onCheckedChange={(c) => setForm({ ...form, is_published: Boolean(c) })}
                />
                <Label htmlFor="pub">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verified"
                  checked={form.is_verified}
                  onCheckedChange={(c) => setForm({ ...form, is_verified: Boolean(c) })}
                />
                <Label htmlFor="verified">Verified (badge in app)</Label>
              </div>
              <Button type="submit" disabled={saving || uploadingPhoto}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : visibleVendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendors yet for {lineTitle}.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Communities</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleVendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell className="max-w-[10rem] truncate text-sm text-muted-foreground">
                        {(v.location || "").trim() || "—"}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                        {(v.communities || []).map(communityName).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.slug}</TableCell>
                      <TableCell>{v.is_published ? "Yes" : "No"}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => remove(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OfficeDashboardLayout>
  )
}
