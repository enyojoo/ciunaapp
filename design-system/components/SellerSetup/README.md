# SellerSetup

## Purpose
The one page where a new business gets approved: finish the profile, choose a verification type, fill the details, upload documents, add a first listing and submit for Ciuna's review.

## Anatomy
Page title with status badge (Draft, In review, Rejected, Approved), a banner for the review outcome, then numbered cards: 1 Business profile, 2 Logo, 3 Choose verification type (two choice cards: Individual, Registered company; a chip names the base country), 4 Verification details (fields from the country and type), 5 Verification documents (one row per required document with upload button, file name, status badge, remove, and Ciuna Office's reason when rejected), 6 First listing, 7 Submit for review. Each card header ends with a Done or To do badge.

## States
Draft (partially done, submit disabled with the reason); rejected (reason banner, rejected documents with reason, everything editable again); in review (read-only, no submit card); approved (success banner, approved documents locked); document statuses Not uploaded, In review, Approved, Rejected, Expired; field error.

## Rules
Requirements come from the base country chosen in onboarding and the type chosen here; the card names the country. Status is always a badge with a word and an icon. Approved documents cannot be removed. A rejected document shows the Office reason verbatim under the file. Optional documents are labelled Optional in text. Submit stays disabled, with the reason, until required steps are done. Money and limits are not shown here.

## Upgrade
Built in `seller/app/(shell)/setup/page.tsx` with 4 steps. Differs from the built portal: verification is split into three cards (type, details, documents) so each has its own Done state and the checklist on Home maps one to one; the country chip and the by-country table are new; each document row shows a Not uploaded badge and an Upload again button after a rejection; the logo card shows the current logo. Copy for existing steps is as built.

## Code
`seller/app/(shell)/setup/page.tsx`
