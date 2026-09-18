import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { Toast, type ToastType } from "@/components/toast"

type ToastData = {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: { label: string; onPress: () => void }
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number, action?: ToastData["action"]) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  _toasts: ToastData[]
  _removeToast: (id: string) => void
  _registerModalHost: () => () => void
  _modalHostActive: boolean
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [modalHostCount, setModalHostCount] = useState(0)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const registerModalHost = useCallback(() => {
    setModalHostCount((c) => c + 1)
    return () => setModalHostCount((c) => Math.max(0, c - 1))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000, action?: ToastData["action"]) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type, duration, action }])
    },
    [],
  )

  const showSuccess = useCallback(
    (message: string, duration = 3000) => showToast(message, "success", duration),
    [showToast],
  )
  const showError = useCallback(
    (message: string, duration?: number) => {
      const ms = duration ?? Math.min(10_000, Math.max(5000, 3500 + Math.ceil(message.length / 24) * 1000))
      showToast(message, "error", ms)
    },
    [showToast],
  )
  const showInfo = useCallback(
    (message: string, duration = 3000) => showToast(message, "info", duration),
    [showToast],
  )
  const showWarning = useCallback(
    (message: string, duration = 3500) => showToast(message, "warning", duration),
    [showToast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      _toasts: toasts,
      _removeToast: removeToast,
      _registerModalHost: registerModalHost,
      _modalHostActive: modalHostCount > 0,
    }),
    [showToast, showSuccess, showError, showInfo, showWarning, toasts, removeToast, registerModalHost, modalHostCount],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {modalHostCount === 0 ? <ToastViewport /> : null}
    </ToastContext.Provider>
  )
}

export function ToastViewport() {
  const context = useContext(ToastContext)
  if (!context) return null
  const { _toasts, _removeToast } = context
  return (
    <View style={styles.overlay}>
      {_toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          action={toast.action}
          onClose={() => _removeToast(toast.id)}
        />
      ))}
    </View>
  )
}

/** Re-host toasts inside a native Modal so they are not hidden behind it. */
export function ModalToastHost() {
  const context = useContext(ToastContext)
  const register = context?._registerModalHost

  useEffect(() => {
    if (!register) return
    return register()
  }, [register])

  if (!context) return null
  return <ToastViewport />
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: "box-none",
  },
})
