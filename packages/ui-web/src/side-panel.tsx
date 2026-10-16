"use client"
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "./cn"
import { useUiStrings } from "./strings"

/** Right-hand detail panel on desktop; full width on phones. */
export function SidePanel({ open, onOpenChange, title, description, children, footer, className }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children?: React.ReactNode; footer?: React.ReactNode; className?: string }) {
  const strings = useUiStrings()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px]" />
        <Dialog.Content className={cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl outline-none sm:max-w-md", className)}>
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-2 flex size-10 items-center justify-center rounded-full text-muted hover:bg-neutral-surface" aria-label={strings.close}>
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex flex-col-reverse gap-2 border-t border-hairline px-5 py-4 sm:flex-row sm:justify-end">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
