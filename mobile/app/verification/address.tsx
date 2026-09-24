import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react-native"
import { KycDocumentUploadFrame } from "@/components/kyc-document-upload-frame"
import type { KycPickedDocument } from "@/lib/kyc-document-file"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useKycSubmissions } from "@/lib/use-kyc-submissions"
import { colors, radius, type as typeSize } from "@/lib/theme"

type DocType = "registration" | "utility_bill" | "bank_statement"

export default function AddressVerificationScreen() {
  const { t } = useTranslation("app")
  const navigation = useNavigation()
  const router = useRouter()
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    navigation.setOptions({ title: t("verification.addressPageTitle") })
  }, [navigation, t])

  const docTypes: { id: DocType; label: string }[] = [
    { id: "registration", label: t("verification.registration") },
    { id: "utility_bill", label: t("verification.utilityBill") },
    { id: "bank_statement", label: t("verification.bankStatement") },
  ]

  const { data: submissions, loading, revalidate } = useKycSubmissions(user?.id)
  const submission = (submissions || []).find((row) => row.type === "address") || null
  const [docType, setDocType] = useState<DocType | null>(null)
  const [docTypeOpen, setDocTypeOpen] = useState(false)
  const [image, setImage] = useState<KycPickedDocument | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (submission?.document_type) setDocType(submission.document_type as DocType)
  }, [submission])

  const locked = submission?.status === "in_review" || submission?.status === "approved"

  const submit = async () => {
    if (!docType || !image) {
      showError(t("verification.fillAllFields"))
      return
    }
    setSubmitting(true)
    try {
      const { data } = await supabase.auth.getSession()
      const form = new FormData()
      form.append("type", "address")
      form.append("document_type", docType)
      form.append("file", { uri: image.uri, name: image.name, type: image.type } as unknown as Blob)
      const res = await fetch(apiUrl("/api/kyc/submissions"), {
        method: "POST",
        headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined,
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError((body as { error?: string }).error || t("verification.uploadFailed"))
        return
      }
      showSuccess(t("verification.submit"))
      revalidate()
      router.back()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (locked) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.lockedBox}>
          <Text style={styles.lockedText}>
            {submission?.status === "approved"
              ? t("kyc.verified", { ns: "common" })
              : t("verification.addressInReview")}
          </Text>
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]} keyboard>
      {submission?.status === "rejected" ? (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>{t("verification.badgeRejected")}</Text>
          {submission.rejection_reason ? <Text style={styles.rejectNote}>{submission.rejection_reason}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.label}>{t("verification.labelDocumentType")}</Text>
      <Pressable onPress={() => setDocTypeOpen(true)} style={styles.selectBox}>
        <Text style={styles.selectText}>
          {docType ? docTypes.find((d) => d.id === docType)?.label : t("verification.placeholderSelectDocType")}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <KycDocumentUploadFrame
        emptyTitle={t("verification.uploadAddressTitle")}
        value={image}
        onChange={setImage}
      />

      <View style={styles.submitWrap}>
        <PrimaryButton
          label={submission ? t("verification.updateSubmission") : t("verification.submit")}
          busy={submitting}
          onPress={() => void submit()}
        />
      </View>

      <SheetPicker
        open={docTypeOpen}
        title={t("verification.labelDocumentType")}
        items={docTypes}
        keyExtractor={(d) => d.id}
        labelExtractor={(d) => d.label}
        selectedId={docType}
        onSelect={(d) => setDocType(d.id)}
        onClose={() => setDocTypeOpen(false)}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  lockedBox: { marginTop: 40, alignItems: "center", paddingHorizontal: 24 },
  lockedText: { fontSize: 17, fontWeight: "600", color: colors.text, textAlign: "center" },
  rejectBox: {
    marginBottom: 20,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 14,
  },
  rejectTitle: { fontSize: typeSize.body, fontWeight: "700", color: "#B91C1C" },
  rejectNote: { marginTop: 4, fontSize: typeSize.meta, color: "#991B1B" },
  label: { marginBottom: 8, marginTop: 4, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  selectBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  selectText: { fontSize: typeSize.body, color: colors.text },
  submitWrap: { marginTop: 28 },
})
