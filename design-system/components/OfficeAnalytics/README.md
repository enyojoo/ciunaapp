# OfficeAnalytics

## Purpose

Read marketplace health at a glance: GMV, commission, seller activity and payouts over a period.

## Anatomy

- Period presets (7, 30, 90 days) and a currency switch.
- Eight tiles: GMV, commission with take rate, fulfilment rate, cancellation rate, active sellers, new sellers, median time to accept, median time to first order.
- Daily GMV bars with an accessible label and a table alternative.
- Orders by section, top sellers, applications, payouts requested.

## States

- Populated 30-day view.
- Zero state: dashes and a plain message, layout stays.
- Multi-currency: money tiles follow the selected currency, others do not.

## Rules

- Amounts per currency are never converted.
- Bars carry an accessible name and a table alternative.
- Zero is shown as a dash when there is nothing to compute.

## Upgrade

Differs from built Office: Built chart has hover titles only. Upgrade adds the explicit table alternative and period text with time zone.

## Code

office/app/analytics/page.tsx
