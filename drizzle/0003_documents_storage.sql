-- ---------------------------------------------------------------------------
-- Notifications: row-level security
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for shipment documents.
-- Objects are stored at "{organization_id}/{shipment_id}/{filename}", so
-- storage.foldername(name) lets policies scope access by organization the
-- same way every other table does.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "documents_bucket_select_same_org" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

create policy "documents_bucket_insert_same_org" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

create policy "documents_bucket_delete_same_org" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );
