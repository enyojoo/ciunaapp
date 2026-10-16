# CustomerKyc

## Purpose
Identity and address verification: what the customer must do to send money and what their limit is at each level.

## Anatomy
Hub: status hero (icon, title, line), one primary action, document rows with status badges (Identity, Address), a Your limit card with three levels and the monthly limit for each, the current level tinted. Flow: header, four-segment progress bar and "Step n of 4"; choose country and document type; capture front with a guide frame, tips and shutter; selfie; review thumbnails with Retake; Submit for review. Address: radio list of accepted documents, file drop, Submit.

## States
Not verified; document pick; capture aligning, too blurry, accepted; review; in review (warning); approved (success); rejected with listed reasons (destructive); address proof; hub when rejected; Russian.

## Rules
One status vocabulary: Not started (neutral), In review (warning), Verified (success), Rejected (destructive), always with a word. Reasons for rejection are specific and actionable. Say how long review takes and where the update arrives. Never name the verification provider. Photos: JPG, PNG or PDF up to 10 MB. The customer can still browse Send before verifying; Send's Continue becomes Verify identity.

## Upgrade
Differs from the built app (`verification/index.tsx`, `identity.tsx`, `address.tsx`, `bitbanker.tsx`): levels with per-level monthly limits (New); native capture steps with tips and live quality feedback (today a hosted verification and a file picker); structured rejection reasons (today a single "Rejected" title); the hosted provider's name is removed from copy.

## Code
`mobile/app/verification/*`
