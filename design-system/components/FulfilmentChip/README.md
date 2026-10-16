# FulfilmentChip

## Purpose
Shows how an order or booking is fulfilled so the seller knows what to prepare.

## Anatomy
Neutral pill, 28px (36px in detail headers), Lucide icon plus one word: Delivery (truck), Pickup (store), Digital (file-text), Online (video), In person (map-pin).

## States
delivery, pickup, digital, online booking, in-person booking. No interactive state.

## Rules
Neutral colours only; status owns colour. Icon and word together. Localised in all six languages. An unknown mode renders as Delivery.

## Upgrade
Built today: delivery, pickup, digital and one generic booking chip (calendar-clock). New: split booking into Online and In person.

## Code
`seller/components/orders/fulfilment-chip.tsx`
