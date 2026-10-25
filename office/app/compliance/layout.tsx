import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compliance - Ciuna",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
