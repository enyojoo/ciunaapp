"use client"

import { useCallback, useMemo, useState, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { stashRedirectAfterLogin } from "@/lib/auth-login-redirect"
import { HubProductVendorChipLight } from "@/components/hub/hub-product-vendor-chip-light"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { HubProductRow } from "@/lib/hub-types"
import {
  amountPrefixClass,
  HubCatalogFixedPrice,
  renderUserInputRangeLabel,
  sortHubCatalogProducts,
} from "@/lib/hub-catalog-utils"
import { hubGenericCheckoutPath, hubMarketplaceCheckoutPath, isHubMarketplaceLineSlug } from "@/lib/hub-public-paths"
import { addToHubCart, updateHubCartItemQuantity, useHubCart } from "@/lib/hub-cart-client"
import { toast } from "sonner"

const ALL_CATEGORIES_VALUE = "__all__"

export function VendorHubCatalog({
  products,
  loading,
  vendorBasePath,
  lineSlug,
  vendorId,
  showVendorChip = true,
}: {
  products: HubProductRow[]
  loading: boolean
  /** e.g. `/food/v/acme` — category query is appended here */
  vendorBasePath: string
  lineSlug: string
  /** When set (and `lineSlug` is `food`/`mart`), fixed-price cards get Add-to-cart instead of linking to checkout. */
  vendorId?: string | null
  /** When false (single-vendor storefront), hide redundant vendor row on each card. */
  showVendorChip?: boolean
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const pathname = usePathname() || ""
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const selectedCategory = (searchParams.get("category") || "").trim()
  const line = String(lineSlug || "").trim().toLowerCase()
  const cartMode = Boolean(vendorId) && isHubMarketplaceLineSlug(line)
  const { cart } = useHubCart(cartMode ? vendorId : null)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const productCheckoutHref = (productId: string) =>
    isHubMarketplaceLineSlug(line) ? hubMarketplaceCheckoutPath(line, productId) : hubGenericCheckoutPath(productId)

  const cartItemFor = useCallback(
    (productId: string) => cart?.items.find((i) => i.hub_product_id === productId) || null,
    [cart],
  )

  const handleAddToCart = useCallback(
    async (product: HubProductRow) => {
      if (!vendorId) return
      setPendingProductId(product.id)
      try {
        const { clearedVendorName } = await addToHubCart({
          vendorId,
          serviceLineSlug: line as "food" | "mart",
          hubProductId: product.id,
        })
        if (clearedVendorName) {
          toast(t("hub.cart.startedNewCart", { defaultValue: "Started a new cart" }), {
            description: t("hub.cart.clearedOtherVendor", {
              defaultValue: "Your {{vendor}} cart was cleared.",
              vendor: clearedVendorName,
            }),
          })
        }
      } catch (e) {
        toast.error(t("hub.cart.addFailed", { defaultValue: "Couldn't add to cart" }), {
          description: e instanceof Error ? e.message : undefined,
        })
      } finally {
        setPendingProductId(null)
      }
    },
    [vendorId, line, t],
  )

  const handleQuantityChange = useCallback(
    async (itemId: string, quantity: number) => {
      if (!vendorId) return
      setPendingProductId(itemId)
      try {
        await updateHubCartItemQuantity(vendorId, itemId, quantity)
      } catch (e) {
        toast.error(t("hub.cart.updateFailed", { defaultValue: "Couldn't update cart" }), {
          description: e instanceof Error ? e.message : undefined,
        })
      } finally {
        setPendingProductId(null)
      }
    },
    [vendorId, t],
  )

  const returnPath = useMemo(() => {
    const q = searchParams.toString()
    return (q ? `${pathname}?${q}` : pathname) || "/hub"
  }, [pathname, searchParams])

  const onGuestProductNav = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      stashRedirectAfterLogin(returnPath)
      router.push("/auth/login")
    },
    [returnPath, router],
  )

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      const c = (p.category || "").trim()
      if (c) set.add(c)
    }
    const sorted = [...set].sort((a, b) => a.localeCompare(b))
    if (selectedCategory && !sorted.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())) {
      sorted.unshift(selectedCategory)
    }
    return sorted
  }, [products, selectedCategory])

  const categorySelectValue = useMemo(() => {
    if (!selectedCategory) return ALL_CATEGORIES_VALUE
    const q = selectedCategory.toLowerCase()
    for (const c of categoryOptions) {
      if (c.toLowerCase() === q) return c
    }
    return selectedCategory
  }, [selectedCategory, categoryOptions])

  const orderedProducts = useMemo(() => sortHubCatalogProducts(products), [products])

  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return orderedProducts
    const q = selectedCategory.toLowerCase()
    return orderedProducts.filter((p) => (p.category || "").trim().toLowerCase() === q)
  }, [orderedProducts, selectedCategory])

  const onCategoryFilterChange = useCallback(
    (value: string) => {
      if (value === ALL_CATEGORIES_VALUE) {
        router.replace(vendorBasePath)
        return
      }
      router.replace(`${vendorBasePath}?category=${encodeURIComponent(value)}`)
    },
    [router, vendorBasePath],
  )

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <div className="h-7 min-w-0 flex-1 max-w-[40%] rounded bg-muted" />
          <div className="h-10 w-44 shrink-0 rounded-md bg-muted sm:w-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] max-h-[220px] rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return <div className="py-12 text-center text-sm text-muted-foreground">{t("hub.noProducts")}</div>
  }

  return (
    <section className="space-y-6">
      <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground sm:text-xl">
          {t("hub.marketplaceProductsHeading", { defaultValue: "Products" })}
        </h2>
        <div className="shrink-0 basis-44 sm:basis-56 w-44 sm:w-56 min-w-0">
          <Select value={categorySelectValue} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="max-w-full" aria-label={t("hub.categoryFilterAria")}>
              <SelectValue placeholder={t("hub.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>{t("hub.allCategories")}</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="space-y-3 py-12 text-center text-sm text-muted-foreground">
          <p>{t("hub.noProductsInCategory")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => onCategoryFilterChange(ALL_CATEGORIES_VALUE)}>
            {t("hub.allCategories")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {visibleProducts.map((p) => (
            <Card
              key={p.id}
              className="group h-full gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white py-0 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-300/70 motion-safe:hover:shadow-[0_18px_36px_rgba(15,23,42,0.14)]"
            >
              <CardContent className="flex h-full flex-col p-0">
                {(() => {
                  const isCartItem = cartMode && p.pricing_type === "fixed"
                  const media = (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="absolute inset-0 h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-gray-500">
                          {t("hub.noImage")}
                        </div>
                      )}
                      <div className="absolute right-2 top-1">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-1 py-0.5 text-[7px] font-medium text-gray-700 backdrop-blur sm:px-1.5 sm:text-[8px]">
                          {p.category || "Other"}
                        </span>
                      </div>
                    </div>
                  )
                  return isCartItem ? (
                    media
                  ) : (
                    <Link
                      href={user ? productCheckoutHref(p.id) : "/auth/login"}
                      prefetch={Boolean(user)}
                      onClick={user ? undefined : onGuestProductNav}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    >
                      {media}
                    </Link>
                  )
                })()}
                <div className="flex flex-1 flex-col gap-1 px-2.5 pb-1.5 pt-2 sm:px-3 sm:pb-2 sm:pt-2">
                  {(() => {
                    const isCartItem = cartMode && p.pricing_type === "fixed"
                    const titleBlock = (
                      <>
                        <p className="line-clamp-1 text-[13px] font-semibold leading-snug text-gray-900 transition-colors group-hover/title:text-orange-700 sm:text-sm">
                          {p.title}
                        </p>
                        {p.fulfillment_mode === "delivery" || p.fulfillment_mode === "pickup" ? (
                          <p className="mt-1 text-[11px] font-medium capitalize text-orange-700/90">
                            {String(p.fulfillment_mode).replace(/_/g, " ")}
                          </p>
                        ) : null}
                        {p.short_description ? (
                          <p className="mb-2 mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 sm:text-sm">{p.short_description}</p>
                        ) : null}
                      </>
                    )
                    return isCartItem ? (
                      <div className="min-w-0">{titleBlock}</div>
                    ) : (
                      <Link
                        href={user ? productCheckoutHref(p.id) : "/auth/login"}
                        prefetch={Boolean(user)}
                        onClick={user ? undefined : onGuestProductNav}
                        className="group/title block min-w-0"
                      >
                        {titleBlock}
                      </Link>
                    )
                  })()}
                  {showVendorChip && p.vendor ? (
                    <div className="mb-1">
                      <HubProductVendorChipLight vendor={p.vendor} className="max-w-full" />
                    </div>
                  ) : null}
                  <div className="mt-auto flex flex-col gap-1.5 pt-3">
                    {p.pricing_type === "fixed" ? (
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span className={amountPrefixClass}>
                          {(() => {
                            const label = t("hub.sellPrice")
                            return label === "hub.sellPrice" ? "Sell price" : label
                          })()}
                        </span>
                        <HubCatalogFixedPrice product={p} />
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        {renderUserInputRangeLabel(
                          p.funded_min,
                          p.funded_max,
                          p.default_input_currency || p.fixed_currency || "USD",
                          t,
                        )}
                      </div>
                    )}
                    {cartMode && p.pricing_type === "fixed" ? (
                      (() => {
                        const item = cartItemFor(p.id)
                        const isPending = pendingProductId === p.id
                        const disabled = isPending || p.sold_out || (p.stock_quantity != null && p.stock_quantity <= 0)
                        if (!item || item.quantity <= 0) {
                          return (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 w-full rounded-xl text-xs font-semibold"
                              disabled={disabled}
                              onClick={() => handleAddToCart(p)}
                            >
                              {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : disabled ? (
                                t("hub.soldOut", { defaultValue: "Sold out" })
                              ) : (
                                <>
                                  <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                                  {t("hub.cart.addToCart", { defaultValue: "Add to cart" })}
                                </>
                              )}
                            </Button>
                          )
                        }
                        return (
                          <div className="flex h-8 w-full items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-1">
                            <button
                              type="button"
                              aria-label={t("hub.cart.decrease", { defaultValue: "Decrease quantity" })}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                              disabled={isPending}
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-xs font-semibold tabular-nums text-orange-800">
                              {isPending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={t("hub.cart.increase", { defaultValue: "Increase quantity" })}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                              disabled={isPending}
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })()
                    ) : (
                      <Button asChild size="sm" className="h-8 w-full rounded-xl text-xs font-semibold">
                        <Link
                          href={user ? productCheckoutHref(p.id) : "/auth/login"}
                          prefetch={Boolean(user)}
                          onClick={user ? undefined : onGuestProductNav}
                        >
                          {t("hub.order")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
