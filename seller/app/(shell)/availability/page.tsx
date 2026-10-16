"use client"
import * as React from "react"
import Link from "next/link"
import { Clock } from "lucide-react"
import { Banner, Button, Card, EmptyState, Field, PageHeader, Select, Skeleton } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { ExpertOnly, useExpertError, useServices } from "@/components/expert/shared"
import { AvailabilityEditor, type ScheduleData } from "@/components/expert/availability-editor"
import { TimeOffPanel } from "@/components/expert/time-off-panel"
import { UpcomingSlots } from "@/components/expert/upcoming-slots"

export default function AvailabilityPage() {
  return <ExpertOnly><Availability /></ExpertOnly>
}

function Availability() {
  const { t } = useT()
  const errText = useExpertError()
  const { data, error, loading, reload } = useServices()
  const [picked, setPicked] = React.useState<string | null>(null)
  const [token, setToken] = React.useState(0)
  const services = data?.services ?? []
  const service = services.find((s) => s.id === picked) ?? services[0]
  const sched = useQuery<ScheduleData>(service ? `expert/schedule/${service.id}` : null, () => api(`/api/merchant/expert/services/${service!.id}/schedule`))
  const [saved, setSaved] = React.useState<ScheduleData | null>(null)
  React.useEffect(() => setSaved(null), [service?.id])
  const current = saved ?? sched.data
  const zone = current?.schedule?.timezone ?? service?.timezone ?? "UTC"

  return (
    <div>
      <PageHeader title={t("expert.avail.title")} description={t("expert.avail.subtitle")} />
      {loading ? <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-64" /></div>
        : error && !data ? <Banner tone="destructive" title={errText(error)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
        : !service ? <Card><EmptyState icon={<Clock />} title={t("expert.avail.noservice.title")} description={t("expert.avail.noservice.body")} action={<Button asChild><Link href="/services/new">{t("expert.services.add")}</Link></Button>} /></Card>
        : (
          <div className="space-y-4">
            {services.length > 1 ? (
              <Field label={t("expert.avail.service")}>
                <Select value={service.id} onChange={(e) => setPicked(e.target.value)}>{services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</Select>
              </Field>
            ) : null}
            {sched.error && !sched.data ? <Banner tone="destructive" title={errText(sched.error)} action={<Button size="sm" variant="secondary" onClick={() => void sched.reload()}>{t("action.retry")}</Button>} />
              : sched.loading ? <Skeleton className="h-64" />
              : (
                <>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
                    <AvailabilityEditor key={service.id} service={service} data={current} onSaved={(d) => { setSaved(d); setToken((n) => n + 1); void reload() }} />
                    <div className="space-y-4">
                      <TimeOffPanel services={services} zone={zone} defaultServiceId={service.id} onDone={() => setToken((n) => n + 1)} />
                      <UpcomingSlots serviceId={service.id} zone={zone} refreshToken={token} />
                    </div>
                  </div>
                </>
              )}
          </div>
        )}
    </div>
  )
}
