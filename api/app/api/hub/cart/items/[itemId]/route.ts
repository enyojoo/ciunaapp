import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { removeCartItem, updateCartItemQuantity } from "@/lib/hub-cart-server"

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
    let user: { id: string }
    try {
      user = await requireAuth(request)
    } catch {
      return createErrorResponse("Unauthorized", 401)
    }

    const { itemId } = await params
    const body = await request.json().catch(() => ({}))
    const quantity = Number(body.quantity)
    if (!Number.isFinite(quantity)) return createErrorResponse("quantity is required", 400)

    try {
      const cart = await updateCartItemQuantity(user.id, itemId, quantity)
      return NextResponse.json({ cart })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update cart item"
      return createErrorResponse(msg, msg.includes("not found") ? 404 : 400)
    }
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
    let user: { id: string }
    try {
      user = await requireAuth(request)
    } catch {
      return createErrorResponse("Unauthorized", 401)
    }

    const { itemId } = await params

    try {
      const cart = await removeCartItem(user.id, itemId)
      return NextResponse.json({ cart })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove cart item"
      return createErrorResponse(msg, msg.includes("not found") ? 404 : 400)
    }
  },
)
