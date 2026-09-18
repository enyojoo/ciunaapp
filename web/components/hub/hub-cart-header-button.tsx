"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { ShoppingCart } from "lucide-react"
import { hubCartItemCount, useHubCartByLine } from "@/lib/hub-cart-client"
import { hubCartPath } from "@/lib/hub-public-paths"

/** Persistent cart entry point in the Food/Mart hero header — always visible, unlike the floating bar which only shows while actively browsing. */
export function HubCartHeaderButton({ lineSlug }: { lineSlug: "food" | "mart" }) {
  const { t } = useTranslation("app")
  const { cart } = useHubCartByLine(lineSlug)
  const count = hubCartItemCount(cart)

  return (
    <Link
      href={hubCartPath(lineSlug)}
      aria-label={t("hub.cart.viewCart", { defaultValue: "View cart" })}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/15 text-white ring-1 ring-white/25 transition hover:bg-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11"
    >
      <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[1.125rem] md:w-[1.125rem] xl:h-5 xl:w-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-orange-700 shadow">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  )
}
