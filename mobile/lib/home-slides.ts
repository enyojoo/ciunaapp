/**
 * Home slider content. Slides are data: Office will supply this list later (and ads with `ad: true`).
 * Until then these static slides point at the four service lines. Copy comes from the `home.slide.*` keys.
 */
export type HomeSlideArt = "food" | "mart" | "send" | "experts"

export interface HomeSlide {
  id: string
  art: HomeSlideArt
  href: string
  ad?: boolean
}

export const HOME_SLIDES: HomeSlide[] = [
  { id: "send", art: "send", href: "/send" },
  { id: "mart", art: "mart", href: "/hub/mart" },
  { id: "experts", art: "experts", href: "/experts" },
]
