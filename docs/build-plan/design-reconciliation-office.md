# Design reconciliation: Office

Where the built Office is better than its design card. Rule: the built UI wins; the card should change to match. Each row: screen, card, what the app does better, what the card should change to.

| Screen | Card | The app does better | Change the card to |
| --- | --- | --- | --- |
| Merchant review decision dialog | OfficeMerchantReview | Reason chips fill the textarea and the picked chip stays highlighted (`aria-pressed`); Cmd or Ctrl+Enter confirms; server error shows inside the dialog; the same dialog is reused for documents, payouts and reviews with different chip sets. | Draw the chips as a selected state, show the in-dialog error line and the keyboard hint. |
| Merchant review layout | OfficeMerchantReview | The Upgrade line says there is no sticky panel and no owner team; the app already has both (`lg:sticky` decision column, owner team card). Missing required answers already read "Required, not provided" with an icon. | Remove "no sticky panel / no owner team" from Upgrade; keep only the inline Approve-disabled reason (now built). |
| Merchants queue | OfficeMerchantsQueue | Tabs, count on In review, debounce search, type filter, Office-managed marker, paging with range text and Previous/Next already exist. | Show paging footer and the Office-managed marker; Owner/SLA/Claim stay "needs API" until `assigned_to` and SLA targets are served. |
| Payouts | OfficePayouts | Verified/Unverified now in the row; net payable column next to fee; audited "Show payout details" reveal with verified switch inside the same dialog; Mark as paid asks for the reference in its own small dialog. | Draw Fee and Net payable columns, the reveal inside the detail dialog, and the reference dialog. |
| Fees | OfficeFees | Each tab already carries its own explanatory sentence including "Edits here never change orders already accepted"; rules are already grouped by scope with dimmed inactive rows; the calculator sits below the plans and names the rule used. | Drop the "make the note a banner" Upgrade; use the per-tab sentence. |
| Audit | OfficeAudit | Expandable row shows the full JSON plus raw ids for entry, merchant, actor and entity (copyable). | Draw the expanded JSON row with the id footer. |
| Reviews moderation | OfficeReviewsModeration | Already built with hide reasons; no change needed. | None. |
| Shell | OfficeShell | Sidebar groups are collapsible with the active group opened automatically; the longest-prefix rule keeps `/fees` and `/fees/settings` from both lighting up. | Draw groups as collapsible with chevron; note that the role chip sits in the header at the right. |
| Dashboard | OfficeDashboard | The built dashboard has live activity feed and service line popularity that the card does not show. | Keep the activity feed and service-line popularity below Needs action. |

Not yet comparable (no API): saved views, claim and owner, SLA targets, queue counts in the sidebar, Cmd-K search.
