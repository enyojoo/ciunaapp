# CustomerSend

## Purpose
The Send flow: pick an amount, choose who receives it, review the fees, pay, then track the transfer to completion.

## Anatomy
Header with back, a three-step progress bar (Amount, Recipient, Review) and captions. Amount: two lanes (You send, Receiver gets) with a currency pill (flag and code) each, then a quote plate (rate `₽1 = ₦16.80` with a live marker, named processing fee, receiver gets, total under an ink rule). Recipient: search, rows with initials, flag badge, bank and masked account, a dashed Add new recipient row. Review: summary plate, recipient plate, Pay with options (radio rows), sticky Pay button with the total. Payment waiting: countdown badge, QR, exact amount. Status: icon, status badge, headline, amount, timeline, actions.

## States
Default; below minimum ("Send at least ₽1,000."); over the limit; verification needed (warning banner, Continue becomes Verify identity); first-fetch skeleton; Chinese; recipient picked; no recipient for the currency; review with SBP or card; payment waiting; processing (warning); completed (success); failed (destructive, "You have not been charged").

## Rules
Errors sit under the field and say what to fix; the quote hides and Continue disables. Rates use symbols on both sides, two decimals at 1 or more, never `.00` in the lane but cents in the breakdown. Every fee is named; the total is bold. Statuses use one word, one pair, with an icon. Customer screens never name payment providers; the method is "Bank transfer (SBP)". One primary button per screen.

## Upgrade
Differs from the built app (`send.tsx`): the verification banner and the "Payment: SBP (Bitbanker)" line lose the provider name; Continue becomes Verify identity when verification is required (today a toast then redirect); explicit payment-waiting screen with countdown and exact amount; failed state with next steps; limit error text uses the verification level. Step labels, quote layout and the lane inputs match what is built.

## Code
`mobile/app/send.tsx`, `mobile/components/send/*`
