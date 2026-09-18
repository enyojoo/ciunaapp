import type { ReactNode } from "react"

/**
 * Expo Go / native Google OAuth returns here (Supabase Site URL) with
 * `app_redirect=exp://…` or `ciuna://…`. Bounce before the web Supabase
 * client can try (and burn) the PKCE code.
 */
const NATIVE_OAUTH_BOUNCE = `(function(){try{var p=new URLSearchParams(location.search);var r=p.get("app_redirect");if(!r||!/^(ciuna|exp):\\/\\//i.test(r))return;p.delete("app_redirect");var q=p.toString();var d=r+(q?(r.indexOf("?")>=0?"&":"?")+q:"");if(location.hash)d+=location.hash;location.replace(d)}catch(e){}})();`

export default function AuthCallbackLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NATIVE_OAUTH_BOUNCE }} />
      {children}
    </>
  )
}
