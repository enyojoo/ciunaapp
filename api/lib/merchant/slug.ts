export function slugify(input: string): string {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function withSuffix(base: string, attempt: number): string {
  const root = base || "shop"
  if (attempt === 0) return root
  return `${root}-${Math.random().toString(36).slice(2, 6)}`
}
