import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Camera, Image as ImageIcon, Pencil, Trash2 } from "lucide-react-native"
import { Avatar } from "@/components/avatar"
import { Field } from "@/components/field"
import { GroupCard } from "@/components/row"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { removeProfileAvatar, uploadProfileAvatar } from "@/lib/profile-avatar-upload"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"

export default function ProfileScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const { showError, showSuccess } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarRemoving, setAvatarRemoving] = useState(false)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const hasPhoto = Boolean(profile?.avatar_url)

  useEffect(() => {
    setFirstName(profile?.first_name || "")
    setLastName(profile?.last_name || "")
    setPhone(profile?.phone || "")
  }, [profile])

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || t("profile.notSet")

  const cancelEdit = () => {
    setFirstName(profile?.first_name || "")
    setLastName(profile?.last_name || "")
    setPhone(profile?.phone || "")
    setEditing(false)
  }

  const phoneOk = !phone.trim() || /^\+?[0-9 ()\-]{7,20}$/.test(phone.trim())
  const save = async () => {
    if (!profile?.id || !phoneOk) return
    setSaving(true)
    const { error } = await supabase
      .from("users")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      })
      .eq("id", profile.id)
    setSaving(false)
    if (error) {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
      return
    }
    await refreshProfile()
    showSuccess(t("profile.save"))
    setEditing(false)
  }

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setAvatarUploading(true)
    try {
      const result = await uploadProfileAvatar({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
      })
      if ("error" in result) {
        showError(result.error)
        return
      }
      await refreshProfile()
    } catch {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
    } finally {
      setAvatarUploading(false)
    }
  }

  const pickAvatar = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
    if (result.canceled) return
    const asset = result.assets[0]
    if (asset) void uploadAvatar(asset)
  }

  type PhotoAction = { id: "camera" | "library" | "remove"; label: string; icon: typeof Camera; destructive?: boolean }
  const photoActions: PhotoAction[] = [
    { id: "camera", label: t("profile.takePhoto", { defaultValue: "Take Photo" }), icon: Camera },
    { id: "library", label: t("profile.chooseFromLibrary", { defaultValue: "Choose from Library" }), icon: ImageIcon },
    ...(hasPhoto
      ? [{ id: "remove" as const, label: t("profile.removePhoto", { defaultValue: "Remove photo" }), icon: Trash2, destructive: true }]
      : []),
  ]

  const handlePhotoAction = (action: PhotoAction) => {
    if (action.id === "camera") void pickAvatar(true)
    else if (action.id === "library") void pickAvatar(false)
    else confirmRemoveAvatar()
  }

  const removeAvatar = async () => {
    setAvatarRemoving(true)
    try {
      const result = await removeProfileAvatar()
      if ("error" in result) {
        showError(result.error)
        return
      }
      await refreshProfile()
    } catch {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
    } finally {
      setAvatarRemoving(false)
    }
  }

  const [confirm, setConfirm] = useState<"photo" | "delete" | null>(null)
  const confirmRemoveAvatar = () => setConfirm("photo")

  return (
    <ScreenScroll edges={["left", "right"]}>
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={() => setPhotoSheetOpen(true)}
            disabled={avatarUploading || avatarRemoving}
            accessibilityRole="button"
            accessibilityLabel={t("profile.changePhoto", { defaultValue: "Change photo" })}
          >
            <Avatar name={name} size={72} uri={profile?.avatar_url} />
            <View style={styles.avatarBadge}>
              {avatarUploading || avatarRemoving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Camera size={14} color={colors.onPrimary} strokeWidth={2.4} />
              )}
            </View>
          </Pressable>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{t("profile.profileInfo")}</Text>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)} style={styles.editBtn} hitSlop={8}>
            <Pencil size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.editBtnText}>{t("profile.edit")}</Text>
          </Pressable>
        ) : null}
      </View>

      <GroupCard>
        {editing ? (
          <View style={styles.form}>
            <Field label={t("profile.firstName")} value={firstName} onChangeText={setFirstName} editable={!saving} />
            <Field label={t("profile.lastName")} value={lastName} onChangeText={setLastName} editable={!saving} />
            <Field
              label={t("profile.phone")}
              value={phone}
              onChangeText={setPhone}
              editable={!saving}
              keyboardType="phone-pad"
              error={phoneOk ? undefined : t("profile.phoneInvalid", { defaultValue: "Enter a phone number with the country code, for example +7 900 000 00 00." })}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <InfoRow label={t("profile.firstName")} value={profile?.first_name || t("profile.notSet")} />
            <InfoRow label={t("profile.lastName")} value={profile?.last_name || t("profile.notSet")} />
            <InfoRow label={t("profile.email")} value={profile?.email || ""} />
            <Text style={styles.hint}>{t("profile.emailHint", { defaultValue: "To change your email, contact support." })}</Text>
            <InfoRow label={t("profile.phone")} value={profile?.phone || t("profile.notSet")} />
          </View>
        )}
      </GroupCard>

      {editing ? (
        <View style={styles.actions}>
          <View style={styles.actionHalf}>
            <PrimaryButton label={t("profile.discard")} variant="secondary" onPress={cancelEdit} disabled={saving} />
          </View>
          <View style={styles.actionHalf}>
            <PrimaryButton label={saving ? t("profile.saving") : t("profile.save")} onPress={() => void save()} busy={saving} />
          </View>
        </View>
      ) : (
        // Deleting the account is about this person's data, so it lives here, last and apart from everything else.
        <View style={styles.dangerZone}>
          <Button
            label={t("profile.deleteAccount")}
            variant="dangerGhost"
            onPress={() => router.push("/delete-account" as never)}
          />
        </View>
      )}

      <SheetPicker<PhotoAction>
        open={photoSheetOpen}
        title={t("profile.changePhoto", { defaultValue: "Change photo" })}
        items={photoActions}
        keyExtractor={(a) => a.id}
        labelExtractor={(a) => a.label}
        leadingExtractor={(action) => {
          const Icon = action.icon
          return <Icon size={18} color={action.destructive ? colors.danger : colors.text} strokeWidth={2} />
        }}
        onSelect={handlePhotoAction}
        onClose={() => setPhotoSheetOpen(false)}
      />
      <ConfirmDialog
        open={confirm === "photo"}
        title={t("profile.removePhoto", { defaultValue: "Remove photo" })}
        description={t("profile.removePhotoConfirm", { defaultValue: "Remove your profile photo?" })}
        confirmLabel={t("profile.removePhoto", { defaultValue: "Remove photo" })}
        cancelLabel={t("profile.cancel")}
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void removeAvatar()
        }}
      />
    </ScreenScroll>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  dangerZone: { marginTop: 24 },
  identity: { alignItems: "center", gap: 8, paddingTop: 8, marginBottom: 24 },
  avatarWrap: { position: "relative" },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  name: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  email: { fontSize: typeSize.meta, color: colors.muted },
  cardHead: { marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 4 },
  editBtnText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  form: { paddingVertical: 4, gap: 4 },
  hint: { marginTop: 6, fontSize: typeSize.caption, color: colors.muted },
  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: typeSize.meta, color: colors.muted },
  infoValue: { flexShrink: 1, marginLeft: 12, fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionHalf: { flex: 1 },
})
