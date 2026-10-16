"use client"

import * as React from "react"
import { Drawer as DrawerVaul } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = DrawerVaul.Root

const DrawerTrigger = DrawerVaul.Trigger

const DrawerPortal = DrawerVaul.Portal

const DrawerClose = DrawerVaul.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerVaul.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerVaul.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerVaul.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/40", className)} {...props} />
))
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerVaul.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerVaul.Content>
>(({ className, children, onOpenAutoFocus, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerVaul.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92vh,900px)] min-h-0 flex-col rounded-t-2xl border bg-background pb-[env(safe-area-inset-bottom,0px)] outline-none",
        className
      )}
      {...props}
      tabIndex={-1}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
        ;(event.currentTarget as HTMLElement | null)?.focus()
      }}
    >
      <DrawerVaul.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
      {children}
    </DrawerVaul.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 px-4 pt-1 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerVaul.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerVaul.Title>
>(({ className, ...props }, ref) => (
  <DrawerVaul.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerVaul.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerVaul.Description>
>(({ className, ...props }, ref) => (
  <DrawerVaul.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
