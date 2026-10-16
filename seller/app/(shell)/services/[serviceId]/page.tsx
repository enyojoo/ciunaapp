"use client"
import { useParams } from "next/navigation"
import { Banner, Button, Skeleton } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { ExpertOnly, useExpertError, type ExpertService } from "@/components/expert/shared"
import { ServiceForm } from "@/components/expert/service-form"

export default function EditServicePage() {
  return <ExpertOnly><Editor /></ExpertOnly>
}

function Editor() {
  const { t } = useT()
  const errText = useExpertError()
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data, error, reload } = useQuery<{ service: ExpertService }>(`expert/service/${serviceId}`, () => api(`/api/merchant/expert/services/${serviceId}`))
  if (data) return <ServiceForm key={data.service.id} service={data.service} />
  if (error) return <Banner tone="destructive" title={errText(error)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
  return <div className="space-y-3"><Skeleton className="h-10 w-56" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
}
