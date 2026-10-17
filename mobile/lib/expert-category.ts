import type { IconName } from "@/components/ui/icon"
import type { ExpertCatalogService, ExpertProfile } from "@/lib/types"

/**
 * The main Experts categories: what people living in Russia most often need help with. Each has its own colour and
 * glyph and a page listing its experts and services. Copy: `experts.cat.<id>.title|blurb`.
 *
 * Office sets the main category on each expert (expert_profiles.main_category, ids in @ciuna/shared
 * EXPERT_MAIN_CATEGORIES). For an expert without one yet, we guess by matching keywords (in all six app languages)
 * against their free-text category and headline; anything unmatched lands in `errands`.
 */
export type MainCategoryId = "documents" | "translation" | "education" | "work" | "housing" | "health" | "beauty" | "errands"

export interface MainCategory {
  id: MainCategoryId
  icon: IconName
  /** Soft ground for the tile and page header. */
  bg: string
  /** Glyph and accent on that ground (6:1 or better). */
  fg: string
  words: string[]
}

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: "documents",
    icon: "shield",
    bg: "#EFF6FF",
    fg: "#1E40AF",
    words: ["immigra", "migra", "visa", "permit", "residen", "citizen", "registr", "patent", "legal", "law", "lawyer", "миграц", "виз", "внж", "рвп", "гражданств", "регистрац", "патент", "юрист", "юрид", "inmigra", "visado", "résiden", "avocat", "advogad", "移民", "签证", "居留", "律师", "法律"],
  },
  {
    id: "translation",
    icon: "translate",
    bg: "#F5F3FF",
    fg: "#5B21B6",
    words: ["translat", "interpret", "notar", "apostil", "перевод", "нотари", "апостил", "traduc", "tradu", "翻译", "公证"],
  },
  {
    id: "education",
    icon: "experts",
    bg: "#FEFCE8",
    fg: "#854D0E",
    words: ["educat", "lesson", "tutor", "teach", "school", "universit", "admission", "exam", "ielts", "toefl", "language", "russian", "course", "образов", "урок", "репетит", "экзам", "поступлен", "университет", "язык", "курс", "educa", "clase", "cours", "aula", "教育", "课", "考试", "大学", "语言"],
  },
  {
    id: "work",
    icon: "briefcase",
    bg: "#ECFDF5",
    fg: "#065F46",
    words: ["job", "career", "develop", "engineer", "design", "разработ", "инженер", "дизайн", "desarroll", "ingenier", "développ", "ingénieur", "desenvolv", "engenheir", "开发", "工程师", "设计", "cv", "resume", "business", "company", "account", "tax", "finance", "consult", "it", "tech", "computer", "software", "работ", "карьер", "резюме", "бизнес", "компани", "бухгалт", "налог", "консульт", "айти", "компьют", "trabajo", "negocio", "emploi", "entreprise", "trabalho", "工作", "简历", "公司", "会计", "税", "咨询", "电脑", "技术"],
  },
  {
    id: "housing",
    icon: "home",
    bg: "#FFF7ED",
    fg: "#9A3412",
    words: ["housing", "apartment", "flat", "rent", "realtor", "real estate", "moving", "relocat", "жиль", "квартир", "аренд", "риелтор", "переезд", "vivienda", "alquiler", "logement", "location", "moradia", "aluguel", "住房", "租房", "公寓", "搬家"],
  },
  {
    id: "health",
    icon: "heart",
    bg: "#FEF2F2",
    fg: "#991B1B",
    words: ["health", "doctor", "medic", "clinic", "dentist", "therap", "psycholog", "nurse", "здоров", "врач", "медиц", "клиник", "стомат", "психолог", "salud", "médic", "santé", "saúde", "健康", "医生", "医疗", "牙", "心理"],
  },
  {
    id: "beauty",
    icon: "scissors",
    bg: "#FDF2F8",
    fg: "#9D174D",
    words: ["hair", "barber", "braid", "beauty", "nail", "makeup", "stylist", "salon", "волос", "барбер", "парикмах", "косич", "красот", "маникюр", "макияж", "peluq", "belleza", "coiff", "beauté", "cabel", "beleza", "美发", "理发", "美容", "美甲", "化妆"],
  },
  {
    id: "errands",
    icon: "walk",
    bg: "#F3F4F6",
    fg: "#374151",
    words: ["errand", "courier", "delivery", "pickup", "shopping", "queue", "cleaning", "handyman", "поручен", "курьер", "доставк", "покупк", "уборк", "мастер на час", "encargo", "mandado", "recado", "coursier", "ménage", "faxina", "跑腿", "代购", "快递", "清洁"],
  },
]

const BY_ID = new Map(MAIN_CATEGORIES.map((c) => [c.id, c]))

export function mainCategory(id: MainCategoryId): MainCategory {
  return BY_ID.get(id) ?? BY_ID.get("errands")!
}

export function isMainCategoryId(id: string): id is MainCategoryId {
  return BY_ID.has(id as MainCategoryId)
}

/** The main category for some free text (Office category first, then headline or title). */
export function mainCategoryOf(...texts: (string | null | undefined)[]): MainCategoryId {
  for (const text of texts) {
    const c = ` ${String(text || "").trim().toLowerCase()} `
    if (c.trim() === "") continue
    for (const cat of MAIN_CATEGORIES) {
      if (cat.words.some((w) => (w.length <= 3 ? new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "u").test(c) : c.includes(w)))) return cat.id
    }
  }
  return "errands"
}

/** Where an expert appears: the category set in Office, or a keyword guess for experts not set yet. */
export const expertMainCategory = (e: Pick<ExpertProfile, "category" | "headline" | "main_category">): MainCategoryId =>
  e.main_category && isMainCategoryId(e.main_category) ? e.main_category : mainCategoryOf(e.category, e.headline)

/** A service sits with its expert's category when Office has set one, otherwise by keyword on its own text. */
export const serviceMainCategory = (s: ExpertCatalogService): MainCategoryId =>
  s.expert.main_category && isMainCategoryId(s.expert.main_category)
    ? s.expert.main_category
    : mainCategoryOf(s.expert.category, s.title, s.short_description)

