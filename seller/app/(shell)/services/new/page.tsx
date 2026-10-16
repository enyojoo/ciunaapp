"use client"
import { ExpertOnly } from "@/components/expert/shared"
import { ServiceForm } from "@/components/expert/service-form"

export default function NewServicePage() {
  return <ExpertOnly><ServiceForm service={null} /></ExpertOnly>
}
