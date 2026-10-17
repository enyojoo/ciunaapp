import { Button } from "@/components/ui/button"

/**
 * Legacy entry point kept so existing screens pick up the new button (press feedback, haptics, sizes) without a
 * rewrite. New code imports `Button` from `@/components/ui`.
 */
export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  variant = "primary",
}: {
  label: string
  onPress?: () => void
  busy?: boolean
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  return <Button label={label} onPress={onPress} busy={busy} disabled={disabled} variant={variant === "danger" ? "dangerGhost" : variant} />
}
