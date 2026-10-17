"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { normalizePublicSlug, EXPERT_MAIN_CATEGORIES } from "@ciuna/shared"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { officeFetch } from "@/lib/api-client"
import { uploadHubExpertPhoto } from "@/lib/upload-hub-assets"

const DEFAULT_SERVICE_AREAS = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Accra, Ghana",
  "Nairobi, Kenya",
  "London, UK",
  "Saint Petersburg, Russia",
]

type ExpertProfile = {
  id: string
  slug: string | null
  display_name: string
  headline: string | null
  category: string
  main_category?: string | null
  is_published: boolean
  updated_at: string
}

const MAIN_LABEL = new Map<string, string>(EXPERT_MAIN_CATEGORIES.map((c) => [c.id, c.label]))

export default function OfficeExpertProfilesPage() {
  const [rows, setRows] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const [form, setForm] = useState({
    display_name: "",
    slug: "",
    image_url: "",
    headline: "",
    bio: "",
    category: "Other",
    service_area: "",
    meeting_hint: "",
    is_published: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await officeFetch("/api/admin/expert/profiles")
      if (!res.ok) throw new Error("load")
      const j = await res.json()
      setRows((j.profiles || []) as ExpertProfile[])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const locationSuggestions = useMemo(() => {
    const fromRows = rows.map((r) => String(r.service_area || "").trim()).filter(Boolean)
    return Array.from(new Set([...DEFAULT_SERVICE_AREAS, ...fromRows]))
  }, [rows])

  const filteredLocations = useMemo(() => {
    const q = form.service_area.trim().toLowerCase()
    if (!q) return locationSuggestions
    if (locationSuggestions.some((c) => c.toLowerCase() === q)) return locationSuggestions
    return locationSuggestions.filter((c) => c.toLowerCase().includes(q))
  }, [form.service_area, locationSuggestions])

  const resetForm = () => {
    setForm({
      display_name: "",
      slug: "",
      image_url: "",
      headline: "",
      bio: "",
      category: "Other",
      service_area: "",
      meeting_hint: "",
      is_published: false,
    })
    setSlugTouched(false)
  }

  const handleCreate = async () => {
    const name = form.display_name.trim()
    if (!name) return
    const slugNorm = normalizePublicSlug(form.slug)
    if (!slugNorm) {
      alert("Please set a URL slug (letters, numbers, and hyphens).")
      return
    }
    setSaving(true)
    try {
      const res = await officeFetch("/api/admin/expert/profiles", {
        method: "POST",
        body: JSON.stringify({
          display_name: name,
          slug: form.slug.trim() || undefined,
          headline: form.headline.trim() || null,
          bio: form.bio.trim() || null,
          category: form.category.trim() || "Other",
          image_url: form.image_url.trim() || null,
          service_area: form.service_area.trim() || null,
          meeting_hint: form.meeting_hint.trim() || null,
          is_published: form.is_published,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || "create failed")
      }
      setOpen(false)
      resetForm()
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Create failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expert profiles</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                  }}
                >
                  New profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>New expert profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="ex-display">Display name</Label>
                    <Input
                      id="ex-display"
                      value={form.display_name}
                      onChange={(e) => {
                        const display_name = e.target.value
                        setForm((prev) => ({
                          ...prev,
                          display_name,
                          slug: slugTouched ? prev.slug : normalizePublicSlug(display_name),
                        }))
                      }}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-slug">URL slug</Label>
                    <Input
                      id="ex-slug"
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setForm({ ...form, slug: e.target.value })
                      }}
                      placeholder="jane-smith"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Public profile: /experts/your-slug</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-photo">Photo</Label>
                    <Input
                      id="ex-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setUploadingPhoto(true)
                          const url = await uploadHubExpertPhoto(file)
                          setForm((prev) => ({ ...prev, image_url: url }))
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Image upload failed")
                        } finally {
                          setUploadingPhoto(false)
                          e.target.value = ""
                        }
                      }}
                    />
                    {uploadingPhoto ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
                    {form.image_url ? (
                      <div className="inline-block rounded-md border p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.image_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-headline">Headline</Label>
                    <Input
                      id="ex-headline"
                      value={form.headline}
                      onChange={(e) => setForm({ ...form, headline: e.target.value })}
                      placeholder="Short tagline for listings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-bio">Bio</Label>
                    <Textarea
                      id="ex-bio"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      placeholder="Background, focus areas, how you help clients…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-cat">Category</Label>
                    <Input
                      id="ex-cat"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Coaching"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-area">Location</Label>
                    <p className="text-xs text-muted-foreground">Shown on the public profile (e.g. city &amp; country).</p>
                    <div className="relative">
                      <Input
                        id="ex-area"
                        value={form.service_area}
                        onFocus={() => setLocationMenuOpen(true)}
                        onBlur={() => setTimeout(() => setLocationMenuOpen(false), 120)}
                        onChange={(e) => {
                          setForm({ ...form, service_area: e.target.value })
                          setLocationMenuOpen(true)
                        }}
                        placeholder="Select or type area"
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
                                  setForm({ ...form, service_area: loc })
                                  setLocationMenuOpen(false)
                                }}
                              >
                                {loc}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No suggestion. Save to use your custom value.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-meeting">Meeting hint</Label>
                    <Textarea
                      id="ex-meeting"
                      value={form.meeting_hint}
                      onChange={(e) => setForm({ ...form, meeting_hint: e.target.value })}
                      rows={2}
                      placeholder="Zoom link instructions, office address note…"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-xs text-muted-foreground">Visible on hub discovery when enabled.</p>
                    </div>
                    <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleCreate()}
                    disabled={saving || !form.display_name.trim() || !normalizePublicSlug(form.slug)}
                  >
                    {saving ? "Saving…" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No profiles yet. Create one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Main category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.display_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.slug || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {r.main_category ? MAIN_LABEL.get(r.main_category) ?? r.main_category : <span className="text-muted-foreground">Not set</span>}
                        <div className="text-xs text-muted-foreground">{r.category}</div>
                      </TableCell>
                      <TableCell>
                        {r.is_published ? (
                          <Badge>Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/experts/profiles/${r.id}`}>Edit</Link>
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
