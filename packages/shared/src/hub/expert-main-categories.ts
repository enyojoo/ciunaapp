/**
 * The eight fixed needs the customer apps group experts by. Stored on expert_profiles.main_category (the database
 * check lists the same ids) and set in Office. Customer-facing names live in the app locales under
 * `experts.cat.<id>.title`; the English labels here are for Office.
 */
export const EXPERT_MAIN_CATEGORIES = [
  { id: "documents", label: "Documents and visas" },
  { id: "translation", label: "Translation" },
  { id: "education", label: "Education" },
  { id: "work", label: "Work and business" },
  { id: "housing", label: "Housing" },
  { id: "health", label: "Health" },
  { id: "beauty", label: "Hair and beauty" },
  { id: "errands", label: "Errands" },
] as const

export type ExpertMainCategoryId = (typeof EXPERT_MAIN_CATEGORIES)[number]["id"]

const IDS = new Set<string>(EXPERT_MAIN_CATEGORIES.map((c) => c.id))

export function isExpertMainCategoryId(v: unknown): v is ExpertMainCategoryId {
  return typeof v === "string" && IDS.has(v)
}
