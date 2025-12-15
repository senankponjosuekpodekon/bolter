-- Create Supabase Storage bucket for profile avatars
-- Bucket: profile-avatars (private), max ~2MB images (JPG/PNG/WebP)

-- 1) Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'profile-avatars', 'profile-avatars', false
where not exists (
  select 1 from storage.buckets where id = 'profile-avatars'
);

-- 2) Ensure RLS is enabled on storage.objects (default in Supabase)
-- Policies: users can manage their own avatar files under folder {auth.uid()}/

-- Helper: allow users to insert files into their own folder
drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to select (read) only their own avatar files
drop policy if exists "Users can read their own avatars" on storage.objects;
create policy "Users can read their own avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar files
drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins: allow full access to avatar files (assuming role 'service_role' via server key)
-- Note: Supabase service role bypasses RLS; retained for clarity.

-- 3) (Optional) Constraint: limit allowed MIME types via application-level validation
-- Enforced in backend (Sharp/validation) rather than database.
