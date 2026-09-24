import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import * as DocumentPicker from "expo-document-picker"
import * as ImagePicker from "expo-image-picker"
import { Camera, FileText, Image as ImageIcon, Upload } from "lucide-react-native"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import {
  isImageMime,
  isPdfMime,
  validateKycDocumentFile,
  type KycPickedDocument,
} from "@/lib/kyc-document-file"
import { colors, radius, type as typeSize } from "@/lib/theme"

type SourceAction = {
  id: "camera" | "library" | "document"
  label: string
  icon: typeof Camera
}

type Props = {
  label?: string
  value: KycPickedDocument | null
  onChange: (file: KycPickedDocument | null) => void
  emptyTitle: string
  disabled?: boolean
}

export function KycDocumentUploadFrame({ label, value, onChange, emptyTitle, disabled }: Props) {
  const { t } = useTranslation("app")
  const { showError } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)

  const actions: SourceAction[] = useMemo(
    () => [
      { id: "camera", label: t("profile.takePhoto", { defaultValue: "Take Photo" }), icon: Camera },
      {
        id: "library",
        label: t("profile.chooseFromLibrary", { defaultValue: "Choose from Library" }),
        icon: ImageIcon,
      },
      {
        id: "document",
        label: t("verification.chooseDocument", { defaultValue: "Choose file (PDF or image)" }),
        icon: FileText,
      },
    ],
    [t],
  )

  const applyFile = (file: KycPickedDocument) => {
    const check = validateKycDocumentFile(file)
    if (check === "too_large") {
      showError(t("verification.fileTooLarge"))
      return
    }
    if (check === "invalid_type") {
      showError(t("verification.fileTypeInvalid"))
      return
    }
    onChange(file)
  }

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 })
    if (result.canceled) return
    const asset = result.assets[0]
    if (!asset?.uri) return
    const name = asset.fileName || `document_${Date.now()}.jpg`
    const type = asset.mimeType || "image/jpeg"
    applyFile({ uri: asset.uri, name, type, size: asset.fileSize })
  }

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    applyFile({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || "application/octet-stream",
      size: asset.size,
    })
  }

  const onAction = (action: SourceAction) => {
    if (action.id === "camera") void pickImage(true)
    else if (action.id === "library") void pickImage(false)
    else void pickDocument()
  }

  const showPreview = value && isImageMime(value.type) && !isPdfMime(value.type)

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setSheetOpen(true)}
        disabled={disabled}
        style={[styles.frame, value && styles.frameFilled, disabled && styles.frameDisabled]}
        accessibilityRole="button"
        accessibilityLabel={emptyTitle}
      >
        {value ? (
          <>
            {showPreview ? (
              <Image source={{ uri: value.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.fileRow}>
                <View style={styles.fileIcon}>
                  <FileText size={22} color={colors.primaryDeep} strokeWidth={2} />
                </View>
                <View style={styles.fileCopy}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {value.name}
                  </Text>
                  <Text style={styles.fileMeta}>{t("verification.clickToTryAgain")}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Upload size={22} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyHint}>{t("verification.fileHint")}</Text>
          </View>
        )}
      </Pressable>

      <SheetPicker
        open={sheetOpen}
        title={emptyTitle}
        items={actions}
        keyExtractor={(a) => a.id}
        labelExtractor={(a) => a.label}
        leadingExtractor={(action) => {
          const Icon = action.icon
          return <Icon size={18} color={colors.text} strokeWidth={2} />
        }}
        onSelect={onAction}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  label: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  frame: {
    minHeight: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    justifyContent: "center",
  },
  frameFilled: { borderStyle: "solid", minHeight: 100 },
  frameDisabled: { opacity: 0.55 },
  empty: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, gap: 8 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  emptyTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text, textAlign: "center" },
  emptyHint: { fontSize: typeSize.meta, color: colors.muted, textAlign: "center" },
  previewImage: { width: "100%", height: 200 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  fileCopy: { flex: 1, minWidth: 0 },
  fileName: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  fileMeta: { marginTop: 4, fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
})
