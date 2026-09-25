"use client"
import { useEffect, useState } from "react"
import { officeFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export function MarketplaceCatalog() {
  const [data, setData] = useState<any>({ vendors: [], zones: [], services: [], products: [] }),
    [vendor, setVendor] = useState<any>(null),
    [service, setService] = useState<any>(null),
    [zone, setZone] = useState<any>({ city: "", district: "", fee: 0, currency: "RUB", active: true }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  async function load() {
    const r = await officeFetch("/api/admin/marketplace/catalog")
    const d = await r.json()
    if (!r.ok) throw Error(d.error)
    setData(d)
  }
  useEffect(() => {
    void load().catch((e) => setMessage(e.message))
  }, [])
  async function save(body: any) {
    setBusy(true)
    try {
      const r = await officeFetch("/api/admin/marketplace/catalog", {
          method: "POST",
          body: JSON.stringify(body),
        }),
        d = await r.json()
      if (!r.ok) throw Error(d.error)
      await load()
      setMessage("Saved")
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const input = (title: string, key: string, object: any, set: (o: any) => void, type = "text") => (
    <label className="block space-y-1" key={key}>
      {title}
      <Input
        type={type}
        value={object[key] ?? ""}
        onChange={(e) => set({ ...object, [key]: e.target.value })}
      />
    </label>
  )
  return (
    <div className="space-y-6">
      <p role="status">{message}</p>
      <p>
        Products are managed in{" "}
        <a className="underline" href="/food/products">
          Food
        </a>{" "}
        and{" "}
        <a className="underline" href="/mart/products">
          Mart
        </a>
        . Configure fulfillment before publishing.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Vendor fulfillment</h2>
          <select
            className="w-full rounded border p-3"
            aria-label="Vendor"
            value={vendor?.id || ""}
            onChange={(e) => {
              setVendor(data.vendors.find((v: any) => v.id === e.target.value))
              setZone({ city: "", district: "", fee: 0, currency: "RUB", active: true })
            }}
          >
            <option value="">Choose vendor</option>
            {data.vendors.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.service_line_slug}
              </option>
            ))}
          </select>
          {vendor && (
            <>
              <p>
                {data.products.filter((p: any) => p.vendor_id === vendor.id).length} products ·{" "}
                <a
                  className="underline"
                  href={`${process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com"}/${vendor.service_line_slug}/stores/${vendor.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preview storefront
                </a>
              </p>
              {input("Pickup location", "pickup_location", vendor, setVendor)}
              {input("Pickup hours", "pickup_hours", vendor, setVendor)}
              {input("Fulfillment instructions", "fulfillment_notes", vendor, setVendor)}
              {input("Responsible team", "owner_team", vendor, setVendor)}
              <Button disabled={busy} onClick={() => void save({ ...vendor, kind: "vendor" })}>
                Save vendor instructions
              </Button>
              <h3 className="font-semibold">Delivery zones</h3>
              {data.zones
                .filter((z: any) => z.vendor_id === vendor.id)
                .map((z: any) => (
                  <button
                    className="block w-full rounded border p-3 text-left"
                    key={z.id}
                    onClick={() => setZone(z)}
                  >
                    {z.city} · {z.district} · {z.fee} {z.currency} · {z.active ? "active" : "inactive"}
                  </button>
                ))}
              {input("City identifier", "city", zone, setZone)}
              {input("District identifier", "district", zone, setZone)}
              {input("Flat fee per order", "fee", zone, setZone, "number")}
              {input("Currency", "currency", zone, setZone)}
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={zone.active}
                  onChange={(e) => setZone({ ...zone, active: e.target.checked })}
                />
                Active
              </label>
              <Button
                disabled={busy}
                onClick={() => void save({ ...zone, vendor_id: vendor.id, kind: "zone" })}
              >
                Save zone
              </Button>
              <Button
                variant="outline"
                onClick={() => setZone({ city: "", district: "", fee: 0, currency: "RUB", active: true })}
              >
                New zone
              </Button>
            </>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Expert booking configuration</h2>
          <p>Profile = discovery identity. Service = paid offering. Slots = available appointment times.</p>
          <select
            className="w-full rounded border p-3"
            aria-label="Expert service"
            value={service?.id || ""}
            onChange={(e) => setService(data.services.find((s: any) => s.id === e.target.value))}
          >
            <option value="">Choose service</option>
            {data.services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.upcomingSlots} upcoming slots
              </option>
            ))}
          </select>
          {service && (
            <>
              {!service.upcomingSlots && (
                <p role="status">No upcoming slots — customers cannot book this service.</p>
              )}
              {service.pricing_type === "quote" && <p>Quote services cannot be paid online.</p>}
              <label className="block">
                Meeting mode
                <select
                  className="block rounded border p-3"
                  value={service.fulfillment_type}
                  onChange={(e) => setService({ ...service, fulfillment_type: e.target.value })}
                >
                  {["online", "in_person", "both"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {input("Meeting/location instructions", "meeting_instructions", service, setService)}
              {input("Timezone (IANA)", "timezone", service, setService)}
              {input("Minimum booking lead (minutes)", "booking_lead_minutes", service, setService, "number")}
              {input(
                "Payment cutoff before start (minutes)",
                "payment_cutoff_minutes",
                service,
                setService,
                "number",
              )}
              <Button disabled={busy} onClick={() => void save({ ...service, kind: "service" })}>
                Save booking configuration
              </Button>
            </>
          )}
        </section>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold">Products needing fulfillment review</h2>
        <p className="text-sm text-muted-foreground">
          Ambiguous legacy <code>vendor</code> modes stay unset until Office picks pickup or delivery.
        </p>
        {data.products.filter((p: any) => !p.fulfillment_mode).length === 0 ? (
          <p className="text-sm text-muted-foreground">All products have a fulfillment mode.</p>
        ) : (
          data.products
            .filter((p: any) => !p.fulfillment_mode)
            .map((p: any) => (
              <p key={p.id} className="text-sm">
                <a className="underline" href={`/${p.service_line_slug || "mart"}/products`}>
                  {p.title}
                </a>{" "}
                · {p.status}
                {p.fulfillment_type ? ` · legacy ${p.fulfillment_type}` : ""}
                {p.vendor_id ? "" : " · no vendor"}
              </p>
            ))
        )}
      </section>
    </div>
  )
}
