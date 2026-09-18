/** Featured first, then `updated_at` descending. Works when `is_featured` is absent (treated as false). */
export function sortHubProductRows<T extends { is_featured?: boolean | null; updated_at: string }>(rows: T[]): T[] {
  return [...(rows || [])].sort((a, b) => {
    const fa = a.is_featured ? 1 : 0
    const fb = b.is_featured ? 1 : 0
    if (fb !== fa) return fb - fa
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}
