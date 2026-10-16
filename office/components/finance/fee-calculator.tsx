"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MerchantSearch, type MerchantHit } from "./finance-ui"
import { CATEGORIES, CURRENCIES, SERVICE_LINES, fapi, formatMoney } from "./finance-lib"
import { resolveFee } from "./resolve-fee"
import type { PlanRow, RuleRow } from "./fee-types"

const SOURCE: Record<string, string> = {
  merchant: "A rule for this merchant",
  plan: "The merchant's fee plan",
  category: "A category rule",
  service_line: "A service line rule",
  platform: "The platform default",
  none: "No rule applies, so no fee",
}

/** Client-side preview using the same resolution as the API. Uses active rules in force now. */
export function FeeCalculator({ rules, plans }: { rules: RuleRow[]; plans: PlanRow[] }) {
  const [kind, setKind] = useState<"commission" | "payout">("commission")
  const [merchant, setMerchant] = useState<MerchantHit | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [line, setLine] = useState("food")
  const [category, setCategory] = useState("none")
  const [currency, setCurrency] = useState("RUB")
  const [amount, setAmount] = useState("1000")

  useEffect(() => {
    if (!merchant) { setPlanId(null); return }
    let stale = false
    fapi<{ merchant: { fee_plan_id?: string | null } }>(`/api/admin/merchants/${merchant.id}`).then((r) => {
      if (!stale && r.ok) setPlanId(r.data.merchant.fee_plan_id || null)
    })
    return () => { stale = true }
  }, [merchant])

  const amt = Number(amount)
  const result = useMemo(() => {
    if (!Number.isFinite(amt) || amt <= 0) return null
    const plan = planId ? plans.find((p) => p.id === planId && p.active) : null
    return resolveFee(
      rules,
      plan ? { id: plan.id, commission_percent: plan.commission_percent } : null,
      { kind, merchantId: merchant?.id || "", serviceLine: kind === "commission" ? line : null, category: kind === "commission" && category !== "none" ? category : null, currency },
      amt,
    )
  }, [rules, plans, planId, kind, merchant, line, category, currency, amt])

  const cats = CATEGORIES[line] || []
  const planName = planId ? plans.find((p) => p.id === planId)?.name : null

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Fee calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Preview the fee an order or payout would get under the rules and plans in force now. Pick a merchant to include its rules and plan.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Fee type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "commission" | "payout")}>
              <SelectTrigger aria-label="Fee type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Commission on an order</SelectItem>
                <SelectItem value="payout">Fee on a payout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-amount">{kind === "commission" ? "Item total" : "Payout amount"}</Label>
            <Input id="calc-amount" inputMode="decimal" className="tabular-nums" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          {kind === "commission" && (
            <>
              <div className="space-y-1.5">
                <Label>Service line</Label>
                <Select value={line} onValueChange={(v) => { setLine(v); setCategory("none") }}>
                  <SelectTrigger aria-label="Service line"><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_LINES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={cats.length === 0}>
                  <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any</SelectItem>
                    {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-1.5 md:col-span-3">
            <Label>Merchant (optional)</Label>
            <MerchantSearch value={merchant} onChange={setMerchant} />
            {merchant && <p className="text-xs text-muted-foreground">Plan: {planName || "none"}</p>}
          </div>
        </div>

        <div className="rounded-md bg-muted/50 px-4 py-3 text-sm" aria-live="polite">
          {!result ? <span className="text-muted-foreground">Enter an amount above zero.</span> : (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span>Fee <span className="text-lg font-semibold tabular-nums">{formatMoney(result.fee, currency)}</span></span>
              <span className="text-muted-foreground">{kind === "commission" ? "Merchant net" : "Net payable"} <span className="tabular-nums text-foreground">{formatMoney(Math.round((amt - result.fee) * 100) / 100, currency)}</span></span>
              <span className="text-muted-foreground">{SOURCE[result.source]}{result.percent !== null ? ` (${result.percent}%${result.fixed !== null ? ` + ${result.fixed}` : ""})` : result.fixed !== null ? ` (${result.fixed} fixed)` : ""}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
