# OnboardingChecklist

## Purpose
Guides a new merchant from sign-up to live: profile, logo, verification type, details, documents, first listing, submit for review.

## Anatomy
Summary bar (title, progress, "3 of 7"), then one step card per item: number or check, title, helper line, status badge or one call to action. The current step is outlined with `primary-border` and expanded; later steps that depend on it are Blocked. A review or rejection banner sits above the list.

## States
Per step: to do, current, done (green check), blocked (lock, muted, says what to do first), in review (amber badge), rejected (red badge). Merchant level: draft, in review (neutral banner with turnaround), rejected (destructive banner with the Office reason), approved (success banner).

## Rules
One call to action per step. Submit stays disabled until required steps are done. Quote the Office rejection reason verbatim. Never colour alone: badge words and icons carry state. Phones show the same list single column, with the current step first.

## Upgrade
Built today: the setup page with numbered cards and done/to-do icons. New: Blocked and per-step review/rejected badges, a progress bar, and the single-line summary.

## Code
`seller/app/(shell)/setup/page.tsx`
