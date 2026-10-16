# DocumentUpload

## Purpose
One row per verification document in setup and in Settings, so a seller can see what Ciuna needs, what is uploaded and what Office decided.

## Anatomy
File icon and label, Required badge or "Optional" text, status badge, upload button (secondary, 36px), uploaded file chip (name, size, remove), expiry line, and on rejection a destructive banner with the Office reason.

## States
Empty (Upload), uploading (progress), in review (amber, file removable), approved (green, locked, valid-until date), rejected (reason and re-upload), expired (red, renew), expiring in 30 days (amber warning line), upload error (file too large or wrong type).

## Rules
Approved files are locked and can't be removed. The Office reason is quoted verbatim. Accepted: PDF, JPG, PNG up to 10 MB. Dates in the form "Mar 14, 2027". Status always carries a word and icon.

## Upgrade
Built today: label, optional marker, upload, status chip, remove. New: expiry and warning lines, uploading progress, the quoted-reason banner and the locked approved state.

## Code
`seller/app/(shell)/setup/page.tsx`
