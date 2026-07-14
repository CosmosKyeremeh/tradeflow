-- ---------------------------------------------------------------------------
-- Helper: the calling user's organization_id, read from their profile row.
-- SECURITY DEFINER so it can read profiles regardless of the caller's own
-- RLS visibility, but it only ever returns data tied to auth.uid() itself.
-- ---------------------------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- New user trigger: every signup gets a profile row and a starter
-- organization automatically, so the app never has to handle a user with
-- no organization_id.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name, plan_tier)
  values (display_name || '''s organization', 'free')
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, role, full_name, email)
  values (new.id, new_org_id, 'owner', new.raw_user_meta_data ->> 'full_name', new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.shipments enable row level security;
alter table public.documents enable row level security;
alter table public.duty_calculations enable row level security;
alter table public.audit_log enable row level security;
alter table public.tariff_entries enable row level security;

-- Organizations: a user may only see their own organization.
create policy "org_select_own" on public.organizations
  for select using (id = public.current_organization_id());

-- Profiles: a user may see profiles within their own organization.
create policy "profiles_select_same_org" on public.profiles
  for select using (organization_id = public.current_organization_id());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- Clients: full CRUD scoped to the caller's organization.
create policy "clients_all_same_org" on public.clients
  for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- Shipments: full CRUD scoped to the caller's organization.
create policy "shipments_all_same_org" on public.shipments
  for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- Documents: full CRUD scoped to the caller's organization.
create policy "documents_all_same_org" on public.documents
  for all
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- Duty calculations: visible/editable via their parent shipment's organization.
create policy "duty_calculations_all_same_org" on public.duty_calculations
  for all
  using (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_id
        and s.organization_id = public.current_organization_id()
    )
  )
  with check (
    exists (
      select 1 from public.shipments s
      where s.id = shipment_id
        and s.organization_id = public.current_organization_id()
    )
  );

-- Audit log: read-only from the app's perspective, scoped to own organization.
create policy "audit_log_select_same_org" on public.audit_log
  for select using (organization_id = public.current_organization_id());

-- Tariff entries: shared reference data. Every authenticated user can read;
-- writes are intentionally left with no policy, so only the service role
-- (used by the future admin tariff-management workflow) can write.
create policy "tariff_entries_select_all" on public.tariff_entries
  for select using (auth.role() = 'authenticated');
