# OfficeExperts

## Purpose

Approve experts and keep their profiles and services in good order.

## Anatomy

- Tabs by approval status, search, speciality filter.
- Table: expert and speciality, country, status, services, rating, Review or View.
- Detail: profile, services with price and schedule, credentials with verification state, decision panel with templated reasons.

## States

- In review, Live, Paused, Rejected.
- Credential Verified or Unreadable.
- Empty queue confirms everything has a decision.

## Rules

- Rejecting or requesting changes needs a reason; the expert sees it as written.
- An expert is Live only when approved and with at least one active service.
- Pausing an expert keeps existing bookings; new ones stop.
- Role compliance reviews credentials; ops approves.

## Upgrade

Built: profiles list, profile detail and a services view as separate pages. New: approval status and queue, credential review, reasons, one detail with services.

## Code

office/app/experts, office/components/experts
