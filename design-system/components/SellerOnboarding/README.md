# SellerOnboarding

## Purpose
First screen after sign up for anyone with no business: create one (a store or an expert practice) or join one they were invited to.

## Anatomy
Logo, title and subtitle, optional invite banner (business name, role, Join), "What do you want to do on Ciuna?" with two big choice cards (Sell products, Offer my expertise), then a form card that appears after a choice: name, marketplace section (stores only: Food or Mart), base country, operating country, language chips. Continue button at the bottom.

## States
No type chosen (form hidden, Continue disabled); type chosen; filled; invite pending; field errors (name length, no language); server error banner (for example business limit reached); busy; expert variant (no section field, other label).

## Rules
Continue stays disabled until a type is chosen and the name has 2 or more characters. Hints under country fields say why we ask ("This decides which verification documents we ask for"). The last language chip cannot be turned off. One task per screen on phones: the page scrolls, the layout never splits. Required is written as text.

## Upgrade
Built in `seller/app/onboarding/page.tsx`. Differs from the built portal: the selected choice card gets a check mark and radio (built uses only a tint), the language error shows as text under the chips when none is chosen (built silently refuses to turn off the last one), and the invite banner shows the role on its own line. Layout, copy and fields are as built.

## Code
`seller/app/onboarding/page.tsx`
