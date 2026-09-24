-- Persist Bitbanker verification form data for compliance (office).

alter table bitbanker_verification_attempts
  add column if not exists form_snapshot jsonb;

alter table bitbanker_client_refs
  add column if not exists last_form_snapshot jsonb,
  add column if not exists last_form_submitted_at timestamptz;

comment on column bitbanker_verification_attempts.form_snapshot is 'Normalized IDX form fields submitted on this attempt';
comment on column bitbanker_client_refs.last_form_snapshot is 'Latest successful verification form snapshot for compliance';
