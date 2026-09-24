"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { officeFetch } from "@/lib/api-client"
import { hubCategorySlug } from "@/lib/hub-slug"
import { hubProductsPath, type HubMarketplaceLineSlug } from "@/lib/hub-office-paths"
import { useOfficeData } from "@/hooks/use-office-data"
import { uploadHubProductImage } from "@/lib/upload-hub-assets"
import { clearOfficeHubProductsListCache } from "@/lib/hub-office-client-cache"

const CATEGORIES = [
  "Logistics",
  "Money",
  "Connectivity",
  "AI",
  "Communication",
  "Language",
  "Bundles",
  "Other",
]

export default function OfficeEditProductPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: officeData } = useOfficeData()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const currencyOptions = useMemo(
    () =>
      (officeData?.currencies || [])
        .filter((c: { code?: string; status?: string }) => c?.code && c.status !== "inactive")
        .map((c: { code: string }) => c.code),
    [officeData?.currencies],
  )
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    long_description: "",
    category: "Other",
    status: "draft",
    pricing_type: "fixed",
    list_price: "",
    sale_price: "",
    fixed_currency: "USD",
    default_input_currency: "USD",
    fee_percent: "0",
    funded_min: "",
    funded_max: "",
    billing_context: "",
    sla_text: "",
    internal_notes: "",
    form_schema_json: "[]",
    sort_order: "0",
    image_url: "",
    stock_quantity: "",
    sold_out: false,
  })

  const hubProductsListHref = useMemo(() => {
    const s = hubCategorySlug(form.category)
    if (s === "food" || s === "mart") return hubProductsPath(s as HubMarketplaceLineSlug)
    return hubProductsPath("food")
  }, [form.category])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await officeFetch(`/api/admin/hub/products/${id}`)
        if (!res.ok) throw new Error("Not found")
        const { product } = await res.json()
        if (cancelled || !product) return
        setForm({
          title: product.title || "",
          short_description: product.short_description || "",
          long_description: product.long_description || "",
          category: product.category || "Other",
          status: product.status || "draft",
          pricing_type: product.pricing_type || "fixed",
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
          billing_context: product.billing_context || "",
          sla_text: product.sla_text || "",
          internal_notes: product.internal_notes || "",
          form_schema_json: JSON.stringify(product.form_schema || [], null, 2),
          sort_order: String(product.sort_order ?? 0),
          image_url: product.image_url || "",
          stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
          sold_out: Boolean(product.sold_out),
        })
      } catch {
        if (!cancelled) router.push(hubProductsPath("food"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      let form_schema: unknown[] = []
      try {
        const parsed = JSON.parse(form.form_schema_json || "[]")
        form_schema = Array.isArray(parsed) ? parsed : []
      } catch {
        alert("Form schema must be valid JSON array")
        setSaving(false)
        return
      }

      const body: Record<string, unknown> = {
        title: form.title,
        short_description: form.short_description || null,
        long_description: form.long_description || null,
        category: form.category,
        status: form.status,
        pricing_type: form.pricing_type,
        list_price: form.pricing_type === "fixed" ? Number(form.list_price) || null : null,
        sale_price:
          form.pricing_type === "fixed" && String(form.sale_price || "").trim()
            ? Number(form.sale_price) || null
            : null,
        fixed_currency: form.pricing_type === "fixed" ? form.fixed_currency : null,
        default_input_currency: form.default_input_currency,
        fee_percent: form.pricing_type === "user_input" ? Number(form.fee_percent) || 0 : null,
        funded_min: form.funded_min ? Number(form.funded_min) : null,
        funded_max: form.funded_max ? Number(form.funded_max) : null,
        billing_context: form.billing_context === "one_time" || form.billing_context === "recurring" ? form.billing_context : null,
        sla_text: form.sla_text || null,
        internal_notes: form.internal_notes || null,
        form_schema,
        sort_order: Number(form.sort_order) || 0,
        image_url: form.image_url || null,
        stock_quantity: String(form.stock_quantity || "").trim()
          ? Number(form.stock_quantity)
          : null,
        sold_out: Boolean(form.sold_out),
      }

      const res = await officeFetch(`/api/admin/hub/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Update failed")
      clearOfficeHubProductsListCache()
      router.push(hubProductsListHref)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <OfficeDashboardLayout>
        <div className="p-6">Loading…</div>
      </OfficeDashboardLayout>
    )
  }

  return (
    <OfficeDashboardLayout>
      <div className="p-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={hubProductsListHref}>← Back</Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="short">Short description</Label>
                <Input id="short" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="long">Long description</Label>
                <Textarea id="long" rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Product image</Label>
                <Input
                  id="image"
                  type="file"
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
                {uploadingImage ? <p className="text-sm text-gray-500">Uploading image…</p> : null}
                {form.image_url ? (
                  <div className="rounded-md border p-2 inline-block">
                    <img src={form.image_url} alt="Product preview" className="h-28 w-28 rounded object-cover" />
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
              <div>
                <Label>Pricing type</Label>
                <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed price</SelectItem>
                    <SelectItem value="user_input">User input amount + fee %</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Input value={form.fixed_currency} onChange={(e) => setForm({ ...form, fixed_currency: e.target.value })} required />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fee %</Label>
                    <Input type="number" step="0.01" value={form.fee_percent} onChange={(e) => setForm({ ...form, fee_percent: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Default input currency</Label>
                    <Select
                      value={form.default_input_currency}
                      onValueChange={(v) => setForm({ ...form, default_input_currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {(currencyOptions.length > 0 ? currencyOptions : ["USD"]).map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
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
                <Label>Billing context (ops only)</Label>
                <Select
                  value={form.billing_context || "none"}
                  onValueChange={(v) => setForm({ ...form, billing_context: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring (context)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SLA text</Label>
                <Input value={form.sla_text} onChange={(e) => setForm({ ...form, sla_text: e.target.value })} />
              </div>
              <div>
                <Label>Internal notes</Label>
                <Textarea rows={2} value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div>
                <Label>Form schema (JSON array)</Label>
                <Textarea rows={6} className="font-mono text-sm" value={form.form_schema_json} onChange={(e) => setForm({ ...form, form_schema_json: e.target.value })} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </OfficeDashboardLayout>
  )
}
