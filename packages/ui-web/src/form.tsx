"use client"
import * as React from "react"
import { cn } from "./cn"

const control =
  "w-full rounded-xl border border-input-edge bg-white px-3.5 text-[15px] text-ink placeholder:text-subtle outline-none transition-shadow focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-neutral-surface aria-[invalid=true]:border-destructive-text"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = "text", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(control, "h-11", className)} {...props} />
))
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, rows = 4, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(control, "min-h-24 py-2.5", className)} {...props} />
))
Textarea.displayName = "Textarea"

/** Native select: best phone experience (system picker), keyboard accessible, no extra JS. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2352596B' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
    {children}
  </select>
))
Select.displayName = "Select"

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-ink", className)} {...props} />
}

/** Label above, control, helper or error below. The control is cloned with id, aria-invalid and aria-describedby. */
export function Field({ label, hint, error, required, children, className }: { label: string; hint?: string; error?: string | null; required?: boolean; children: React.ReactElement<any>; className?: string }) {
  const id = React.useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-xs font-medium text-muted">Required</span> : null}
      </Label>
      {React.cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-destructive-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Switch({ checked, onCheckedChange, label, disabled, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-input-edge bg-white",
      )}
    >
      <span className={cn("block size-5 rounded-full transition-transform", checked ? "translate-x-6 bg-ink" : "translate-x-1 bg-input-edge")} />
    </button>
  )
}
