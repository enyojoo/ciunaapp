import { createContext, useContext, type ReactNode } from "react"
import { Text, type TextProps } from "react-native"
import { colors } from "@/lib/theme"

const QueryContext = createContext("")

/** Search provides the current query; any `Highlighted` text below it marks the matching part. */
export function HighlightProvider({ query, children }: { query: string; children: ReactNode }) {
  return <QueryContext.Provider value={query.trim()}>{children}</QueryContext.Provider>
}

/** Text that marks where the search query matches (case-insensitive). Outside search it is plain text. */
export function Highlighted({ text, ...rest }: { text: string } & TextProps) {
  const query = useContext(QueryContext)
  const at = query.length >= 2 ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (at < 0) return <Text {...rest}>{text}</Text>
  return (
    <Text {...rest}>
      {text.slice(0, at)}
      <Text style={{ backgroundColor: colors.primaryTint, color: colors.primaryText }}>{text.slice(at, at + query.length)}</Text>
      {text.slice(at + query.length)}
    </Text>
  )
}
