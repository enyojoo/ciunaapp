import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "./cn"

/** Orange fills carry ink labels, never white (design-system README, principle 2). */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
        secondary: "border border-input-edge bg-white text-ink hover:bg-neutral-surface",
        ghost: "text-ink hover:bg-neutral-surface",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[15px] [&_svg]:size-4",
        sm: "h-9 rounded-lg px-3 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  busy?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, busy, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
      {asChild ? children : (
        <>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {children}
        </>
      )}
    </Comp>
  )
})
Button.displayName = "Button"
