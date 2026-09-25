"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { MarketplaceOrder } from "@ciuna/shared"
import TransactionOrderDetailPage from "@/components/transaction-order-detail-page"
import { MarketplaceOrderView } from "@/components/hub/marketplace-order"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { useTranslation } from "react-i18next"
export default function HubOrderDetailPage() {
  const { id } = useParams<{ id: string }>(),
    [order, setOrder] = useState<MarketplaceOrder | null>(null),
    [legacy, setLegacy] = useState(false),
    [error, setError] = useState(false),
    { t } = useTranslation("app")
  useEffect(() => {
    void fetchWithAuth(`/api/hub/orders/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setLegacy(true)
          return
        }
        if (!r.ok) throw Error()
        setOrder((await r.json()).order)
      })
      .catch(() => setError(true))
  }, [id])
  return order ? (
    <MarketplaceOrderView order={order} onChange={setOrder} />
  ) : legacy ? (
    <TransactionOrderDetailPage />
  ) : (
    <p role="status" className="p-6">
      {t(error ? "marketplace.retryError" : "marketplace.loading")}
    </p>
  )
}
