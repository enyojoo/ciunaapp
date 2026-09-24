import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import {
  triggerAllOfficeConfigRevalidate,
  triggerOfficeConfigRevalidate,
  type OfficeConfigTopic,
} from "@/lib/config-revalidate-bus"
import { supabase } from "@/lib/supabase"
import { useRevalidateOnForeground } from "@/lib/use-revalidate-on-foreground"

const DEBOUNCE_MS = 350

/**
 * One app-wide Supabase Realtime listener for Office-owned tables (FX, payment
 * rails, hub tiles, platform flags). Matches Office admin live refresh behavior.
 */
export function OfficeConfigLiveSync() {
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useRevalidateOnForeground(() => {
    triggerAllOfficeConfigRevalidate()
  })

  useEffect(() => {
    const schedule = (topic: OfficeConfigTopic) => {
      const existing = debounceRef.current[topic]
      if (existing) clearTimeout(existing)
      debounceRef.current[topic] = setTimeout(() => {
        delete debounceRef.current[topic]
        triggerOfficeConfigRevalidate(topic)
      }, DEBOUNCE_MS)
    }

    const channel: RealtimeChannel = supabase
      .channel("mobile-office-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "currencies" },
        () => schedule("fx"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchange_rates" },
        () => schedule("fx"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_methods" },
        () => schedule("paymentMethods"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_settings" },
        () => schedule("publicFlags"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hub_service_lines" },
        () => schedule("hubServiceLines"),
      )
      .subscribe()

    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout)
      debounceRef.current = {}
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
