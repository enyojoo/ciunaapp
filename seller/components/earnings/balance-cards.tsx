"use client"
import { Amount, Card, CardBody } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import type { Balance } from "./logic"

/** One card per currency. Each figure says what it waits for; money-in is never red or green. */
export function BalanceCards({ balances, holdDays }: { balances: Balance[]; holdDays: number }) {
  const { t } = useT()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {balances.map((b) => (
        <Card key={b.currency}>
          <CardBody>
            <p className="text-sm font-semibold text-muted">{t("earnings.available")} · {b.currency}</p>
            <p className="mt-1"><Amount value={b.available} currency={b.currency} size="display" /></p>
            <p className="mt-1 text-sm text-muted">{t("earnings.available.help")}</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-hairline pt-4 sm:grid-cols-3">
              <Tile label={t("earnings.pending")} value={b.pending} currency={b.currency} help={t("earnings.pending.help", { days: holdDays })} />
              <Tile label={t("earnings.inPayout")} value={b.inPayout} currency={b.currency} help={t("earnings.inPayout.help")} />
              <Tile label={t("earnings.paidOut")} value={b.paidOut} currency={b.currency} help={t("earnings.paidOut.help")} />
            </dl>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function Tile({ label, value, currency, help }: { label: string; value: number; currency: string; help: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:block">
      <div>
        <dt className="text-sm font-semibold text-ink">{label}</dt>
        <dd className="mt-0.5 hidden text-sm text-muted sm:block">{help}</dd>
      </div>
      <dd className="sm:mt-1"><Amount value={value} currency={currency} size="large" /></dd>
      <dd className="sr-only sm:hidden">{help}</dd>
    </div>
  )
}
