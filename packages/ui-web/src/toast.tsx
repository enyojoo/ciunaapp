"use client"
import * as React from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "./cn"

type Toast = { id: number; message: string; tone: "success" | "error" }
const Ctx = React.createContext<{ show: (message: string, tone?: Toast["tone"]) => void }>({ show: () => {} })
export const useToast = () => React.useContext(Ctx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const show = React.useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg", t.tone === "success" ? "bg-ink text-white" : "bg-destructive text-white")}>
            {t.tone === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
