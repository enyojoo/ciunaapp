import { useEffect, useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { AuthFooter, AuthSubtitle, AuthTitle, AuthTopBar, PasswordEye, useAuthBack } from "@/components/auth-chrome"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { apiFetch } from "@/lib/api"
import { takeResetSession } from "@/lib/reset-session"

export default function ResetPasswordScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const onBack = useAuthBack()
  const { showError, showSuccess } = useToast()
  const session = useMemo(() => takeResetSession(), [])
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session) return
    showError(t("auth.invalidResetLink", { defaultValue: "Invalid or expired reset link. Please request a new password reset." }))
  }, [session, showError, t])

  const onSubmit = async () => {
    if (!session) return
    if (!password || !confirm) {
      showError(t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }))
      return
    }
    if (password !== confirm) {
      showError(t("auth.passwordMismatch", { defaultValue: "Passwords do not match" }))
      return
    }
    if (password.length < 6) {
      showError(t("auth.passwordMinLength", { defaultValue: "Password must be at least 6 characters long" }))
      return
    }
    setBusy(true)
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.resetToken, email: session.email, newPassword: password }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        showError(body.error || t("auth.resetPasswordFailed", { defaultValue: "Failed to reset password" }))
        return
      }
      showSuccess(t("auth.resetSuccessRedirect", { defaultValue: "Your password has been successfully updated" }))
      setTimeout(() => router.replace("/auth/login"), 500)
    } catch {
      showError(t("auth.genericError", { defaultValue: "Network error. Please check your connection and try again." }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenScroll keyboard contentStyle={styles.content}>
      <AuthTopBar onBack={onBack} />
      <AuthTitle compact>{t("auth.resetPasswordTitle", { defaultValue: "Reset Password" })}</AuthTitle>
      <AuthSubtitle>
        {session
          ? t("auth.resetPasswordDesc", { defaultValue: "Enter your new password below" })
          : t("auth.invalidResetLink", { defaultValue: "Invalid or expired reset link. Please request a new password reset." })}
      </AuthSubtitle>
      <View style={styles.form}>
        {session ? (
          <>
            <Field
              label={t("auth.newPassword", { defaultValue: "New Password" })}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder={t("auth.newPasswordPlaceholder", { defaultValue: "Enter new password" })}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              trailing={<PasswordEye show={show} onToggle={() => setShow((s) => !s)} />}
            />
            <Field
              label={t("auth.confirmPassword", { defaultValue: "Confirm password" })}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder={t("auth.confirmPasswordPlaceholder", { defaultValue: "Confirm new password" })}
              value={confirm}
              onChangeText={setConfirm}
              returnKeyType="done"
              onSubmitEditing={() => void onSubmit()}
              trailing={<PasswordEye show={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />}
            />
            <PrimaryButton
              label={busy ? t("auth.resetting", { defaultValue: "Resetting..." }) : t("auth.updatePassword", { defaultValue: "Update password" })}
              onPress={() => void onSubmit()}
              busy={busy}
            />
          </>
        ) : (
          <PrimaryButton
            label={t("auth.forgotPasswordTitle", { defaultValue: "Forgot Password" })}
            onPress={() => router.replace("/auth/forgot-password")}
          />
        )}
        <AuthFooter
          prompt={t("auth.alreadyHaveAccount", { defaultValue: "Already have an account?" })}
          action={t("auth.signInLink", { defaultValue: "Sign in" })}
          href="/auth/login"
        />
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8 },
  form: { width: "100%", maxWidth: 448, alignSelf: "center", marginTop: 16 },
})
