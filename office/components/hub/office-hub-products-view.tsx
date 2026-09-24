"use client"

import { useEffect, useMemo, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Loader2, ImagePlus } from "lucide-react"
import { officeFetch } from "@/lib/api-client"
import { categoryMatchesSlug, hubProductBelongsToServiceLine } from "@/lib/hub-slug"
import { type HubMarketplaceLineSlug } from "@/lib/hub-office-paths"
import { useOfficeData } from "@/hooks/use-office-data"
import { uploadHubProductImage } from "@/lib/upload-hub-assets"
import { OFFICE_UI_CACHE_TTL_MS } from "@/lib/office-ui-cache"
import {
  OFFICE_HUB_PRODUCTS_CACHE_KEY,
  OFFICE_HUB_VENDORS_CACHE_KEY,
} from "@/lib/hub-office-client-cache"

type HubProduct = {
  id: string
  title: string
  image_url?: string | null
  category: string
  vendor_id?: string | null
  status: string
  pricing_type: string
  fulfillment_type?: "online" | "in_person" | "vendor"
  fixed_amount: number | null
  list_price?: number | null
  sale_price?: number | null
  service_line_slug?: string | null
  fixed_currency: string | null
  fee_percent: number | null
  is_featured?: boolean
  updated_at: string
  stock_quantity?: number | null
  sold_out?: boolean | null
  funded_min?: number | null
  funded_max?: number | null
  default_input_currency?: string | null
  sla_text?: string | null
  short_description?: string | null
}

const HUB_PRODUCTS_CACHE_VERSION = 3
const HUB_VENDORS_CACHE_VERSION = 1

type HubVendorsDisk = {
  vendors: { id: string; name: string; service_line_slug: string }[]
  timestamp: number
  v: number
}

function readHubProductsCacheEntry(): { products: HubProduct[]; fresh: boolean } {
  if (typeof window === "undefined") return { products: [], fresh: false }
  try {
    const raw = localStorage.getItem(OFFICE_HUB_PRODUCTS_CACHE_KEY)
    if (!raw) return { products: [], fresh: false }
    const parsed = JSON.parse(raw) as { products?: HubProduct[]; timestamp?: number; v?: number }
    if (parsed.v !== HUB_PRODUCTS_CACHE_VERSION) {
      try {
        localStorage.removeItem(OFFICE_HUB_PRODUCTS_CACHE_KEY)
      } catch {
        /* ignore */
      }
      return { products: [], fresh: false }
    }
    const products = Array.isArray(parsed.products) ? parsed.products : []
    const ts = typeof parsed.timestamp === "number" ? parsed.timestamp : 0
    const fresh = products.length > 0 && ts > 0 && Date.now() - ts < OFFICE_UI_CACHE_TTL_MS
    return { products, fresh }
  } catch {
    return { products: [], fresh: false }
  }
}

function writeHubProductsCache(products: HubProduct[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      OFFICE_HUB_PRODUCTS_CACHE_KEY,
      JSON.stringify({ products, timestamp: Date.now(), v: HUB_PRODUCTS_CACHE_VERSION }),
    )
  } catch {
    // ignore cache write failures
  }
}

function readHubVendorsCacheEntry(): {
  vendors: { id: string; name: string; service_line_slug: string }[]
  fresh: boolean
} {
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

function writeHubVendorsCache(vendors: { id: string; name: string; service_line_slug: string }[]) {
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

function parseSlaTextToTimer(sla: string | null | undefined): { hours: number; minutes: number; seconds: number } {
  const raw = String(sla || "").trim()
  if (!raw) return { hours: 1, minutes: 0, seconds: 0 }

  const hhmmss = raw.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/)
  if (hhmmss) {
    return {
      hours: Math.max(0, Number.parseInt(hhmmss[1], 10) || 0),
      minutes: Math.max(0, Math.min(59, Number.parseInt(hhmmss[2], 10) || 0)),
      seconds: Math.max(0, Math.min(59, Number.parseInt(hhmmss[3], 10) || 0)),
    }
  }

  const h = raw.match(/(\d+)\s*h/i)
  const m = raw.match(/(\d+)\s*m/i)
  const s = raw.match(/(\d+)\s*s/i)
  if (h || m || s) {
    return {
      hours: Math.max(0, Number.parseInt(h?.[1] || "0", 10) || 0),
      minutes: Math.max(0, Math.min(59, Number.parseInt(m?.[1] || "0", 10) || 0)),
      seconds: Math.max(0, Math.min(59, Number.parseInt(s?.[1] || "0", 10) || 0)),
    }
  }

  return { hours: 1, minutes: 0, seconds: 0 }
}

export function OfficeHubProductsView({ fixedLineSlug }: { fixedLineSlug: HubMarketplaceLineSlug }) {
  const serviceLineSlug = fixedLineSlug
  const { data: officeData } = useOfficeData()
  const initialProducts = typeof window !== "undefined" ? readHubProductsCacheEntry().products : []
  const initialVendorsEntry = typeof window !== "undefined" ? readHubVendorsCacheEntry() : { vendors: [], fresh: false }
  const [products, setProducts] = useState<HubProduct[]>(initialProducts)
  const [loading, setLoading] = useState(() => initialProducts.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [slaTimer, setSlaTimer] = useState({ hours: 1, minutes: 0, seconds: 0 })
  const [hubVendors, setHubVendors] = useState<{ id: string; name: string; service_line_slug: string }[]>(
    () => initialVendorsEntry.vendors,
  )
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    category: "Other",
    vendor_id: "",
    status: "draft",
    pricing_type: "fixed",
    fulfillment_type: "online",
    list_price: "",
    sale_price: "",
    fixed_currency: "USD",
    default_input_currency: "USD",
    fee_percent: "5",
    funded_min: "",
    funded_max: "",
    sla_text: "",
    image_url: "",
    is_featured: false,
    stock_quantity: "",
    sold_out: false,
  })

  const DEFAULT_CATEGORIES = ["Connectivity", "Card Payment", "AI Tools", "Entertainment", "Experts", "Other"]
  const CATEGORIES = useMemo(() => {
    const fromProducts = products
      .map((p) => String(p.category || "").trim())
      .filter(Boolean)
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromProducts]))
  }, [products])

  const displayedProducts = useMemo(() => {
    return products.filter((p) => hubProductBelongsToServiceLine(p, fixedLineSlug))
  }, [products, fixedLineSlug])

  const lineTitle = fixedLineSlug === "food" ? "Food" : "Mart"
  const lineVendors = useMemo(
    () => hubVendors.filter((v) => v.service_line_slug === fixedLineSlug),
    [hubVendors, fixedLineSlug],
  )

  const filteredLineVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase()
    if (!q) return lineVendors
    return lineVendors.filter((v) => v.name.toLowerCase().includes(q))
  }, [lineVendors, vendorSearch])

  const filteredCategories = useMemo(() => {
    const q = form.category.trim().toLowerCase()
    if (!q) return CATEGORIES
    // When a known category is selected, show full list on focus/click.
    if (CATEGORIES.some((c) => c.toLowerCase() === q)) return CATEGORIES
    return CATEGORIES.filter((c) => c.toLowerCase().includes(q))
  }, [form.category])

  useEffect(() => {
    let cancelled = false
    const vendorsEntry = readHubVendorsCacheEntry()
    if (vendorsEntry.fresh) return
    void officeFetch("/api/admin/hub/vendors")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("vendors"))))
      .then((j: { vendors?: { id: string; name: string; service_line_slug: string }[] }) => {
        const list = j.vendors || []
        if (!cancelled) {
          setHubVendors(list)
          writeHubVendorsCache(list)
        }
      })
      .catch(() => {
        if (!cancelled) setHubVendors([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resetForm = () => {
    setForm({
      title: "",
      short_description: "",
      category: "Other",
      vendor_id: "",
      status: "draft",
      pricing_type: "fixed",
      fulfillment_type: "online",
      list_price: "",
      sale_price: "",
      fixed_currency: "USD",
      default_input_currency: "USD",
      fee_percent: "5",
      funded_min: "",
      funded_max: "",
      sla_text: "",
      image_url: "",
      is_featured: false,
      stock_quantity: "",
      sold_out: false,
    })
    setSlaTimer({ hours: 1, minutes: 0, seconds: 0 })
    setVendorSearch("")
    setVendorMenuOpen(false)
  }

  const loadProducts = async () => {
    const res = await officeFetch("/api/admin/hub/products")
    if (!res.ok) throw new Error("Failed to load")
    const data = await res.json()
    const nextProducts = data.products || []
    setProducts(nextProducts)
    writeHubProductsCache(nextProducts)
  }

  useEffect(() => {
    let cancelled = false
    const entry = readHubProductsCacheEntry()
    if (entry.fresh) {
      setLoading(false)
      return
    }
    ;(async () => {
      if (entry.products.length === 0) setLoading(true)
      try {
        await loadProducts()
      } catch (e) {
        if (!cancelled) setError("Could not load Hub products")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = async (id: string) => {
    try {
      const res = await officeFetch(`/api/admin/hub/products/${id}`)
      if (!res.ok) throw new Error("Failed to load product")
      const { product } = await res.json()
      setEditingId(id)
      setForm({
        title: product.title || "",
        short_description: product.short_description || "",
        category: product.category || "Other",
        vendor_id: product.vendor_id ? String(product.vendor_id) : "",
        status: product.status || "draft",
        pricing_type: product.pricing_type || "fixed",
        fulfillment_type:
          product.fulfillment_type === "in_person"
            ? "in_person"
            : product.fulfillment_type === "vendor"
              ? "vendor"
              : "online",
        list_price:
          product.list_price != null
            ? String(product.list_price)
            : product.fixed_amount != null
              ? String(product.fixed_amount)
              : "",
        sale_price: product.sale_price != null ? String(product.sale_price) : "",
        fixed_currency: product.fixed_currency || "USD",
        default_input_currency: product.default_input_currency || "USD",
        fee_percent: product.fee_percent != null ? String(product.fee_percent) : "0",
        funded_min: product.funded_min != null ? String(product.funded_min) : "",
        funded_max: product.funded_max != null ? String(product.funded_max) : "",
        sla_text: product.sla_text || "",
        image_url: product.image_url || "",
        is_featured: Boolean(product.is_featured),
        stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
        sold_out: Boolean(product.sold_out),
      })
      const vendorLabel =
        hubVendors
          .filter((v) => v.service_line_slug === fixedLineSlug)
          .find((v) => v.id === (product.vendor_id ? String(product.vendor_id) : ""))?.name || ""
      setVendorSearch(vendorLabel)
      setSlaTimer(parseSlaTextToTimer(product.sla_text))
      setDialogOpen(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not load product")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.fulfillment_type === "vendor" && !String(form.vendor_id || "").trim()) {
      alert("Choose a vendor for Vendor fulfillment.")
      return
    }
    if (form.pricing_type === "fixed") {
      const list = Number(form.list_price)
      if (!Number.isFinite(list) || list <= 0) {
        alert("List price is required and must be greater than zero.")
        return
      }
      const saleRaw = String(form.sale_price || "").trim()
      if (saleRaw) {
        const sale = Number(saleRaw)
        if (!Number.isFinite(sale) || sale <= 0) {
          alert("Sale price must be greater than zero when provided.")
          return
        }
      }
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        short_description: form.short_description || null,
        category: form.category,
        status: form.status,
        pricing_type: form.pricing_type,
        fulfillment_type: form.fulfillment_type,
        list_price: form.pricing_type === "fixed" ? Number(form.list_price) || null : null,
        sale_price:
          form.pricing_type === "fixed" && String(form.sale_price || "").trim()
            ? Number(form.sale_price) || null
            : null,
        fixed_currency: form.pricing_type === "fixed" ? form.fixed_currency : null,
        default_input_currency: form.default_input_currency,
        fee_percent: Number(form.fee_percent) || 0,
        funded_min: form.funded_min ? Number(form.funded_min) : null,
        funded_max: form.funded_max ? Number(form.funded_max) : null,
        sla_text: `${slaTimer.hours}:${String(slaTimer.minutes).padStart(2, "0")}:${String(slaTimer.seconds).padStart(2, "0")}`,
        image_url: form.image_url || null,
        is_featured: form.is_featured,
        stock_quantity: String(form.stock_quantity || "").trim() ? Number(form.stock_quantity) : null,
        sold_out: Boolean(form.sold_out),
      }
      body.vendor_id = categoryMatchesSlug(form.category, fixedLineSlug) ? (form.vendor_id || null) : null

      const path = editingId ? `/api/admin/hub/products/${editingId}` : "/api/admin/hub/products"
      const method = editingId ? "PATCH" : "POST"
      const res = await officeFetch(path, { method, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || (editingId ? "Update failed" : "Create failed"))
      }
      await loadProducts()
      setDialogOpen(false)
      setEditingId(null)
      resetForm()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <OfficeDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {fixedLineSlug === "food" ? "Food" : "Mart"} products
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&_input[type=number]]:[-moz-appearance:textfield] [&_input[type=number]::-webkit-inner-spin-button]:appearance-none [&_input[type=number]::-webkit-outer-spin-button]:appearance-none">
              <DialogHeader>
                <DialogTitle>{editingId ? `Edit ${lineTitle} product` : `New ${lineTitle} product`}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="short">Short description</Label>
                  <Input id="short" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
                  <div className="space-y-2 flex flex-col">
                  <Label htmlFor="image">Product image</Label>
                  <label
                    htmlFor="image"
                    className="flex h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:bg-gray-100"
                  >
                    <ImagePlus className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingImage ? "Uploading..." : "Click to upload product image"}
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, WEBP - max 5MB. Recommended 4:3 ratio (1200 x 900px), not square.
                    </span>
                  </label>
                  <Input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setUploadingImage(true)
                        const url = await uploadHubProductImage(file)
                        setForm((prev) => ({ ...prev, image_url: url }))
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Image upload failed")
                      } finally {
                        setUploadingImage(false)
                      }
                    }}
                  />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label>Preview</Label>
                    <div className="h-[220px] w-full overflow-hidden rounded-lg border bg-gray-100">
                      {form.image_url ? (
                        <div className="h-full w-full flex items-center justify-center p-2">
                          <div className="h-full w-full overflow-hidden rounded-md bg-gray-200">
                            <img src={form.image_url} alt="Product preview" className="h-full w-full object-contain" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2">
                          <div className="aspect-[4/3] w-full max-h-full rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                            4:3 preview area
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <div className="relative">
                      <Input
                        value={form.category}
                        onFocus={() => setCategoryMenuOpen(true)}
                        onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 120)}
                        onChange={(e) => {
                          setForm({ ...form, category: e.target.value })
                          setCategoryMenuOpen(true)
                        }}
                        placeholder="Select or type category"
                      />
                      {categoryMenuOpen ? (
                        <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-white shadow-sm">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setForm({ ...form, category: c })
                                  setCategoryMenuOpen(false)
                                }}
                              >
                                {c}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No suggestion. Press save to use custom value.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fulfillment type</Label>
                    <Select
                      value={form.fulfillment_type}
                      onValueChange={(v: "online" | "in_person" | "vendor") =>
                        setForm({ ...form, fulfillment_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-person</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-search">
                      {form.fulfillment_type === "vendor" ? "Vendor" : "Storefront vendor (optional)"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="vendor-search"
                        value={vendorSearch}
                        onFocus={() => setVendorMenuOpen(true)}
                        onBlur={() => setTimeout(() => setVendorMenuOpen(false), 150)}
                        onChange={(e) => {
                          setVendorSearch(e.target.value)
                          setVendorMenuOpen(true)
                          setForm({ ...form, vendor_id: "" })
                        }}
                        placeholder="Search vendors…"
                      />
                      {vendorMenuOpen ? (
                        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-sm">
                          {filteredLineVendors.length > 0 ? (
                            filteredLineVendors.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setForm({ ...form, vendor_id: v.id })
                                  setVendorSearch(v.name)
                                  setVendorMenuOpen(false)
                                }}
                              >
                                {v.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No matching vendors.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <Checkbox
                    id="hub-featured"
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v === true })}
                  />
                  <Label htmlFor="hub-featured" className="text-sm font-normal cursor-pointer">
                    Featured (shows first in app {lineTitle} catalog)
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pricing type</Label>
                    <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                        <SelectItem value="user_input">User input amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fee %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.fee_percent}
                      onChange={(e) => setForm({ ...form, fee_percent: e.target.value })}
                    />
                  </div>
                </div>
                {form.pricing_type === "fixed" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label>List price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={form.list_price}
                        onChange={(e) => setForm({ ...form, list_price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Sale price (optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={form.sale_price}
                        onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                        placeholder="Same as list if empty"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select value={form.fixed_currency} onValueChange={(v) => setForm({ ...form, fixed_currency: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] overflow-y-auto">
                          {(officeData?.currencies?.length
                            ? officeData.currencies.filter((c: { code?: string; status?: string }) => c?.code && c.status !== "inactive")
                            : [{ code: "USD", name: "US Dollar", flag_svg: "" }]
                          ).map((c: { code: string; name?: string; flag_svg?: string }) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="inline-flex items-center gap-2">
                                {c.flag_svg ? <span className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: c.flag_svg }} /> : null}
                                <span>{c.code}</span>
                                {c.name ? <span className="text-gray-500">— {c.name}</span> : null}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Default input currency</Label>
                      <Select value={form.default_input_currency} onValueChange={(v) => setForm({ ...form, default_input_currency: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px] overflow-y-auto">
                          {(officeData?.currencies?.length ? officeData.currencies.filter((c: { code?: string; status?: string }) => c?.code && c.status !== "inactive") : [{ code: "USD", name: "US Dollar", flag_svg: "" }]).map((c: any) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="inline-flex items-center gap-2">
                                {c.flag_svg ? <span className="h-4 w-4 shrink-0" dangerouslySetInnerHTML={{ __html: c.flag_svg }} /> : null}
                                <span>{c.code}</span>
                                {c.name ? <span className="text-gray-500">— {c.name}</span> : null}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Funded min (optional)</Label>
                      <Input type="number" step="0.01" value={form.funded_min} onChange={(e) => setForm({ ...form, funded_min: e.target.value })} />
                    </div>
                    <div>
                      <Label>Funded max (optional)</Label>
                      <Input type="number" step="0.01" value={form.funded_max} onChange={(e) => setForm({ ...form, funded_max: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stock quantity (optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.stock_quantity}
                      onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                      placeholder="Unlimited if empty"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.sold_out}
                        onChange={(e) => setForm({ ...form, sold_out: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Mark sold out
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Delivery time</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">H</Label>
                      <Input
                        type="number"
                        min={0}
                        value={slaTimer.hours}
                        onChange={(e) =>
                          setSlaTimer((prev) => ({
                            ...prev,
                            hours: Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">M</Label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={slaTimer.minutes}
                        onChange={(e) =>
                          setSlaTimer((prev) => ({
                            ...prev,
                            minutes: Math.max(0, Math.min(59, Number.parseInt(e.target.value, 10) || 0)),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">S</Label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={slaTimer.seconds}
                        onChange={(e) =>
                          setSlaTimer((prev) => ({
                            ...prev,
                            seconds: Math.max(0, Math.min(59, Number.parseInt(e.target.value, 10) || 0)),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingId ? "Save changes" : "Create product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent>
            {loading && products.length === 0 ? (
              <div className="space-y-3 py-2">
                <div className="h-10 animate-pulse rounded-md bg-gray-100" />
                <div className="h-10 animate-pulse rounded-md bg-gray-100" />
                <div className="h-10 animate-pulse rounded-md bg-gray-100" />
              </div>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : products.length === 0 ? (
              <p className="text-gray-500">No products yet. Create one to get started.</p>
            ) : displayedProducts.length === 0 ? (
              <p className="text-gray-500">No products for this line yet. Create one above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Price / fee</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.pricing_type === "user_input" ? "User input" : "Fixed"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === "live"
                              ? "bg-green-100 text-green-800"
                              : p.status === "archived"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-900"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.fulfillment_type === "in_person"
                          ? "In-person"
                          : p.fulfillment_type === "vendor"
                            ? "Vendor"
                            : "Online"}
                      </TableCell>
                      <TableCell>
                        {p.is_featured ? (
                          <Badge className="bg-orange-100 text-orange-900">Yes</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {p.pricing_type === "fixed" ? (
                          (() => {
                            const list = p.list_price != null ? Number(p.list_price) : p.fixed_amount != null ? Number(p.fixed_amount) : null
                            const sale = p.sale_price != null ? Number(p.sale_price) : null
                            const cur = p.fixed_currency ?? ""
                            if (list == null || !Number.isFinite(list)) return "—"
                            if (sale != null && Number.isFinite(sale) && sale > 0 && sale !== list) {
                              return (
                                <span>
                                  <span className="font-medium">{sale}</span> {cur}
                                  <span className="text-gray-500">
                                    {" "}
                                    (list {list} {cur})
                                  </span>
                                </span>
                              )
                            }
                            return `${list} ${cur}`.trim()
                          })()
                        ) : (
                          `Fee ${p.fee_percent ?? 0}%`
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => void openEdit(p.id)}>
                          <Pencil className="h-4 w-4" />
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
