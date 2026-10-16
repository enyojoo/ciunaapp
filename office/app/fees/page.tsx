"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBanner, NoticeBanner } from "@/components/finance/finance-ui"
import { FEE_NOT_RETROACTIVE, fapi } from "@/components/finance/finance-lib"
import { RulesTab } from "@/components/finance/rules-tab"
import { PlansTab } from "@/components/finance/plans-tab"
import { FeeCalculator } from "@/components/finance/fee-calculator"
import type { PlanRow, RuleRow } from "@/components/finance/fee-types"

export default function FeesPage() {
  const [rules, setRules] = useState<RuleRow[]>([])
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fapi<{ rules: RuleRow[] }>("/api/admin/fee-rules"),
      fapi<{ plans: PlanRow[] }>("/api/admin/fee-plans"),
    ])
    if (r.ok) setRules(r.data.rules)
    if (p.ok) setPlans(p.data.plans)
    if ((!r.ok && r.code === "FORBIDDEN") || (!p.ok && p.code === "FORBIDDEN")) setForbidden(true)
    else if (!r.ok) setError(r.error)
    else if (!p.ok) setError(p.error)
    else setError(null)
    setLoaded(true)
  }, [])
  useEffect(() => { load() }, [load])

  const say = (m: string) => { setNotice(m); setError(null) }
  const fail = (m: string | null) => { setError(m); if (m) setNotice(null) }

  return (
    <OfficeDashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Fees and commissions</h1>
            <p className="text-sm text-muted-foreground">What Ciuna takes from seller orders and payouts. {FEE_NOT_RETROACTIVE}</p>
          </div>
          <Link href="/fees/settings" className="text-sm text-primary-text hover:underline">Marketplace money settings</Link>
        </div>

        {forbidden ? (
          <p className="rounded-md bg-muted px-4 py-6 text-sm text-muted-foreground" role="alert">
            Fee rules can only be viewed and changed by a super admin. Your role doesn't have access.
          </p>
        ) : (
          <>
            <NoticeBanner message={notice} />
            <ErrorBanner message={error} />
            {!loaded ? <p className="text-sm text-muted-foreground">Loading...</p> : (
              <>
                <Tabs defaultValue="commission">
                  <TabsList>
                    <TabsTrigger value="commission">Commission rules</TabsTrigger>
                    <TabsTrigger value="payout">Payout fees</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                  </TabsList>
                  <TabsContent value="commission" className="mt-4">
                    <RulesTab kind="commission" rules={rules} onChanged={load} onError={fail} onNotice={say} />
                  </TabsContent>
                  <TabsContent value="payout" className="mt-4">
                    <RulesTab kind="payout" rules={rules} onChanged={load} onError={fail} onNotice={say} />
                  </TabsContent>
                  <TabsContent value="plans" className="mt-4">
                    <PlansTab plans={plans} onChanged={load} onError={fail} onNotice={say} />
                  </TabsContent>
                </Tabs>
                <FeeCalculator rules={rules} plans={plans} />
              </>
            )}
          </>
        )}
      </div>
    </OfficeDashboardLayout>
  )
}
