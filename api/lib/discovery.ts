/** Search term handling shared by the search route and its tests. */
export function cleanQuery(raw: string | null): string | null {
  const q = String(raw || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 60)
  return q.length >= 2 ? q : null
}

/** Escape LIKE wildcards and the characters PostgREST treats as filter syntax. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()"]/g, " ")}%`
}

export function matchesTranslations(row: { translations?: any }, q: string): boolean {
  const needle = q.toLowerCase()
  const tr = row.translations
  if (!tr || typeof tr !== "object") return false
  return Object.values(tr).some((v: any) => v && typeof v === "object" && Object.values(v).some((s) => typeof s === "string" && s.toLowerCase().includes(needle)))
}
