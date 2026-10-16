# Capture the live database schema (owner, about 5 minutes)

Goal: one schema-only file of the production `public` schema, committed as `supabase/baseline/live-schema.sql`.
It contains **no data** (no users, no orders). It lets us prove every migration against the real tables before you run it.

Do this before running `supabase/deploy/seller-portal-all.sql`. Read-only: nothing here changes the database.

## Option A: Supabase CLI (preferred)

```bash
# once: install the CLI (brew install supabase/tap/supabase) and log in
supabase login
cd /Users/a1/Projects/ciunaapp
supabase link --project-ref <PROJECT_REF>        # Dashboard > Project Settings > General > Reference ID
mkdir -p supabase/baseline
supabase db dump --linked --schema public -f supabase/baseline/live-schema.sql
```

`supabase db dump` needs Docker running (it uses a pg_dump container) and asks for the database password
(Dashboard > Project Settings > Database > "Reset database password" if you do not have it).
Do not add `--data-only` or `--use-copy`: we want schema only.

## Option B: plain pg_dump (no CLI, no Docker)

Needs `pg_dump` version 15 or newer (`brew install libpq && brew link --force libpq`; check with `pg_dump --version`).

1. Dashboard > Connect > "Session pooler" (or "Direct connection") > copy the URI. It looks like
   `postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
   Use port 5432 (session mode). Transaction mode (6543) does not work with pg_dump.
2. Run (paste the URI in single quotes so special characters in the password survive):

```bash
cd /Users/a1/Projects/ciunaapp
mkdir -p supabase/baseline
pg_dump 'postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres' \
  --schema-only --schema=public --no-owner --no-privileges --no-comments \
  -f supabase/baseline/live-schema.sql
```


## Where it goes

```
supabase/baseline/live-schema.sql      commit this file (it is schema only, safe to commit; check it has no password)
```

Check before committing:

```bash
grep -ci "password\|secret\|apikey" supabase/baseline/live-schema.sql   # expect 0 or only column names such as pin_hash
head -5 supabase/baseline/live-schema.sql
```

## Then

```bash
node scripts/verify-baseline.mjs               # applies the dump, then the deploy files twice, compares schemas
node scripts/verify-baseline.mjs --synthetic   # same thing against the repo-derived approximation (no dump needed)
```

If the script prints `all checks passed`, `supabase/deploy/seller-portal-all.sql` is verified against your real schema.
If it prints FAIL lines, send them back: they are real mismatches (a column or constraint that production has and the repo does not know about).

## Also useful (optional, 1 minute): list what the Seller file will find in production

Paste in the SQL Editor and send back the three results:

```sql
select version();
select count(*) as vendors, (select count(*) from hub_products) as products, (select count(*) from marketplace_orders) as orders from hub_vendors;
select table_name from information_schema.tables where table_schema = 'public' order by 1;
```
