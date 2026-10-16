"use client"
import * as React from "react"
import { Wallet } from "lucide-react"
import { Banner, Button, Card, EmptyState, PageHeader, Skeleton } from "@ciuna/ui-web"
import { SellerNoAccess } from "@/components/no-access"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useSeller } from "@/lib/session"
import { useErrorText, useT } from "@/lib/i18n"
import { BalanceCards } from "@/components/earnings/balance-cards"
import { DownloadStatement } from "@/components/earnings/download-statement"
import { EarningsSubnav } from "@/components/earnings/subnav"
import { groupBalances, type Balance } from "@/components/earnings/logic"
import { Statement } from "@/components/earnings/statement"
import { WithdrawSheet } from "@/components/earnings/withdraw-sheet"

interface Earnings { balances: Balance[]; minPayout: Record<string, number>; holdDays: number }

export default function EarningsPage() {
  const { merchant, can } = useSeller()
  const { t } = useT()
  const errText = useErrorText()
  const earnings = useQuery<Earnings>(can("earnings") ? "earnings" : null, () => api("/api/merchant/earnings"), { refreshMs: 60_000 })
  const [withdrawing, setWithdrawing] = React.useState(false)
  const [statementKey, setStatementKey] = React.useState(0)
  if (!merchant) return null
  if (!can("earnings")) return (
    <SellerNoAccess pageTitle={t("earnings.title")} titleKey="earnings.noAccess.title" bodyKey="earnings.noAccess.body" />
  )

  const balances = groupBalances(earnings.data?.balances)
  const canWithdraw = can("payouts") && balances.some((b) => b.available > 0)

  return (
    <>
      <PageHeader
        title={t("earnings.title")}
        description={t("earnings.subtitle")}
        action={can("payouts") ? <Button onClick={() => setWithdrawing(true)} disabled={!canWithdraw}>{t("earnings.withdraw")}</Button> : null}
      />
      <EarningsSubnav />
      <div className="space-y-6">
        {earnings.error && !earnings.data ? <Banner tone="destructive" title={errText(earnings.error.code)} action={<Button variant="secondary" onClick={() => earnings.reload()}>{t("action.retry")}</Button>} /> : null}
        {earnings.loading && !earnings.data ? <Skeleton className="h-48" /> : null}
        {earnings.data && !balances.length ? (
          <Card><EmptyState icon={<Wallet />} title={t("earnings.empty.title")} description={t("earnings.empty.body", { days: earnings.data.holdDays })} /></Card>
        ) : null}
        {earnings.data && balances.length ? <BalanceCards balances={balances} holdDays={earnings.data.holdDays} /> : null}
        {can("payouts") && earnings.data && balances.length && !canWithdraw ? <p className="text-sm text-muted">{t("earnings.withdraw.nothing")}</p> : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("earnings.statement")}</h2>
          <p className="-mt-2 text-sm text-muted">{t("earnings.statement.help")}</p>
          <Statement key={statementKey} />
        </section>
        <DownloadStatement />
      </div>
      {earnings.data ? (
        <WithdrawSheet open={withdrawing} onOpenChange={setWithdrawing} balances={balances} minPayout={earnings.data.minPayout} onDone={() => { void earnings.reload(); setStatementKey((k) => k + 1) }} />
      ) : null}
    </>
  )
}
