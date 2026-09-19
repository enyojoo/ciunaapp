-- Adds a profile avatar: a nullable public-URL column on users, plus a
-- public storage bucket users can write their own avatar into.

alter table public.users
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Path is `{auth.uid()}/filename` inside the avatars bucket.
-- Use split_part: storage.foldername() is easy to get wrong across dashboard templates.
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Avatar images are publicly readable" on storage.objects;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Own-row update (avatar_url). Extra permissive policy is OR'd with existing ones.
drop policy if exists "Users can update own avatar_url" on public.users;
create policy "Users can update own avatar_url"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
