# OfficeMerchantsQueue

## Purpose

Work the merchant application queue: see who is waiting, for how long, who owns it and what to do next.

## Anatomy

- Tabs: In review (with count, default), Live, Paused, Rejected, Suspended, All.
- Toolbar: search by name, type filter (Store, Expert), saved views (All in review, Mine, Over 24h), column chooser.
- Table with sticky header: Business, Country (base → operating), Tier, Status badge, Age, Owner, SLA, Next action.
- Row click opens the review page; keyboard: arrows, Enter, C to claim.

## States

- Default: oldest first, selected row tinted, hovered row on paper.
- Age turns warning text past 24h; SLA turns destructive text once breached.
- Unassigned rows offer Claim; owned rows offer Review.
- Empty queue: confirmation with a calm message, no illustration.

## Rules

- Age and SLA never rely on colour alone: the text says Over by 2h.
- Status uses the shared vocabulary: In review warning, Live success, Paused neutral, Rejected and Suspended destructive.
- Country reads base → operating, using ISO codes in the table.
- Exports respect the role; support sees the list without Claim.

## Upgrade

Differs from built Office: the built page has tabs with counts, search and Business, Country, Status, Tier, Submitted, Managed columns. Upgrade adds an owner column, an SLA column, claim and next action, saved views, a type filter and the country base → operating pair, and replaces Submitted with a live age.

## Code

office/app/merchants/page.tsx
