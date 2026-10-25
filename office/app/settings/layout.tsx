import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings - Ciuna",
  description: "Configure platform settings, payment methods, and system parameters for the Ciuna platform.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
