import { useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { AuthSubtitle, AuthTitle, AuthTopBar, useAuthBack } from "@/components/auth-chrome"
import { Field } from "@/components/field"
import { OtpCodeInput } from "@/components/otp-code-input"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { apiFetch } from "@/lib/api"
import { setResetSession } from "@/lib/reset-session"
import { colors, type as typeSize } from "@/lib/theme"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const onAuthBack = useAuthBack()
  const { showError, showInfo } = useToast()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const verifying = useRef(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendCooldown])

  const onBack = () => {
    if (step === "otp") {
      setStep("email")
      setOtp("")
      setResendCooldown(0)
      return
    }
    onAuthBack()
  }

  const sendCode = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      showError(t("auth.enterEmail", { defaultValue: "Enter your email" }))
      return false
    }
    if (!EMAIL_RE.test(trimmed)) {
      showError(t("auth.enterEmailAddress", { defaultValue: "Enter your email address" }))
      return false
    }
    setBusy(true)
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) {
        showError(t("auth.genericError", { defaultValue: "Unable to send verification code. Please try again." }))
        return false
      }
      return true
    } catch {
      showError(t("auth.genericError", { defaultValue: "An error occurred. Please try again." }))
      return false
    } finally {
      setBusy(false)
    }
  }

  const onEmailSubmit = async () => {
    const ok = await sendCode()
    if (!ok) return
    setStep("otp")
    setOtp("")
    setResendCooldown(60)
  }

  const onVerify = async (code?: string) => {
    const digits = (code ?? otp).replace(/\D/g, "").slice(0, 6)
    if (digits.length !== 6) {
      showError(t("auth.enterAllDigits", { defaultValue: "Please enter all 6 digits" }))
      return
    }
    if (verifying.current) return
    verifying.current = true
    setBusy(true)
    try {
      const res = await apiFetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: digits }),
      })
      const body = (await res.json().catch(() => ({}))) as { resetToken?: string; error?: string }
      if (!res.ok || !body.resetToken) {
        showError(body.error || t("auth.invalidOtp", { defaultValue: "Invalid code. Please try again." }))
        return
      }
      setResetSession({ email: email.trim(), resetToken: body.resetToken })
      router.replace("/auth/reset-password")
    } catch {
      showError(t("auth.genericError", { defaultValue: "An error occurred. Please try again." }))
    } finally {
      verifying.current = false
      setBusy(false)
    }
  }

  const onResend = async () => {
    if (resendCooldown > 0 || busy) return
    const ok = await sendCode()
    if (!ok) return
    setOtp("")
    showInfo(t("auth.newCodeSent", { defaultValue: "New code sent to your email address." }))
    setResendCooldown(60)
  }

  return (
    <ScreenScroll keyboard contentStyle={styles.content}>
      <AuthTopBar onBack={onBack} />
      <AuthTitle compact>
        {step === "email"
          ? t("auth.forgotPasswordTitle", { defaultValue: "Forgot Password" })
          : t("auth.enterCodeTitle", { defaultValue: "Enter Verification Code" })}
      </AuthTitle>
      <AuthSubtitle>
        {step === "email"
          ? t("auth.forgotEmailDesc", { defaultValue: "Enter your email for verification code" })
          : t("auth.codeSentTo", { email: email.trim(), defaultValue: "We've sent a 6-digit code to {{email}}" })}
      </AuthSubtitle>
      <View style={styles.form}>
        {step === "email" ? (
          <>
            <Field
              label={t("auth.emailAddress", { defaultValue: "Email Address" })}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder={t("auth.enterEmailAddress", { defaultValue: "Enter your email address" })}
              value={email}
              onChangeText={setEmail}
              returnKeyType="go"
              onSubmitEditing={() => void onEmailSubmit()}
              editable={!busy}
            />
            <PrimaryButton
              label={
                busy
                  ? t("auth.sending", { defaultValue: "Sending..." })
                  : t("auth.sendVerificationCode", { defaultValue: "Send Verification Code" })
              }
              onPress={() => void onEmailSubmit()}
              busy={busy}
            />
          </>
        ) : (
          <>
            <OtpCodeInput
              value={otp}
              onChange={setOtp}
              onComplete={(digits) => void onVerify(digits)}
              autoFocus
              disabled={busy}
            />
            <Pressable onPress={() => void onResend()} disabled={resendCooldown > 0 || busy} style={styles.resend}>
              <Text style={[styles.resendText, (resendCooldown > 0 || busy) && styles.resendMuted]}>
                {resendCooldown > 0
                  ? t("auth.resendIn", { seconds: resendCooldown, defaultValue: "Resend code in {{seconds}}s" })
                  : t("auth.resendCode", { defaultValue: "Resend code" })}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8 },
  form: { width: "100%", maxWidth: 448, alignSelf: "center", marginTop: 16 },
  resend: { alignItems: "center", paddingVertical: 12, minHeight: 48 },
  resendText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  resendMuted: { color: colors.muted },
})
