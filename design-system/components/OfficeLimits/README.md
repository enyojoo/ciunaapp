# OfficeLimits

## Purpose

Let compliance set what each KYC level may send per month, see how close users are, and grant time-limited exceptions to single users.

## Anatomy

- Seed banner: the figures are seed examples to be confirmed by compliance.
- Tabs: Limits, Usage, Exceptions.
- Limits: per-level table (requirement, per-transfer maximum, monthly limit, users) and a Corridor caps matrix (levels by RUB to NGN, CNY, GHS, KES, UZS; blank means the level limit applies); audit note at the bottom.
- Usage: tiles (users, sending, above 80%, blocked in 30 days) and a per-level table with average used bars.
- Exceptions: user, level, override amount, reason, expiry, set by, status, Revoke.
- Dialogs: Save limit changes (reason, audit note), Add exception (with validation), Revoke exception.

## States

- Clean and edited (changed field outlined, "was" value, Save changes and Discard).
- Exception statuses: Active, Expires in N days (warning), Expired (dimmed).
- Validation: override must be above the level limit, expiry within 90 days, reason required.
- Finance and other roles see a read-only view without inputs or Revoke.

## Rules

- Seed values: monthly ₽50,000, ₽600,000, ₽2,000,000 for levels 1 to 3 (decisions guide). Per-transfer maximums and corridor caps on the card are invented examples.
- Only compliance and super_admin edit. Every change needs a reason and writes who, when, what changed to the audit note.
- Limits are money in rubles paid, counted per calendar month.
- An exception never lowers a limit or skips KYC; it expires automatically.
- No app hard-codes a limit; the API reads these values.

## Upgrade

Differs from built Office: the KYC page reviews documents only and limits are fixed in code or the database. New: a Limits route with editable per-level and per-corridor limits, usage reporting and exceptions. Needs: a limits table, a per-user override table with expiry, a usage query, and enforcement in the transfer-quote endpoint.

## Code

office/app/limits (new), office/app/kyc/page.tsx, api/app/api/admin/kyc/route.ts
