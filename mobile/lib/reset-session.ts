let session: { email: string; resetToken: string } | null = null

export function setResetSession(next: { email: string; resetToken: string }) {
  session = next
}

export function takeResetSession() {
  const current = session
  session = null
  return current
}

export function peekResetSession() {
  return session
}
