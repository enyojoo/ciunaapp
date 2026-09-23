import { NextRequest, NextResponse } from "next/server"
import { paymentMethodService } from "@/lib/database"
import { withErrorHandling } from "@/lib/auth-utils"

/** Active payment methods for send checkout, optionally filtered by currency. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const currency = request.nextUrl.searchParams.get("currency")?.trim().toUpperCase()
  const all = await paymentMethodService.getAll()
  const active = (all || []).filter((pm: { status?: string }) => pm.status === "active")
  const filtered = currency
    ? active.filter((pm: { currency?: string }) => String(pm.currency).toUpperCase() === currency)
    : active

  return NextResponse.json({
    methods: filtered.map((pm: Record<string, unknown>) => ({
      id: pm.id,
      currency: pm.currency,
      type: pm.type,
      name: pm.name,
      provider: pm.provider ?? "manual",
      isDefault: pm.is_default,
    })),
    bitbankerEnabled: filtered.some(
      (pm: Record<string, unknown>) => String(pm.provider) === "bitbanker" && pm.currency === "RUB",
    ),
  })
})
