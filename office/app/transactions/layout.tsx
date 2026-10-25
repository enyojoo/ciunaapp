import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Transactions - Ciuna",
  description: "Monitor and manage all money transfer transactions across the Ciuna platform.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminTransactionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
