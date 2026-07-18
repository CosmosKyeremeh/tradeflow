# TradeFlow

Shipment, client, and duty management for Ghanaian traders and freight forwarders.
See `TradeFlow_PRD_v1.0.md` (from our planning conversation) for the full product spec.

Status: **Phase 0** (foundations), **Phase 1** (client & shipment CRUD),
**Phase 2** (duty calculator), **Phase 3** (documents & in-app
notifications), **Phase 4** (trade analytics), **Phase 5** (hardening &
compliance), and team invites (multi-user organizations) are in. See
[What's next](#whats-next-phase-6).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- Supabase (Postgres, Auth) via `@supabase/ssr`
- Drizzle ORM + Drizzle Kit for schema and migrations
- Deployed to Vercel; database on Supabase

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy the Project URL and the `anon` public key.
3. In **Project Settings → Database → Connection string**, copy the
   **Transaction pooler** connection string (best for serverless/edge — port `6543`).

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the three values from step 1, plus `ADMIN_EMAILS` — a comma-separated
list of accounts allowed to manage the shared tariff schedule at
`/dashboard/admin/tariffs` (see [Duty calculator](#duty-calculator) below).

## 3. Install dependencies

```bash
npm install
```

## 4. Apply the database schema

Seven migration files live in `drizzle/`, run in order:

- `0000_lonely_mauler.sql` — tables, enums, and foreign keys (Drizzle-generated from `src/db/schema.ts`)
- `0001_rls_and_triggers.sql` — row-level security policies and the
  new-user trigger that auto-creates an organization + profile on signup
- `0002_notifications.sql` — the `notifications` table (Drizzle-generated)
- `0003_documents_storage.sql` — notifications RLS, the private `documents`
  Storage bucket, and its org-scoped storage policies
- `0004_profile_column_grants.sql` — closes a privilege-escalation hole in
  the default Supabase PostgREST grants (see [Security & hardening](#security--hardening))
- `0005_invites_table.sql` — the `invites` table (Drizzle-generated)
- `0006_invites_rls_and_join_trigger.sql` — invites RLS, and updates
  `handle_new_user` to join an inviting organization instead of always
  creating a new one (see [Team invites](#team-invites))

Easiest path: open the **SQL Editor** in the Supabase dashboard, paste each
file's contents in order, and run it. Alternatively, with `DATABASE_URL` set
in `.env.local`:

```bash
npm run db:migrate
```

> `npm run db:migrate` only applies Drizzle-tracked migrations (`0000_...`,
> `0002_...`, `0005_...`). Run `0001_rls_and_triggers.sql`,
> `0003_documents_storage.sql`, `0004_profile_column_grants.sql`, and
> `0006_invites_rls_and_join_trigger.sql` manually via the SQL Editor, since
> RLS policies, Storage setup, and trigger/grant changes aren't part of
> Drizzle's own migration tracking in this setup. **`0004` is not optional**
> — without it, any signed-up user can escalate to admin or read another
> organization's data via Supabase's public REST API (see below).

## 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Sign up for
an account; the trigger in `0001_rls_and_triggers.sql` creates your
organization and profile automatically.

## Duty calculator

Duty estimates are driven by `tariff_entries` — shared reference data across
every organization (Ghana's actual published rates), so write access is
gated by the `ADMIN_EMAILS` allowlist rather than any org's role. Manage it
at `/dashboard/admin/tariffs` once your email is in that list.

To get a workable demo without the real GRA schedule in hand:

```bash
npm run db:seed
```

This inserts a handful of illustrative HS code/rate pairs, each description
prefixed `[EXAMPLE]`. **These are not real Ghana customs rates** — replace
them via the admin UI before quoting an actual client. The calculator itself
(`/dashboard/calculator`, and inline while creating a shipment) shows "no
published rate" rather than guessing when an HS code isn't in the table.

## Documents & notifications

Shipments can have files attached (invoice, packing list, certificate of
origin) via a private Supabase Storage bucket (`documents`). Uploads go
straight from the browser to Storage (not through a Server Action, which
caps request bodies at 1MB) using the user's own session; RLS on
`storage.objects` scopes access by the `{organizationId}/{shipmentId}/...`
path prefix, the same pattern every other table uses.

Status changes on a shipment notify every other member of the organization
(not the actor) via an in-app notification — the bell icon in the sidebar.
Email delivery is intentionally not wired up yet: it needs a real
provider and API key, which nobody had on hand when this phase was built.
The `notifications` table is the trigger point a future mailer job would
read from (see `src/lib/notifications.ts`).

## Trade analytics

`/dashboard/analytics` aggregates each organization's own data — no new
tables, just Drizzle group-by queries over `shipments` and
`duty_calculations` (`src/app/dashboard/analytics/queries.ts`): all-time
totals, shipment volume and duty calculated per month (last 6 months),
top HS codes, and top clients, all by shipment count/value. Charts are
small hand-rolled SVG components (`analytics/charts/`) rather than a
charting library, consistent with the rest of the UI kit. A CSV export
of every shipment (`/api/analytics/export`) is linked from the page
header.

## Team invites

Every sign-up used to always create a brand-new organization — there was
no way for a second person to join an existing one. `/dashboard/team` lets
any org member invite a teammate by email; the invite has no token. When
someone signs up with the exact email that was invited, `handle_new_user`
(updated in `0006_invites_rls_and_join_trigger.sql`) joins them to the
inviting organization (as `role: agent`) instead of creating a fresh one —
Supabase's own email confirmation is what proves they own that inbox, the
same proof a token would provide, so there's nothing extra to build or
leak. Inviting an email that already has a TradeFlow account is rejected
up front, since there's no "switch organizations" flow for an existing
user yet.

Roles (`owner` / `agent` / `viewer`) are stored but not yet enforced —
every member of an organization currently has equal full access to its
clients, shipments, and documents. Real per-role permissions (e.g. viewers
read-only) are a deliberately separate, future change.

## Security & hardening

Drizzle connects to Postgres directly (not through PostgREST), so it
bypasses RLS entirely — every Drizzle query in this codebase filters by
`organizationId` itself, and that app-layer filtering, not RLS, is what
protects the app's own request paths. RLS still matters for a *different*
reason: Supabase auto-exposes every table over a public REST API
(`/rest/v1/...`), authenticated by any signed-in user's own JWT, and grants
that role full table privileges by default. RLS policies are the only
gate on that path.

That gate had a real hole: `profiles_update_self` (and
`notifications_update_own`) only checked *which row* a user could touch
(`id = auth.uid()`), not *which columns*. Combined with Supabase's default
grants, this meant any authenticated user could `PATCH` their own
`profiles` row via the public REST API — bypassing the Next.js app
entirely — to rewrite `organization_id` (jump into another org's data),
`email` (spoof an `ADMIN_EMAILS` address and pass `isAdminEmail()`), or
`role`. Confirmed exploitable against a disposable test account, then
closed in `0004_profile_column_grants.sql` by revoking table-level
`UPDATE` and re-granting it only on the one column each table's own UI
lets a user change (`full_name`, `read_at`).

Also added this phase:

- Security headers in `next.config.ts` — CSP, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `Strict-Transport-Security` in production. The CSP allows
  `'unsafe-inline'` for scripts/styles (Next's streamed RSC payload and
  font optimization both inject inline `<script>`/`<style>` tags) — a
  nonce-based strict CSP would close that gap but forces every route into
  dynamic rendering, a bigger change than this pass took on.
- CSV/formula-injection guard on `/api/analytics/export` — a client or
  shipment name starting with `=`, `+`, `-`, or `@` now gets a literal-text
  prefix so it can't execute as a formula when opened in Excel/Sheets.
- `audit_log` (schema already had the table, nothing wrote to it) now
  records every client/shipment/document/tariff/invite create, update,
  and delete — see `src/lib/audit.ts`.
- Defense-in-depth: a couple of internal helpers (`syncShipmentDutyCalculation`,
  `deleteDocument`) that trusted their caller's ownership check now
  re-verify `organizationId` themselves.

**Known gaps, not fixed this phase** (need a product/legal decision, not
just code): no privacy policy or terms of service page exists yet, so none
is linked from signup — draft the actual legal content first, then it's a
quick wire-up. No self-service account/data-erasure flow for Data
Protection Act (Act 843) right-to-erasure requests; relatedly, deleting a
client is blocked once it has shipment history (`onDelete: "restrict"`),
which will need a retention-policy decision (customs records likely have
their own statutory retention period) before an erasure flow can be built.
Formal registration as a data controller with Ghana's Data Protection
Commission is an organizational step, not an engineering one. Team invites
(above) close the "every org is single-user" gap this section used to
flag.

## Installable (PWA)

`app/manifest.ts` (Next's native manifest route, served at
`/manifest.webmanifest`) plus a deliberately minimal `public/sw.js` make the
app installable — Chrome/Android show a native install prompt, and
`dashboard/InstallPrompt.tsx` renders a custom "Install" banner once
`beforeinstallprompt` fires (iOS gets manual "Share → Add to Home Screen"
instructions instead, since Safari has no install-prompt API). The service
worker does no offline caching on purpose — it exists only to satisfy
installability criteria; caching live shipment/duty data would mean showing
stale numbers, which is worse than no offline support at all.

`proxy.ts`'s auth-gate matcher explicitly excludes `manifest.webmanifest`
and `sw.js` — both need to stay reachable logged-out, since the browser
evaluates install criteria (and registers the worker) independent of auth
state, and neither is valid JSON/JS once redirected to the login page.

## Project structure

```
src/
  app/
    (auth)/login, (auth)/signup   — public auth pages
    dashboard/
      clients/, shipments/        — CRUD: bento cards/tables, optimistic UI, spatial-origin modals
      shipments/documents/        — file attachments (upload/list/delete)
      notifications/              — bell icon, unread list, mark-as-read
      calculator/                 — standalone duty calculator
      analytics/                  — trade analytics: aggregation queries, bento charts
      team/                       — invite/revoke teammates, member list
      admin/tariffs/              — tariff schedule CRUD (ADMIN_EMAILS-gated)
      layout.tsx, page.tsx        — protected shell + overview bento stats
      MobileNav.tsx, SidebarContent.tsx — hamburger drawer nav (mobile) / aside (desktop)
      InstallPrompt.tsx           — custom "Add to Home Screen" banner
    api/analytics/export/         — CSV export route handler
    manifest.ts                   — PWA web app manifest
    layout.tsx, globals.css       — root layout, design tokens (incl. glass/elevation/motion)
  components/ui/                  — Button, Card, Modal (portaled), Skeleton, Select, Input, PasswordInput, etc.
  db/
    schema.ts                     — Drizzle schema (source of truth)
    index.ts                      — Drizzle client
  lib/
    supabase/                     — browser and server clients
    auth.ts                       — requireProfile()/requireAdmin() helpers
    duty.ts                       — tariff lookup + duty calculation engine
    notifications.ts              — org-member notification fan-out
    audit.ts                      — writes to audit_log on every mutation
    utils.ts                      — cn() helper, GHS currency formatter
  proxy.ts                        — refreshes the Supabase session, gates protected routes
drizzle/                          — SQL migrations
public/sw.js                      — minimal service worker (installability only, no offline caching)
scripts/seed-tariffs.mjs          — seeds placeholder tariff rates (npm run db:seed)
next.config.ts                    — security headers (CSP, HSTS, etc.)
.github/workflows/ci.yml          — lint, typecheck, build on every PR
```

## What's next (Phase 6)

Closed pilot — onboard a handful of real forwarders/traders, gather
feedback, fix what actually breaks in practice. Mostly an operational
phase (recruiting pilot users, not code), though the "known gaps" above
(privacy policy, erasure flow) are worth resolving before real customer
data shows up.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate SQL from `src/db/schema.ts` after a schema change |
| `npm run db:studio` | Open Drizzle Studio to browse the database |
| `npm run db:seed` | Seed placeholder tariff entries (see [Duty calculator](#duty-calculator)) |
