import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRouteWrapper } from "@/components/auth/protected-route-wrapper"
import Script from "next/script"
import "./globals.css"

// Smoke-test mode: NEXT_PUBLIC_OFFICE_MOCK=1 loads /dev-mock.js (fake admin session, empty API). Off everywhere else.
const mock = process.env.NEXT_PUBLIC_OFFICE_MOCK === "1"
const mockRef = mock ? (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").replace(/^https?:\/\//, "").split(".")[0] : undefined

export const metadata: Metadata = {
  title: "Ciuna Office",
  description: "Ciuna back office",
  metadataBase: new URL("https://bk.ciuna.com"),
  icons: {
    icon: "https://seeqjiebmrnolcyydewj.supabase.co/storage/v1/object/public/brand/Ciuna%20favicon.png",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-supabase-ref={mockRef}>
      <head>{mock ? <Script src="/dev-mock.js" strategy="beforeInteractive" /> : null}</head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <AuthProvider>
        <ProtectedRouteWrapper>{children}</ProtectedRouteWrapper>
      </AuthProvider>
      </body>
    </html>
  )
}
