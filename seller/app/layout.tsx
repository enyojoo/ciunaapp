import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ToastProvider } from "@ciuna/ui-web"
import { UiStringsBridge } from "@/components/ui-strings-bridge"
import { I18nProvider } from "@/lib/i18n"
import { SessionProvider } from "@/lib/session"
import Script from "next/script"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Ciuna Seller", template: "%s · Ciuna Seller" },
  description: "Run your store or expert business on Ciuna.",
  applicationName: "Ciuna Seller",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Ciuna Seller", statusBarStyle: "default" },
  icons: { icon: "https://seeqjiebmrnolcyydewj.supabase.co/storage/v1/object/public/brand/Ciuna%20favicon.png" },
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FAFAF8" }

// Design-review demo mode: NEXT_PUBLIC_SELLER_MOCK=1 loads /dev-mock.js (fake session + canned API). Off everywhere else.
const mock = process.env.NEXT_PUBLIC_SELLER_MOCK === "1"
const mockRef = mock ? (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^https?:\/\//, "").split(".")[0] : undefined

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-supabase-ref={mockRef}>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        {mock ? <Script src="/dev-mock.js" strategy="beforeInteractive" /> : null}
        <I18nProvider>
          <UiStringsBridge>
          <ToastProvider>
            <SessionProvider>{children}</SessionProvider>
          </ToastProvider>
          </UiStringsBridge>
        </I18nProvider>
      </body>
    </html>
  )
}
