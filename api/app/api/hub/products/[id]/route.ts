import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAuth, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { enrichHubProductsWithVendors } from "@/lib/hub-product-vendors"

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await requireAuth(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { id } = await params
  const server = createServerClient()
  const { data, error } = await server.from("hub_products").select("*").eq("id", id).eq("status", "live").single()

  if (error || !data) {
    return createErrorResponse("Product not found", 404)
  }

  const [enriched] = await enrichHubProductsWithVendors(server, [data])

  return NextResponse.json({ product: enriched })
})
