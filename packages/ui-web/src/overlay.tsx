"use client"
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "./cn"
import { Button } from "./button"

/** Bottom sheet on phones, centred dialog from `sm`. */
export function Sheet({ open, onOpenChange, title, description, children, footer }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex max-h-[90dvh] flex-col bg-white shadow-xl outline-none",
            "inset-x-0 bottom-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:pb-0",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-2 flex size-10 items-center justify-center rounded-full text-muted hover:bg-neutral-surface" aria-label="Close">
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

/** Confirmation that asks a direct question and names the action on its button. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = "Cancel", destructive, busy, onConfirm, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: () => void; children?: React.ReactNode }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Sheet>
  )
}
