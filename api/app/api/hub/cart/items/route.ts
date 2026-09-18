import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { addCartItem } from "@/lib/hub-cart-server"

function normalizeServiceLine(v: unknown): "food" | "mart" | null {
  const s = String(v || "").trim().toLowerCase()
  return s === "food" || s === "mart" ? s : null
}

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
  const hubProductId = String(body.hubProductId || "").trim()
  const quantity = body.quantity != null ? Number(body.quantity) : 1

  if (!vendorId || !serviceLine || !hubProductId) {
    return createErrorResponse("vendorId, serviceLineSlug and hubProductId are required", 400)
  }

  try {
    const { cart, clearedVendorName } = await addCartItem(user.id, { vendorId, serviceLineSlug: serviceLine, hubProductId, quantity })
    return NextResponse.json({ cart, clearedVendorName })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to add item"
    const code = msg.includes("not found") ? 404 : msg.includes("sold out") || msg.includes("not available") || msg.includes("belong") || msg.includes("fixed-price") ? 400 : 500
    return createErrorResponse(msg, code)
  }
})
