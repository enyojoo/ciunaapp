import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Referrals - Ciuna",
  description: "View referrers, invited users, send activity, and referral rewards.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfficeReferralsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
