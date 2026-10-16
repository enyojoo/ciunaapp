/** A language's name in the viewer's own language ("ru" -> "Russian" / "русский"), falling back to the code. */
export function languageName(code: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(code)
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code
  } catch {
    return code
  }
}
