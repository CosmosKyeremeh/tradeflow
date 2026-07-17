-- ---------------------------------------------------------------------------
-- Security fix: profiles/notifications self-update policies only pin `id`
-- (or `recipient_id`), not which *columns* may change. Combined with
-- Supabase's default table-level GRANT UPDATE to `authenticated` on every
-- public table, any signed-in user could PATCH their own row directly via
-- the PostgREST API (bypassing the Next.js app entirely) to rewrite:
--   - profiles.organization_id -- jump into another organization's data
--   - profiles.email           -- spoof an ADMIN_EMAILS address and pass
--                                  isAdminEmail() (src/lib/auth.ts)
--   - profiles.role            -- self-elevate
--   - notifications.*          -- rewrite/reassign another member's notice
-- Confirmed exploitable against a disposable test account before this fix
-- (email and role rewrites both succeeded with a plain authenticated PATCH).
--
-- clients/shipments/documents/duty_calculations don't have this problem:
-- their policies already carry a WITH CHECK that re-validates
-- organization_id (or a join to it) on every write. profiles' and
-- notifications' policies never had an equivalent WITH CHECK, so the fix
-- here is at the column-grant level instead: only allow updating the one
-- field each table's own UI actually lets a user change.
-- ---------------------------------------------------------------------------

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
