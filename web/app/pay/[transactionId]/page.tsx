"use client"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
export default function ResumePayment() {
  const { transactionId } = useParams<{ transactionId: string }>(),
    router = useRouter()
  useEffect(() => {
    router.replace(`/hub/orders/${encodeURIComponent(transactionId)}`)
  }, [transactionId, router])
  return null
}
