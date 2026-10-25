import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Ciuna",
  description: "Admin dashboard for managing Ciuna platform operations, users, and transactions.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfficeDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
