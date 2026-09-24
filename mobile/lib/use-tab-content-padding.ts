import { usePathname } from "expo-router"

function pathnameShowsTabBar(pathname: string): boolean {
  return (
    pathname === "/hub" ||
    pathname.startsWith("/hub/") ||
    pathname === "/transactions" ||
    pathname.startsWith("/transactions/") ||
    pathname === "/more" ||
    pathname.startsWith("/more/")
  )
}

/** Tail padding for tab scroll content (tab bar inset is on the tab scene). */
export function useTabContentPadding(extra = 24): number {
  const pathname = usePathname()

  if (!pathnameShowsTabBar(pathname)) return 40

  return extra
}
