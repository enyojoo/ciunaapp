# EarningsTile

## Purpose
One balance in the seller's money picture. Four tiles tell the full story: waiting, ready, on its way, already paid.

## Anatomy
Icon and label, amount (28px bold, tabular), help text. A display variant (44px) tops the phone Earnings screen with the Withdraw button.

## States
Pending (help: "Available after 7 days, once the order is fulfilled"), Available (tinted, the only actionable balance), In payout, Paid out; zero (muted, calm sentence); loading skeleton on first load only; one set per currency.

## Rules
Always states what pending waits for. Money through `Amount`: `₽24,310`, `$320.50`; whole rubles carry no `.00`. Never colour a balance as a status. Currency shown in the label when a seller has more than one.

## Upgrade
Built today: four balance cards in the Earnings page. New: the display-size hero for phones and the tint on Available.

## Code
`seller/app/(shell)/earnings/page.tsx`
