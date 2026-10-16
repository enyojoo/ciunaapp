# OfficeHubSettings

## Purpose
The Settings tabs that `OfficeSettings` only lists: Hub services (which lines customers see and in what order), Payment methods per currency, and the Rates, Fees and Fulfilment links that leave Settings for their own pages.

## Anatomy
- Tab row shared with OfficeSettings: General, Hub services, Payment methods, Rates, Fees, Roles. Rates and Fees carry an external-link icon because they open their own pages.
- Hub services: header with Add service line; rows of drag handle, order number, icon, title and slug, type badge (`hub_category`, `app_link`, `external_url`), the description customers see, an On switch and an Edit button. A save bar appears when the order changed. A link row opens Marketplace fulfilment configuration.
- Edit service line dialog: title, slug (fixed after create), order, short description, icon upload, type, enabled, route, external link. Beside it, a preview of the customer Home tiles in order with disabled lines dimmed.
- Payment methods: grouped by currency with a flag and code header and a count of enabled methods. Each row: display name (editable, what customers see), provider and type (Office only), minimum amount in that currency, Default badge, On switch, row menu.
- Add payment method dialog: currency, type, display name, provider, minimum, account fields, instructions, make default. Turn-off confirmation names the consequence.
- Link rows: Rates (12 currencies, last update), Fees (active rules), Marketplace fulfilment.

## States
Hub services: default; order changed with save bar; line off (row dimmed, tile hidden); edit dialog. Payment methods: default; method off; add dialog with a field error; turn off the default method; read-only role (list visible, switches locked, Add and edit hidden). Links: default.

## Rules
- Customers see the display name only. Provider names (Bitbanker, Sberbank, Tinkoff) are shown here because Office may name providers; they never reach customer or seller screens.
- Money uses the system format with the currency's own symbol (`₽3,000`, `₦15,000`, `¥100`, `$20`).
- Turning off a line or the default method states what customers will see. If a currency would be left with no enabled method, Office says so before saving.
- Hub services is for ops and super_admin; Payment methods is for finance and super_admin. Other roles see read only and the controls are hidden.
- Every change is written to the audit log with who and when. Edits apply to new payments and new sessions only.

## Upgrade
Built (`office/app/settings/page.tsx`, `office/components/settings/hub-service-lines-manager.tsx`): a single tabbed settings page with tabs Platform, Payment Methods, Security, Referrals, Hub Services, Rates and Admin. Differences:
- Hub services: today order is the numeric Sort order field in the edit dialog and the list is not sorted by dragging; the On switch saves at once with no confirmation. Drag handles, the order column, the save bar, the customer tile preview and the consequence text are New. Empty and skeleton states exist and are kept.
- Payment methods: today a table (Currency, Type, Name, Provider, Details, Status, Default, Actions) with a long add and edit dialog and a Make default action. Grouping by currency, inline display name, the minimum amount (no minimum field exists in `payment_methods`), the in-row switch and the turn-off confirmation are New. Account details (bank, IBAN, wallet) stay in the edit dialog.
- Rates and Fees: Rates is today a tab with the currency table (`office-rates-panel.tsx`); Fees is its own page (`/fees`). The card shows both as links with one-line summaries.
- Marketplace fulfilment is today a button on `/marketplace`; the extra link here is New.

## Code
`office/app/settings/page.tsx`, `office/components/settings/hub-service-lines-manager.tsx`, `office/components/settings/office-rates-panel.tsx`, `office/app/fees/page.tsx`, `office/app/marketplace/page.tsx`
