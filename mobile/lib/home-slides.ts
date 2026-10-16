/**
 * Home banner content: what Ciuna is for, not what the services do (the tiles already show those).
 * Ciuna is a home for people living abroad: money, groceries and people from home, in one place.
 * Banners are data; Office will supply paid ads later (`ad: true`). Copy: `home.slide.<id>.*`.
 */
export type HomeSlideTone = "warm" | "teal" | "blue"

export interface HomeSlide {
  id: string
  tone: HomeSlideTone
  href: string
  ad?: boolean
}

export const HOME_SLIDES: HomeSlide[] = [
  { id: "belong", tone: "warm", href: "/hub" },
  { id: "language", tone: "teal", href: "/experts" },
  { id: "family", tone: "blue", href: "/send" },
]
