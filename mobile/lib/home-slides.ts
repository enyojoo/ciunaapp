/**
 * Home hero: Ciuna's promise in three short statements, never a repeat of the service grid under it. Statements, not
 * calls to action, so the slides carry no buttons. Copy: `home.slide.<id>.title|body`. Office will supply paid
 * slides later (`ad: true`, with an `href`).
 */
export type HomeSlideId = "sorted" | "community" | "language"

export interface HomeSlide {
  id: HomeSlideId
  /** Only paid or linked slides open something; the promise slides do not. */
  href?: string
  ad?: boolean
}

export const HOME_SLIDES: HomeSlide[] = [{ id: "sorted" }, { id: "community" }, { id: "language" }]
