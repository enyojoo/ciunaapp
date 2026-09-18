import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { assertHubProductCategoryAllowed } from "@/lib/hub-product-category-validation"
import { hubMarketplaceLineFromCategory } from "@/lib/hub-slug"
import { hubProductImageUrlPaymentQrBucketError } from "@/lib/hub-product-image-url"
import { resolveAdminHubFixedPricing } from "@/lib/hub-product-pricing-server"

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return fallback
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const server = createServerClient()
    const { data, error } = await server.from("hub_products").select("*").eq("id", id).single()
    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (e) {
    console.error("admin hub product GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Not found" }, { status })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const server = createServerClient()

    const vendorId =
      body.vendor_id !== undefined
        ? body.vendor_id != null && String(body.vendor_id).trim() !== ""
          ? String(body.vendor_id).trim()
          : null
        : undefined

    const pricingType = body.pricing_type === "user_input" ? "user_input" : "fixed"

    let existingPricing: { list_price: number | null; sale_price: number | null; fixed_amount: number | null } | null = null
    if (id !== "new") {
      const { data: ex } = await server
        .from("hub_products")
        .select("list_price, sale_price, fixed_amount")
        .eq("id", id)
        .maybeSingle()
      if (ex) {
        existingPricing = {
          list_price: ex.list_price != null ? Number(ex.list_price) : null,
          sale_price: ex.sale_price != null ? Number(ex.sale_price) : null,
          fixed_amount: ex.fixed_amount != null ? Number(ex.fixed_amount) : null,
        }
      }
    }

    const fixedResolved = resolveAdminHubFixedPricing(pricingType, body as Record<string, unknown>, existingPricing)
    if (fixedResolved.error) {
      return NextResponse.json({ error: fixedResolved.error }, { status: 400 })
    }

    const row: Record<string, unknown> = {
      title: String(body.title || "").trim() || "Untitled",
      short_description: body.short_description ?? null,
      category: String(body.category || "Other"),
      is_featured: Boolean(body.is_featured),
      status: body.status === "live" || body.status === "archived" ? body.status : "draft",
      pricing_type: pricingType,
      fulfillment_type:
        body.fulfillment_type === "in_person"
          ? "in_person"
          : body.fulfillment_type === "vendor"
            ? "vendor"
            : "online",
      list_price: fixedResolved.list_price,
      sale_price: fixedResolved.sale_price,
      fixed_amount: fixedResolved.fixed_amount,
      fixed_currency: pricingType === "fixed" ? body.fixed_currency ?? null : null,
      default_input_currency: body.default_input_currency ?? "USD",
      fee_percent: body.fee_percent != null ? Number(body.fee_percent) : null,
      funded_min: body.funded_min != null ? Number(body.funded_min) : null,
      funded_max: body.funded_max != null ? Number(body.funded_max) : null,
      sla_text: body.sla_text ?? null,
      image_url: body.image_url != null ? String(body.image_url) : null,
      updated_at: new Date().toISOString(),
    }
    if (vendorId !== undefined) {
      row.vendor_id = vendorId
    }

    const imageReject = hubProductImageUrlPaymentQrBucketError(row.image_url)
    if (imageReject) {
      return NextResponse.json({ error: imageReject }, { status: 400 })
    }

    const catCheck = await assertHubProductCategoryAllowed(server, row.category as string)
    if (!catCheck.ok) {
      return NextResponse.json({ error: catCheck.message }, { status: 400 })
    }

    row.service_line_slug = hubMarketplaceLineFromCategory(row.category as string)

    if (row.fulfillment_type === "vendor") {
      let vid: string | null = vendorId !== undefined ? vendorId : null
      if (vendorId === undefined && id !== "new") {
        const { data: existing } = await server.from("hub_products").select("vendor_id").eq("id", id).maybeSingle()
        const ev = existing?.vendor_id
        vid = ev != null && String(ev).trim() !== "" ? String(ev).trim() : null
      }
      if (!vid) {
        return NextResponse.json({ error: "Vendor fulfillment requires a vendor" }, { status: 400 })
      }
    }

    if (vendorId) {
      const { data: v, error: vErr } = await server.from("hub_vendors").select("id, service_line_slug").eq("id", vendorId).maybeSingle()
      if (vErr || !v) {
        return NextResponse.json({ error: "Invalid vendor_id" }, { status: 400 })
      }
      const mline = row.service_line_slug as "food" | "mart" | null
      if (!mline || v.service_line_slug !== mline) {
        return NextResponse.json(
          { error: "Vendor must be a Food or Mart storefront vendor matching this product’s marketplace line." },
          { status: 400 },
        )
      }
    }

    // Office "new product" should POST, but tolerate accidental PATCH /products/new.
    if (id === "new") {
      const { data, error } = await server.from("hub_products").insert(row).select().single()
      if (error) throw error
      return NextResponse.json({ product: data }, { status: 201 })
    }

    const { data, error } = await server.from("hub_products").update(row).eq("id", id).select().maybeSingle()
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ product: data })
  } catch (e) {
    console.error("admin hub product PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    const message = getErrorMessage(e, "Failed to update")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const server = createServerClient()
    const { error } = await server.from("hub_products").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("admin hub product DELETE", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to delete" }, { status })
  }
}
