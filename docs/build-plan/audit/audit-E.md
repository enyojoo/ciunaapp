# Audit E: customer cards vs Expo app (Auth, Pin, Profile, More, Referrals, Support, Push)

Paths are under /Users/a1/Projects/ciunaapp/mobile unless stated. Desktop web: only app/auth/login.tsx has any width constraint in these screens; profile, more, referrals, support, pin use plain ScreenScroll (check Screen for a global max width; no desktop two-column layout anywhere).

## CustomerAuth - Mostly
Deliberate/OK: Apple + Google outline buttons, Or divider, eye toggle, forgot password flow (app/auth/forgot-password.tsx, reset-password.tsx, API-backed OTP), language chip (components/language-picker.tsx:LanguageChip, saved on device), lock check via /api/auth/login-attempt/status, notice cleared on edit.
- MISMATCH login error placement: card puts "Email or password is incorrect. Check both and try again." under the password field with red border (field error). app/auth/login.tsx:100 shows AuthNotice above the email field, no field border. Add `error` prop to Field (components/field.tsx) and pass for password; keep the lock banner on top.
- MISMATCH locked state: card disables the form and shows title "Too many attempts" + "Try again in N minutes, or reset your password." login.tsx:40 only sets a notice, form stays enabled; copy lacks reset link. Add `locked` state disabling Field/Sign in, keep social enabled.
- MISSING register live password rules (card: "At least 8 characters", "One number or symbol" tick as typed). register.tsx:34 checks `length < 6`, no rules list. Decide 6 vs 8 against Supabase policy first.
- MISSING register terms checkbox (card: "I agree to Terms and Privacy policy", Create account disabled until ticked). register.tsx:75 has sentence text, Terms link only, no Privacy link, no checkbox.
- MISMATCH register duplicate email: card says "This email already has an account. Sign in instead." with link, beside the email field. Built: generic `err` string from signUp in AuthNotice at top (register.tsx:44); on success it routes to login with no "check your email" message. Map the duplicate error code and add the Sign in link.
- MISMATCH language chip shows flag + "EN" code (language-picker.tsx:100); card shows own-script name ("English", "Русский", "中文"). Sheet rows lack the English name beneath (SheetPicker only label); card shows both.
- MISMATCH title copy: "Create an Account" / "Create Account" vs card "Create your account" / "Create account" (register.tsx:73, 148 defaults; check locale files).
- MISMATCH top bar has an extra Help (?) button (auth-chrome.tsx:44) that is not in the card; card top row is logo/back and language chip. Not in decisions file. Either remove or add to card.
- Sign-out: OK (More). Apple on Android: signInWithApple branches by platform (lib/auth-context.tsx:250); confirm Android behaviour shows a working button or hide it.
- States: loading is busy button only; offline shows the global banner and lock check is skipped silently (fine).

## CustomerPin - Partial
Deliberate deviations: PIN optional and never required; 5 wrong PINs sign out, "N attempts left" from the 3rd miss, no timed lockouts (80-decisions 2026-10-18). So "Too many attempts, try again in 1 minute", the disabled keypad and the lock plate are NOT gaps.
- MISSING unlock header: card shows initials avatar + "Welcome back, {first name}". app/pin.tsx:70 shows only "Welcome back" with no avatar or name (profile is available from useAuth).
- MISSING biometric key in keypad corner (card: bottom-left key). components/pin-keypad.tsx:48 renders an empty cell at [null]; biometrics only auto-prompt once on mount (pin.tsx:29, lib/pin.ts:29). If the user cancels, no way to retry. Add a scan-face key (decision: scan-face icon) calling tryBiometricUnlock.
- MISMATCH wrong-PIN message: card "Incorrect PIN. 2 attempts left." in one line; app shows "Incorrect PIN" and a separate muted attempts line only from 3rd miss (pin.tsx:84-91). Deliberate per decision for the count; fine, but join into one line when both are shown.
- MISMATCH keys are 56px high (pin-keypad.tsx:key height 56) vs card 72px circles; keys are rounded rectangles not circles. Change `key` to 72x72 round (keep 12 gap; 3x72+gaps fits 320 wide).
- MISSING PIN not locking on return after idle: PIN is checked only at session load (lib/auth-context.tsx:85); no AppState listener re-locks after background. Card purpose: "opens Ciuna quickly after idle time". Add re-lock on foreground after N minutes (setPinUnlocked(false)).
- MISSING Security settings screen (card state 11): PIN lock switch, Change PIN, biometric unlock switch, helper text. App has only the "Login PIN" row in More (more.tsx:112) pushing to pin-setup create/change. There is no way to turn PIN off (clearPin in lib/pin.ts:18 is never called) and no biometric toggle (biometric always on if enrolled). Build app/security.tsx and show state ("On"/"Off") on the row.
- MISMATCH pin-setup (app/pin-setup.tsx): errors (mismatch, wrong current PIN) use a toast (lines 37, 56), card shows inline red message under the title and red dots; dots do not turn red (no `error` prop passed). No progress dots (create/confirm/done). Title "Create your app PIN" copy: check pinSetup.createTitle. Change PIN: card requires new PIN differs from old; not checked.
- MISSING "Forgot PIN? Sign in with password" link text: card link says this; app has only "Log out" (pin.tsx:104). Log out is OK per card state 6; the first variant is a copy choice.
- MISSING Russian long title check: no wrap handling issue noted (centered Text, fine).
- Desktop web: biometric returns false (lib/pin.ts:30), keypad has maxWidth 360, OK.

## CustomerProfile - Mostly
- MISMATCH delete account on profile: profile.tsx:278 confirm then `showError(t("profile.deleteNotImplemented"))`, while More links to the real flow app/delete-account.tsx (blocked state, 30-day grace). Fix: make the profile row router.push("/delete-account") and delete the stale dialog (profile.tsx:339-351) and locale key.
- MISSING phone validation: card "Enter a 10-digit phone number after +7", Save disabled until valid, error state under field. profile.tsx:46 saves any text; no inline error, no +7 prefix handling. Names are accepted in any script (OK).
- MISMATCH Save feedback: success toast shows `t("profile.save")` ("Save") (profile.tsx:78); card says a "Saved" toast. Error is a generic toast, not field-level.
- MISMATCH edit bar not sticky: Discard/Save are inline under the card (profile.tsx:261); card has a sticky bar on phone and foot-of-plate on desktop. Language row disappears in edit mode (profile.tsx:219 only in view branch); card shows Language as a row in both. Email is hidden in edit mode (card keeps a locked email row).
- MISSING desktop web layout: no left column (photo plate + section links Profile, Verification, Referrals) and no two-column edit form; page is a single column. Add `isDesktop` branch.
- MISMATCH photo sheet labels "Take Photo"/"Choose from Library" (capitalised) vs card "Take photo", "Choose from library" (profile.tsx:123). Web: camera option should be hidden (launchCameraAsync on web).
- MISSING camera/library permission denied feedback: `if (!perm.granted) return` silently (profile.tsx:109). Add a toast or settings hint.
- MISSING avatar upload size/format error text is passed through from API; OK.
- Loading: no skeleton while profile is null; shows "Not set" rows (profile.tsx:46 uses profile?.…). Minor.
- OK: edit mode, base currency sheet with flags, language sheet (six languages), email locked with hint, photo remove confirm.

## CustomerMore - Mostly
Deliberate: tab label "More" not "Account" (80-decisions #15; note app/(app)/_layout.tsx:105 default copy is still "Account" via nav.account - verify the locale value says "More"; the shot design-system/reference/current-app/shots/more.png shows "Account" in the tab bar, which contradicts decision 15).
- MISMATCH row icon tiles are orange-tinted (more.tsx rows use colors.primaryDeep, tile colors.heroBody; shot more.png). Card: 32px neutral tile, orange not used on the screen; only Refer teal. Switch to neutral tile + ink icon in components/row.tsx and language-picker.tsx:icon.
- MISMATCH identity "Profile" chip is orange-tinted (openChip, more.tsx:197-205, colors.heroBody/primaryDeep); card uses neutral chip.
- MISMATCH verified tick: BadgeCheck is colors.success (green) OK; chip colours: verified chip uses refer teal (more.tsx:badgeVerified) but card says status colours (success green, amber for review/action needed, destructive for rejected). `kycLabel` is plain grey for every non-verified state, no amber/destructive and no icon (more.tsx:50-57, 80-90). Use SupportStatus-style tone map.
- MISMATCH extra rows vs card: Limits (more.tsx:94) and Notifications (more.tsx:129) are not in the card. Notifications is required by the 2026-10-18 decision; Limits is a post-card addition. Add both to the card (or confirm).
- MISMATCH group order: card Account group = Verification, Favourites, Refer, Login PIN; App group = Language, Recipients, Support, Legal. App puts Favourites in App group.
- MISMATCH "Delete account" link (more.tsx:155) sits above Sign out; card has none on More (it lives on Profile). Deliberate-looking; keep but move into Profile only if desired.
- MISMATCH Sign out icon+text red text; card says "its button is the only red fill" (dialog confirm). OK-ish.
- MISMATCH version hard-coded "1.0.0" (more.tsx:166); use expo-constants.
- MISMATCH language sheet rows: flag + native name, no English sub-label (language-picker.tsx:67). Card: native name with English name beneath.
- Loading/offline: the KYC chip has no loading state ("Take action" flashes before eligibility loads, per shot). Show a skeleton chip until `eligibility` resolves.
- OK: sign-out confirm dialog, six languages, language persists on device and account (language-picker.tsx:32).

## CustomerReferrals - Mostly
- MISSING error with retry: if /api/referrals/me fails (fetchReferralsMe throws) `data` stays undefined, screen shows blank cards with "—" (referrals.tsx:140, 211). Add LoadError (components/load-error.tsx) when `error && !data`.
- MISMATCH loading is a bare spinner (referrals.tsx:140); card state "first load" implies skeleton plates.
- MISMATCH programme paused: only the summary text turns into `programPaused` (referrals.tsx:107); card shows a neutral banner, and Share/Withdraw remain enabled. Add banner and disable Withdraw when `!program_active`.
- MISMATCH reward window date missing: each friend row shows tx count + earnings; card requires reward window date. `percentWindowEndsAt` is already in ReferralRow (referrals.tsx:28) but never rendered (refRow at ~line 255). Add "Rewards until {date}".
- MISMATCH withdraw errors are toasts (referrals.tsx:115-133); card shows inline "over balance" message with the number to stay under, in the sheet. Also withdraw is not disabled when balance 0, and submit success toast uses label "Submit request" instead of a confirmation sentence.
- MISMATCH colour: balance value and earnings use orange (balanceValue, refEarnings, progressFill); card: teal marks the programme, orange only for the one action. Switch to ink/teal. The sheet shows two orange/secondary buttons side by side (Share primary, Withdraw secondary) OK.
- MISMATCH tiers: card draws three segments with the current ones filled and "N more to next"; app has progress bar plus a tier list. The app is richer; log in reconciliation file rather than change.
- MISSING worked example line: `commissionRulesExample` exists (referrals.tsx:~230) as 11px muted; card requires one clear line. Raise size to 13.
- OK: code copy, link copy, QR, share, friends list, empty state, withdraw sheet via WebAwareModal.

## CustomerSupport - Mostly
Deliberate: no live chat, no assistant (decision 2026-10-18 removed the stub), "Contact support" wording, no promised reply times unless Office sets hours. So "Chat with us" row and the AI assistant states are not gaps.
- MISSING screenshot attachment on new request (card: topic chips, related order, message, screenshot). app/support/new.tsx has none. NEEDS-BACKEND: upload endpoint and `attachments` column on support_messages (private bucket, signed URLs); Office page must render them.
- MISMATCH support hours: support.tsx:112 shows static copy `support.hoursBody`; card says hours include the time zone and show an "outside hours" state. Per decision, show only if Office sets hours. NEEDS-BACKEND: a public config endpoint (support hours + tz) in Office settings; otherwise hide the card.
- MISMATCH Telegram link hard-coded `https://t.me/enyosamm` (support.tsx:63); should come from config (BRAND) or Office. Email subject "Support Request" is hard-coded English (support.tsx:56).
- MISMATCH FAQ has 3 static items; fine per card. Contact rows use orange icons on orange tint (colors.heroBody); card uses neutral tiles.
- MISMATCH thread bubbles: customer is orange with white text OK; agent bubble uses hard-coded #E5E7EB (support/[id].tsx:bubbleTheirs). Move to a token.
- MISSING thread loading/offline: while loading `thread` is null the screen is an empty View (support/[id].tsx:76); no skeleton. On send failure the draft stays and an error line shows (OK). Polling errors are swallowed silently (offline shows only the global banner).
- MISMATCH new request: the card's "error" state is inline; app has errorBox (OK). Subject field is extra (not in card, but API needs it). Topic chips scroll? `FilterChips` with 6 topics on 320px: confirm horizontal scroll. Related-order chips show truncated txn id + product title (long product titles; check ellipsis in FilterChips).
- MISMATCH request rows: no icon, no chevron; card has icon, title, last line, status badge, date. App has title, preview, badge, id and date, unread dot. Good enough; add icon if card is kept.
- Status words: In review / Awaiting you / Resolved OK.
- Desktop: lists use NARROW_COLUMN (centered), OK; support.tsx has no column constraint (single wide stack).

## PushAndInApp - Partial
- OK customer push built: orders (paid, accept, start, fulfill, cancel, refund), seller chat, support reply (api/lib/push-events.ts), tap routing in lib/push-registration.ts:routeForNotification (order, chat, support), per-category switches in app/notifications.tsx, token register/unregister.
- MISSING booking reminder push ("Join meeting" action, card Android state). NEEDS-BACKEND: a scheduled job for expert bookings (e.g. 15 minutes before start), a `booking` push category in push_preferences, and a route case in routeForNotification (`type: "booking"` -> order/booking screen). No action buttons are defined anywhere (Expo categories via Notifications.setNotificationCategoryAsync; "Track order", "Join meeting").
- MISSING order cancelled "refund note" check: copy lives in tEmail push.order.cancel.* (api locales); verify it mentions the refund and matches the email.
- MISMATCH toast: components/toast.tsx styles a white surface card with a left colour border (toast.tsx:97-106) and no bell icon; card says ink background, white text, bell icon, title + one line. Toasts also stack (toast-provider.tsx:showToast appends) while card says a new one replaces the last. Default 3s vs 5s on PushTransfer card. Foreground handler (lib/push-registration.ts:9) lets the OS show a system banner while the app is open instead of an in-app toast; add a foreground listener (addNotificationReceivedListener) that calls showToast with a tap action to open the route.
- MISMATCH badges: tab bar badges exist (app/(app)/_layout.tsx:98 Orders = unread chat count, :106 More = support unread) but card says badges count required actions on Orders and Messages (there is no Messages tab). Orders badge counts unread messages, not actions; decide and document. Badge colour/size default of React Navigation, not 18px orange with white number.
- MISSING quiet hours: not built (no setting, no server check in api/lib/push.ts). NEEDS-BACKEND: `quiet_start/quiet_end/timezone` on push_preferences and the check in sendPushToUser.
- Seller push/toast: out of scope for the customer app.

## PushTransfer - Far (not built, expected: card says "New")
- MISSING all transfer pushes: no `type: "transfer"` in api/lib/push-events.ts, no kind in routeForNotification, no preference category in app/notifications.tsx (only orders, messages, support). NEEDS-BACKEND: hooks on transfer status changes (payment received, sent, delivered, failed, refund sent) sending via sendPushToUser with new category "transfers" (add column to push_preferences, migration), copy in tEmail locales (six languages) matching transfer emails, `data: { type: "transfer", transactionId }`, and a route to /pay/[transactionId] or the transaction screen. Enforce max 4 pushes per transfer (idempotency table or notified_at columns like marketplace_events).
- NEEDS-BACKEND rate-expiry warning two minutes before the quote window closes: needs the quote expiry timestamp from the API (the card notes this) and a scheduler (per-minute job already exists for orders) plus actions "Pay now" / "Get a new rate".
- MISSING in-app toast for transfer delivered / payment not received (destructive variant, "your money is safe" wording). Toast infrastructure exists (components/toast-provider.tsx; types success/error) but needs the ink style and replace-not-stack behaviour described under PushAndInApp.
- Privacy rule: amounts allowed on lock screen, account numbers never; check copy when written.

## Cross-cutting
- Offline: global OfflineBanner covers all; none of the audited screens add their own cached-data labels except referrals/support via useCachedQuery. Profile, More, notifications screens fetch without cache (notifications.tsx falls back to all true on failure, hiding real errors).
- 320px: auth screens use maxWidth 448 and 44px hit boxes, fine; PIN dots 4x44+gaps ok; pin keypad needs re-check when keys grow to 72px (3x72+2x12=240, fits).
- Sign-in options email/Apple/Google present on both login and register. Password reset OK. Language switching before sign-in OK. Sign-out OK (More, PIN screen).
