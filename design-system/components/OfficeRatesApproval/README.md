# OfficeRatesApproval

## Purpose

Let finance change corridor rates and markups directly, with every change audited, bounds enforced, and a stale rate blocking Send for that corridor only. There is no second approver.

## Anatomy

- Rates table: corridor (RUB to NGN, CNY, GHS, KES, UZS), mid-market rate, markup, customer rate, source, updated, status (Live, Stale, Manual), Edit and History.
- Summary tiles: corridors, live, stale or manual, average markup with bounds.
- Stale banner above the table: names the corridor, age, and that Send to it is blocked, with Set manual rate.
- Change dialog: markup, manual mid-market rate, resulting customer rate, provider cost, impact estimate (7-day transfers and volume, effect on customers, extra revenue), required short note, Save change.
- Validation dialogs: markup outside 0% to 5%, negative spread, missing note.
- Customer phone showing the paused corridor, and the matching Office banner.
- History table: when, corridor, changed by, old, new, note. Append-only.
- Ops read-only view.

## States

- Live (synced under 1 hour ago), Stale (older than 1 hour, warning, Send blocked), Manual (neutral, set by a named finance user, expires).
- Validation: markup outside 0% to 5% is refused; a negative spread (customer rate below provider cost) is refused and says how to fix it; a missing note disables Save.
- Saved: the change applies at once to new quotes and appears in History.
- Ops sees the table and History without Edit or Set manual rate; support does not see Rates.

## Rules

- Finance and super_admin edit directly. No second approver and no pending state.
- Every change is audited: who, old value, new value and a short note. History is append-only.
- Bounds: markup 0% to 5%, and the customer rate must stay above the provider cost rate. Values outside bounds are refused. Seed values; finance owns them.
- A stale corridor blocks new quotes and new transfers for that corridor only. Paid transfers and payouts continue. Customers see a plain "paused" state that names no provider.
- Changes apply to new quotes only; shown quotes keep their rate for 15 minutes.
- Compliance and support do not see Rates; ops can read.
- Office may name providers; customer screens say "updating exchange rates".

## Upgrade

Differs from built Office: today rates are a currency list inside Settings (office-rates-panel) with a PUT to admin/exchange-rates that overwrites with no bounds and no audit of old value or note. New: a Rates route with corridors, bound validation, required note, impact estimate, append-only history, and stale detection with a Send block enforced in the quote API. Needs: a rate_changes audit table (actor, old, new, note), a stale check in the quote endpoint, and customer copy for a paused corridor.

## Code

office/app/rates (new), office/components/settings/office-rates-panel.tsx, api/app/api/admin/exchange-rates/route.ts
