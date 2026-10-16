# OfficeRatesApproval

## Purpose

Let finance change corridor rates safely: one finance user proposes a markup or manual-rate change, a second approves it, and a stale rate stops Send until it is fixed.

## Anatomy

- Rates table: corridor (RUB to NGN, CNY, GHS, KES, UZS), mid-market rate, markup, customer rate, source, updated, status (Live, Stale, Manual), pending-change badge, Propose change and History.
- Summary tiles: corridors, live, stale or manual, average markup with bounds.
- Stale banner above the table: names the corridor, age, and that Send to it is blocked.
- Proposal page: markup diff (current, proposed, change), reason from proposer, impact estimate (7-day transfers and volume, extra revenue, effect on customers), Decision panel with reason chips and Approve and apply or Reject change.
- Dialogs: propose change with validation errors, manual rate, reject reason.
- Customer view of a blocked corridor and the matching Office banner.
- History table: when, corridor, change, proposed by, outcome, reason.

## States

- Live (synced under 1 hour ago), Stale (older than 1 hour, warning, Send blocked), Manual (neutral, set by a named finance user, expires).
- Pending proposal: row highlighted with "Change awaiting approval".
- Approver view vs proposer view: the proposer cannot approve or reject; Withdraw only.
- Validation: markup outside 0% to 5% blocks submit; a negative spread (customer rate below provider cost) blocks submit and says how to fix it.
- Ops and support see the table without Propose change; support also loses Rates from the menu.

## Rules

- Four-eyes: every markup change and every manual mid-market rate needs approval by a different finance or super_admin user. Approval applies to all changes at launch.
- Bounds 0% to 5% markup, and the customer rate must stay above the provider cost rate. Seed values; finance owns them.
- A stale corridor blocks new quotes and new transfers for that corridor only. Paid transfers and payouts continue. Customer text names no provider.
- A reason is required for propose, approve and reject, and is written to history with the actor.
- Changes apply to new quotes only; shown quotes keep their rate for 15 minutes.
- Only finance and super_admin edit; ops can read; compliance and support do not see Rates.
- Office may name providers; customer screens say "updating exchange rates".

## Upgrade

Differs from built Office: today rates are a currency list inside Settings (office-rates-panel) with a PUT to admin/exchange-rates that overwrites immediately and no approval. New: a Rates route with corridors, proposals, second-approver step, stale detection with a Send block enforced in the quote API, impact estimate and history. Needs: a rate_changes table (proposed, approved, rejected), a stale check in the quote endpoint, and customer error copy for a paused corridor.

## Code

office/app/rates (new), office/components/settings/office-rates-panel.tsx, api/app/api/admin/exchange-rates/route.ts
