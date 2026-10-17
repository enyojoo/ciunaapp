import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "./primary-button"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * In-app confirmation (replaces Alert.alert). Asks a direct question and names the action on the confirm button.
 * `destructive` colours the confirm action with the danger text, never a filled red.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={cancelLabel} />
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.body}>{description}</Text> : null}
          <View style={styles.actions}>
            <PrimaryButton label={cancelLabel} variant="secondary" onPress={onCancel} disabled={busy} />
            <PrimaryButton
              label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              busy={busy}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(17,24,39,0.55)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card + 4, padding: 20, gap: 8 },
  title: { fontSize: typeSize.headline, fontWeight: "700", color: colors.text },
  body: { fontSize: typeSize.label, lineHeight: 22, color: colors.muted },
  actions: { marginTop: 12, gap: 10 },
})
