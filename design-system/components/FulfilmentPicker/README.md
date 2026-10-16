# FulfilmentPicker

## Purpose
Lets the customer choose how an order reaches them (delivery, pickup or digital) with the fee and timing visible up front.

## Anatomy
Heading, option rows (radio, icon, name, ETA or detail, fee), and a detail card under the chosen option: delivery address with Change address, or pickup location and opening hours, or a digital access note.

## States
Delivery chosen, pickup chosen, digital, an option unavailable (muted with the reason). Chosen = tinted card with orange border and filled radio.

## Rules
Only offered modes are listed. The fee is on the row ("Free" for zero). Rows are at least 64px high. The delivery zone and address are confirmed before payment. Customer font.

## Upgrade
Matches `mobile/components/marketplace-checkout.tsx` modes; new is the unavailable-option row and the pickup hours line.

## Code
`mobile/components/marketplace-checkout.tsx`
