-- Property card images are private and scoped by auth.uid() in Storage paths.

alter table properties
add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can read own property images" on storage.objects;
create policy "Users can read own property images"
on storage.objects for select
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own property images" on storage.objects;
create policy "Users can upload own property images"
on storage.objects for insert
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own property images" on storage.objects;
create policy "Users can update own property images"
on storage.objects for update
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own property images" on storage.objects;
create policy "Users can delete own property images"
on storage.objects for delete
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
