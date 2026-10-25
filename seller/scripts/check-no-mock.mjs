// Fails a production build when the design-review mock is switched on (it fakes the session and the API).
if (process.env.NEXT_PUBLIC_SELLER_MOCK === "1" && (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production" || process.env.CI)) {
  console.error("NEXT_PUBLIC_SELLER_MOCK=1 must not be set for a production build. Unset it and build again.")
  process.exit(1)
}
