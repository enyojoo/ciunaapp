# SellerAuth

## Purpose
How a merchant gets into Ciuna Seller: sign in with an existing Ciuna account, or create one, then confirm the email. The same account is used in the customer app.

## Anatomy
Logo and language select on one row, title and one-line subtitle, form (email, password, primary button), switch link to the other form. Register adds first and last name. Check-your-email is a centred confirmation with the address in bold. Desktop puts the same column in a 440px card on the paper background; nothing else is added.

## States
Default; focused field; wrong email or password (single banner); email already exists (banner with the way out); field errors (invalid email, password under 8 characters); language list open; Russian copy; check your email; loading (button shows a spinner and stays full colour).

## Rules
Labels above fields, errors under them in words with an icon. The language select is always visible, it is the first thing a newcomer reaches for. Never say which of email or password was wrong. Password hint is shown until it becomes an error. Buttons name the action: "Sign in", "Create account". No payment or provider names.

## Upgrade
Built in `seller/app/(auth)/login/page.tsx`, `register/page.tsx` and `seller/components/auth-shell.tsx`. Differs from the built portal: adds a "Forgot password?" link on the sign-in password field, a "send it again" link on check-your-email and an "Open sign in" button there, and the desktop card treatment (built is a bare centred column). Everything else is built.

## Code
`seller/components/auth-shell.tsx`
