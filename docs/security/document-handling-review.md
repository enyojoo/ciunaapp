# Document handling review

Review of `launch-readiness.md` section 7 against the code, 2026-10-25. Each line says what is true now, with evidence, and what is left.

| Requirement | Status | Evidence | Left to do |
| --- | --- | --- | --- |
| Seller documents are private, signed URLs only | Built | `lib/merchant/storage.ts`: `merchant-documents` created with `public: false`; `signedDocumentUrl` default 300 s | Owner confirms the bucket shows Private in the dashboard |
| KYC and receipt files are private, signed URLs only | Built in code, owner to confirm bucket | `kyc-documents`, `transaction-receipts` accessed only through `createSignedUrl` | Owner confirms both buckets are Private (`owner-steps.md`, step 11) |
| Customers see only their own receipts | Built | `app/api/receipts/documents/route.ts` checks the transaction belongs to the caller, and now rejects `..` and nested paths | none |
| Admin document access needs a role | **Fixed in this pass** | `admin/kyc/documents` and `admin/receipts/documents` ignored a failed admin check and signed anyway, so anyone who knew a file path could get a URL. Now behind `adminRoute("users.read")` and `adminRoute("orders.manage")` | none; guarded by `api/tests/merchant/admin-route-coverage.test.ts` (no route carries on after a failed check) |
| Signed URLs are short-lived | **Fixed in this pass** | Staff-facing document URLs lowered from 1 hour to 5 minutes (`createSignedUrl(filePath, 300)`, tested) | Customer receipts stay at 1 hour (their own file, shown in the app) |
| Every staff open is logged | **Fixed in this pass** | Both routes write `audit_log` `document.viewed` with actor, role and path; seller documents already audited on add | An alert on bulk access (more than 20 opens by one actor in 10 minutes) is an operations query to add once the pilot has volume |
| Uploads: type and size allow-list | Built | `lib/merchant/storage.ts`: images jpeg/png/webp up to 8 MB, documents also pdf up to 10 MB; path namespaced by merchant (`pathBelongsTo`) | Re-encode images and strip EXIF; virus scan before Office can open a file. Not built; needs a scanning service |
| No document URLs or personal data in logs or error reports | Built | `api/lib/error-report.ts` scrubs emails, tokens, card and phone numbers; test `error-report.test.ts` | The older admin document routes logged file paths with `console.log`; those lines are gone with the rewrite. Search for remaining `console.log` of paths before launch |
| Retention schedule | Open | Account deletion removes personal data after 30 days (`account-deletion.sql`) | Counsel sets the KYB and KYC retention period; then add a scheduled deletion job with a deletion log |
| App-layer encryption of ID numbers in `kyc_submissions.metadata` | Open | Payout details are encrypted (AES-256-GCM bound to the merchant; `payout-crypto.ts`) | Decide with counsel; the column is protected by RLS and service-role access only today |
| Anonymous access to tables | Checked | `scripts/rls-probe.mjs` (read only, anon key): 64 tables, none readable except `payment_methods` | Owner decides whether `payment_methods` (Ciuna's receiving bank details) should be public |
| Third parties and data transfer basis | Open | Processors: Supabase, Vercel, SES, Telegram, Bitbanker, YooKassa, push providers | Counsel: processing agreements and the basis for Russian personal data |

Re-run the probe after any policy change: `npm run db:rls-probe`.
