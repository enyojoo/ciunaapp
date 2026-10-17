import { ScrollViewStyleReset } from "expo-router/html"
import type { ReactNode } from "react"

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no" />
        <title>Ciuna</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              html, body { margin: 0; background-color: #FAFAF8; }
              #root { display: flex; flex-direction: column; min-height: 100%; }
              #root > * { flex: 1; min-height: 100%; width: 100%; }
              /* Keyboard focus: a 3px primary ring on every control, including Pressable (role=button) and links. */
              :focus-visible { outline: 3px solid #CD4B0E; outline-offset: 2px; }
              input:focus-visible, textarea:focus-visible { outline-offset: 0; }
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
