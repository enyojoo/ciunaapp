import { type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Link, useRouter, type Href } from "expo-router"
import { ArrowLeft, Eye, EyeOff, HelpCircle } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import Svg, { Path } from "react-native-svg"
import { BRAND } from "@ciuna/shared"
import { useToast } from "@/components/toast-provider"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function useAuthBack() {
  const router = useRouter()
  return () => {
    if (router.canGoBack()) router.back()
    else router.replace("/auth/login")
  }
}

export function AuthTopBar({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation("app")
  const { showInfo } = useToast()
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.iconHit} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <ArrowLeft size={22} color={colors.primary} strokeWidth={2} />
        </Pressable>
      ) : (
        <View style={styles.iconHit} />
      )}
      <Pressable
        onPress={() =>
          showInfo(
            t("auth.helpToast", {
              defaultValue: "Need assistance? Contact support at {{email}}",
              email: BRAND.email,
            }),
          )
        }
        style={styles.iconHit}
        accessibilityRole="button"
        accessibilityLabel="Help"
        hitSlop={8}
      >
        <View style={styles.helpCircle}>
          <HelpCircle size={20} color={colors.text} strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  )
}

export function AuthTitle({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return <Text style={compact ? styles.titleCompact : styles.title}>{children}</Text>
}

export function AuthSubtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>
}

export function SocialAuth({
  googleLabel,
  appleLabel,
  orLabel,
  onGoogle,
  onApple,
  disabled,
}: {
  googleLabel: string
  appleLabel: string
  orLabel: string
  onGoogle: () => void
  onApple: () => void
  disabled?: boolean
}) {
  return (
    <View>
      <AppleSignInButton label={appleLabel} onPress={onApple} disabled={disabled} />
      <GoogleOutlineButton label={googleLabel} onPress={onGoogle} disabled={disabled} />
      <OrDivider label={orLabel} />
    </View>
  )
}

export function GoogleOutlineButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.socialBtn, disabled && styles.disabled]}>
        <GoogleMark />
        <Text style={styles.socialLabel}>{label}</Text>
      </View>
    </Pressable>
  )
}

export function AppleSignInButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.appleWrap}
    >
      <View style={[styles.socialBtn, disabled && styles.disabled]}>
        <AppleMark />
        <Text style={styles.socialLabel}>{label}</Text>
      </View>
    </Pressable>
  )
}

export function OrDivider({ label = "Or" }: { label?: string }) {
  return (
    <View style={styles.orWrap}>
      <View style={styles.orLine} />
      <Text style={styles.orLabel}>{label}</Text>
      <View style={styles.orLine} />
    </View>
  )
}

export function AuthFooter({ prompt, href, action }: { prompt: string; href: Href; action: string }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerMuted}>{prompt} </Text>
      <Link href={href} asChild>
        <Pressable hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={styles.footerLink}>{action}</Text>
        </Pressable>
      </Link>
    </View>
  )
}

export function PasswordEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.eye} accessibilityRole="button" accessibilityLabel={show ? "Hide password" : "Show password"}>
      {show ? <EyeOff size={18} color={colors.muted} strokeWidth={2} /> : <Eye size={18} color={colors.muted} strokeWidth={2} />}
    </Pressable>
  )
}

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  )
}

function AppleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill={colors.text}
        d="M16.37 12.76c.03-2.53 2.07-3.75 2.16-3.8-1.18-1.72-3.01-1.96-3.66-1.98-1.56-.16-3.04.92-3.83.92-.79 0-2.01-.9-3.31-.87-1.7.02-3.27 1-4.14 2.53-1.77 3.06-.45 7.59 1.27 10.07.84 1.21 1.84 2.57 3.15 2.52 1.26-.05 1.74-.82 3.26-.82 1.52 0 1.95.82 3.28.79 1.36-.02 2.22-1.23 3.05-2.45.96-1.4 1.36-2.76 1.38-2.83-.03-.01-2.65-1.02-2.68-4.08zM14.5 6.4c.7-.84 1.16-2.01 1.04-3.18-1 .04-2.22.67-2.94 1.51-.64.74-1.21 1.94-1.06 3.08 1.12.09 2.27-.57 2.96-1.41z"
      />
    </Svg>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  iconHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  helpCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    fontSize: typeSize.title,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 24,
  },
  titleCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typeSize.body,
    lineHeight: 22,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 8,
  },
  socialBtn: {
    minHeight: space.tap,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  socialLabel: { marginLeft: 10, fontSize: typeSize.body, fontWeight: "500", color: colors.text },
  appleWrap: { marginBottom: 12 },
  disabled: { opacity: 0.45 },
  orWrap: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orLabel: {
    paddingHorizontal: 12,
    fontSize: typeSize.meta,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerMuted: { fontSize: typeSize.meta, color: colors.muted },
  footerLink: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  eye: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
})
