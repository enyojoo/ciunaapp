import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { Platform } from "react-native"
import { ExternalLinkModal } from "@/components/external-link-modal"
import { openInAppBrowser } from "@/lib/in-app-browser"

type ExternalLinkCtx = {
  openLink: (url: string, title?: string) => Promise<void>
}

const Ctx = createContext<ExternalLinkCtx | null>(null)

export function ExternalLinkProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const waitCloseRef = useRef<(() => void) | null>(null)

  const closeLink = useCallback(() => {
    setIsVisible(false)
    waitCloseRef.current?.()
    waitCloseRef.current = null
    setTimeout(() => {
      setUrl("")
      setTitle("")
    }, 180)
  }, [])

  const openLink = useCallback(async (linkUrl: string, linkTitle?: string) => {
    setUrl(linkUrl)
    setTitle(linkTitle || "")
    if (Platform.OS === "web") {
      setIsVisible(true)
      await new Promise<void>((resolve) => {
        waitCloseRef.current = resolve
      })
      return
    }
    try {
      await openInAppBrowser(linkUrl)
    } catch {
      setIsVisible(true)
    }
  }, [])

  const value = useMemo(() => ({ openLink }), [openLink])

  return (
    <Ctx.Provider value={value}>
      {children}
      <ExternalLinkModal visible={isVisible} url={url} title={title} onClose={closeLink} />
    </Ctx.Provider>
  )
}

export function useExternalLink() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useExternalLink must be used within ExternalLinkProvider")
  return ctx
}
