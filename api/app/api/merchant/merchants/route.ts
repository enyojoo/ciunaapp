import { authedRoute, readJson } from "@/lib/merchant/http"
import { createMerchant } from "@/lib/merchant/service"
import { audit } from "@/lib/merchant/audit"

export const POST = authedRoute(async (req, user) => {
  const body = await readJson(req)
  const merchant = await createMerchant(user.id, {
    type: body.type,
    displayName: body.displayName,
    country: body.country,
    operatingCountry: body.operatingCountry,
    languages: body.languages,
    line: body.line,
    email: body.email || user.email,
  })
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "merchant.created", entityType: "merchant", entityId: merchant.id })
  return { merchant }
})
