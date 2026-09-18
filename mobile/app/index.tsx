import { Redirect } from "expo-router"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useAuth } from "@/lib/auth-context"
import { colors } from "@/lib/theme"

export default function Index() {
  const { user, loading, pinUnlocked } = useAuth()
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }
  if (!user) return <Redirect href="/auth/login" />
  if (!pinUnlocked) return <Redirect href="/pin" />
  return <Redirect href="/(app)/hub" />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
})
