/**
 * The Russian cities where foreigners mostly live, study and work (a short list on purpose: easy to scan, short names).
 * Each is listed by its English name, which is the
 * canonical value stored in delivery zones and on a shopper's device. `ru` is the display name in Russian.
 * Matching ignores case, accents and ё/е, and also accepts the aliases below, so a store that typed "Saint-Petersburg"
 * or "Москва" in its zones still matches a shopper who picked "Moscow".
 */
export type RuCity = { en: string; ru: string }

const RAW: [string, string][] = [
  // The ten shown first: where most foreigners live, study and work.
  ["Moscow", "Москва"], ["Saint Petersburg", "Санкт-Петербург"], ["Kazan", "Казань"], ["Novosibirsk", "Новосибирск"],
  ["Yekaterinburg", "Екатеринбург"], ["Nizhny Novgorod", "Нижний Новгород"], ["Sochi", "Сочи"], ["Krasnodar", "Краснодар"],
  ["Kaliningrad", "Калининград"], ["Vladivostok", "Владивосток"],
  // Other university and business cities with sizeable foreign communities.
  ["Samara", "Самара"], ["Rostov-on-Don", "Ростов-на-Дону"], ["Voronezh", "Воронеж"], ["Volgograd", "Волгоград"], ["Ufa", "Уфа"],
  ["Perm", "Пермь"], ["Krasnoyarsk", "Красноярск"], ["Tomsk", "Томск"], ["Irkutsk", "Иркутск"], ["Tyumen", "Тюмень"],
  ["Chelyabinsk", "Челябинск"], ["Omsk", "Омск"], ["Saratov", "Саратов"], ["Belgorod", "Белгород"], ["Kursk", "Курск"],
  ["Tula", "Тула"], ["Yaroslavl", "Ярославль"], ["Ryazan", "Рязань"], ["Smolensk", "Смоленск"], ["Tver", "Тверь"],
  ["Kaluga", "Калуга"], ["Stavropol", "Ставрополь"], ["Pyatigorsk", "Пятигорск"], ["Astrakhan", "Астрахань"], ["Penza", "Пенза"],
  ["Lipetsk", "Липецк"], ["Ulyanovsk", "Ульяновск"], ["Orenburg", "Оренбург"], ["Barnaul", "Барнаул"], ["Khabarovsk", "Хабаровск"],
  ["Ivanovo", "Иваново"], ["Izhevsk", "Ижевск"], ["Vladimir", "Владимир"], ["Cheboksary", "Чебоксары"], ["Arkhangelsk", "Архангельск"],
  ["Kemerovo", "Кемерово"], ["Makhachkala", "Махачкала"],
]

export const RU_CITIES: RuCity[] = RAW.map(([en, ru]) => ({ en, ru }))

/** The ten biggest, shown first when nothing is typed. */
export const RU_POPULAR_CITIES = RU_CITIES.slice(0, 10)

const ALIASES: Record<string, string> = {
  "st petersburg": "Saint Petersburg", "st. petersburg": "Saint Petersburg", "saint-petersburg": "Saint Petersburg",
  spb: "Saint Petersburg", piter: "Saint Petersburg", leningrad: "Saint Petersburg", петербург: "Saint Petersburg", питер: "Saint Petersburg",
  ekaterinburg: "Yekaterinburg", "nizhniy novgorod": "Nizhny Novgorod", "n. novgorod": "Nizhny Novgorod",
  "rostov on don": "Rostov-on-Don", rostov: "Rostov-on-Don", "ростов": "Rostov-on-Don", "naberezhnyye chelny": "Naberezhnye Chelny",
  "naberezhniye chelny": "Naberezhnye Chelny", "novgorod": "Veliky Novgorod", "orel": "Oryol", "korolev": "Korolyov", "schelkovo": "Shchyolkovo",
  "shchelkovo": "Shchyolkovo", "yoshkar ola": "Yoshkar-Ola", "ulan ude": "Ulan-Ude", "komsomolsk on amur": "Komsomolsk-on-Amur",
}

const fold = (v: string) =>
  v
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim()

const INDEX = new Map<string, string>()
for (const c of RU_CITIES) {
  INDEX.set(fold(c.en), c.en)
  INDEX.set(fold(c.ru), c.en)
  INDEX.set(fold(c.en).replace(/-/g, " "), c.en)
  INDEX.set(fold(c.ru).replace(/-/g, " "), c.en)
}
for (const [alias, en] of Object.entries(ALIASES)) if (RU_CITIES.some((c) => c.en === en)) INDEX.set(fold(alias), en)

/** The canonical English name for any spelling of a listed city, or null when it is not one of ours. */
export function normalizeRuCity(text: string | null | undefined): string | null {
  const key = fold(String(text || ""))
  if (!key) return null
  return INDEX.get(key) ?? INDEX.get(key.replace(/-/g, " ")) ?? null
}

/** Two spellings of the same city, or the same text, count as one place. */
export function sameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = normalizeRuCity(a) ?? fold(String(a || ""))
  const y = normalizeRuCity(b) ?? fold(String(b || ""))
  return Boolean(x) && x === y
}

/** The city's name in the shopper's language: Russian for `ru`, English otherwise. */
export function ruCityLabel(en: string, lang: string): string {
  const c = RU_CITIES.find((x) => x.en === en)
  if (!c) return en
  return lang.toLowerCase().startsWith("ru") ? c.ru : c.en
}

/** Cities whose English or Russian name contains the text. */
export function searchRuCities(query: string): RuCity[] {
  const q = fold(query)
  if (!q) return RU_CITIES
  return RU_CITIES.filter((c) => fold(c.en).includes(q) || fold(c.ru).includes(q))
}
