-- ---------------------------------------------------------------------------
-- Invites: row-level security.
--
-- Deliberately no UPDATE policy for `authenticated` -- accepted_at is only
-- ever set by handle_new_user() below (SECURITY DEFINER, bypasses RLS).
-- Per the lesson from 0004: a permissive self-referential UPDATE policy
-- combined with Supabase's default table-level grants is how a privilege-
-- escalation hole gets in. With no UPDATE policy at all, RLS default-denies
-- it outright for every authenticated user, regardless of grants.
-- ---------------------------------------------------------------------------
alter table public.invites enable row level security;

create policy "invites_select_same_org" on public.invites
  for select using (organization_id = public.current_organization_id());

create policy "invites_insert_same_org" on public.invites
  for insert with check (organization_id = public.current_organization_id());

create policy "invites_delete_same_org" on public.invites
  for delete using (organization_id = public.current_organization_id());

-- ---------------------------------------------------------------------------
-- handle_new_user: now checks for a pending invite matching the new
-- account's email before falling back to creating a fresh organization.
-- No invite token exists or is needed -- Supabase's own email confirmation
-- is what proves the signer-upper actually owns that inbox, which is the
-- same proof a token would provide.
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
  pending_invite record;
begin
  select * into pending_invite
  from public.invites
  where lower(email) = lower(new.email) and accepted_at is null
  order by created_at desc
  limit 1;

  if pending_invite.id is not null then
    insert into public.profiles (id, organization_id, role, full_name, email)
    values (new.id, pending_invite.organization_id, 'agent', new.raw_user_meta_data ->> 'full_name', new.email);

    update public.invites set accepted_at = now() where id = pending_invite.id;

    insert into public.audit_log (organization_id, actor_id, action, entity_type, entity_id)
    values (pending_invite.organization_id, new.id, 'invite.accept', 'invite', pending_invite.id);

    return new;
  end if;

  display_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name, plan_tier)
  values (display_name || '''s organization', 'free')
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, role, full_name, email)
  values (new.id, new_org_id, 'owner', new.raw_user_meta_data ->> 'full_name', new.email);

  return new;
end;
$$;
