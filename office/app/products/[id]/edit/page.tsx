"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { officeFetch } from "@/lib/api-client"
import { OfficeHubProductsView } from "@/components/hub/office-hub-products-view"
export default function EditProduct() {
  const { id } = useParams<{ id: string }>(),
    [line, setLine] = useState<"food" | "mart" | null>(null),
    [error, setError] = useState("")
  useEffect(() => {
    void officeFetch(`/api/admin/hub/products/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw Error(d.error)
        const p = d.product
        const value = p.service_line_slug || String(p.category).toLowerCase()
        if (!["food", "mart"].includes(value))
          throw Error("Product needs a marketplace service line before editing.")
        setLine(value)
      })
      .catch((e) => setError(e.message))
  }, [id])
  return line ? (
    <OfficeHubProductsView fixedLineSlug={line} initialEditId={id} />
  ) : (
    <p role={error ? "alert" : "status"}>{error || "Loading product…"}</p>
  )
}
