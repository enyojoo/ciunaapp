import { type ReactNode } from "react"
import { SafeAreaView } from "react-native-safe-area-context"

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView className={`flex-1 bg-white ${className}`} edges={["top", "left", "right"]}>
      {children}
    </SafeAreaView>
  )
}
