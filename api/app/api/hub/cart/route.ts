import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { clearActiveCart, createOrGetActiveCart, getActiveCart, getActiveCartForServiceLine } from "@/lib/hub-cart-server"

function normalizeServiceLine(v: unknown): "food" | "mart" | null {
  const s = String(v || "").trim().toLowerCase()
  return s === "food" || s === "mart" ? s : null
}

/** `?vendorId=` fetches that vendor's cart; `?serviceLineSlug=` fetches the line's one active cart (used by the /food/cart, /mart/cart screens, which don't know a vendor id up front). */
export const GET = withErrorHandling(async (request: NextRequest) => {
  let user: { id: string }
  try {
    user = await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { searchParams } = new URL(request.url)
  const vendorId = String(searchParams.get("vendorId") || "").trim()
  const serviceLine = normalizeServiceLine(searchParams.get("serviceLineSlug"))

  if (!vendorId && !serviceLine) return createErrorResponse("vendorId or serviceLineSlug is required", 400)

  try {
    const cart = vendorId ? await getActiveCart(user.id, vendorId) : await getActiveCartForServiceLine(user.id, serviceLine!)
    return NextResponse.json({ cart })
  } catch (e: unknown) {
    return createErrorResponse(e instanceof Error ? e.message : "Failed to load cart", 500)
  }
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  let user: { id: string }
  try {
    user = await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const body = await request.json().catch(() => ({}))
  const vendorId = String(body.vendorId || "").trim()
  const serviceLine = normalizeServiceLine(body.serviceLineSlug)
  if (!vendorId || !serviceLine) return createErrorResponse("vendorId and serviceLineSlug are required", 400)

  try {
    const { cart, clearedVendorName } = await createOrGetActiveCart(user.id, vendorId, serviceLine)
    return NextResponse.json({ cart, clearedVendorName })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create cart"
    return createErrorResponse(msg, msg.includes("not found") ? 404 : 500)
  }
})

/** Clears (abandons) the caller's active cart for a vendor — used when switching vendor storefronts. */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  let user: { id: string }
  try {
    user = await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { searchParams } = new URL(request.url)
  const vendorId = String(searchParams.get("vendorId") || "").trim()
  if (!vendorId) return createErrorResponse("vendorId is required", 400)

  try {
    await clearActiveCart(user.id, vendorId)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return createErrorResponse(e instanceof Error ? e.message : "Failed to clear cart", 500)
  }
})
