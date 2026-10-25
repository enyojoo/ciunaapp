-- Expert credentials review. Experts list credentials (title, issuer, year) on their profile; Office now approves or
-- rejects them. `credentials_review` is null until someone reviews (shown as "pending" when the list is not empty), and
-- the API sets it back to null when the expert edits their credentials, so an approval never covers new text.
begin;
set local lock_timeout = '5s';

alter table expert_profiles
  add column if not exists credentials_review text check (credentials_review is null or credentials_review in ('approved', 'rejected')),
  add column if not exists credentials_review_reason text,
  add column if not exists credentials_reviewed_by uuid,
  add column if not exists credentials_reviewed_at timestamptz;

commit;
