# TradeFlow

Shipment, client, and duty management for Ghanaian traders and freight forwarders.
See `TradeFlow_PRD_v1.0.md` (from our planning conversation) for the full product spec.

Status: **Phase 0** (foundations), **Phase 1** (client & shipment CRUD),
**Phase 2** (duty calculator), and **Phase 3** (documents & in-app
notifications) are in. See [What's next](#whats-next-phase-4).

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

Four migration files live in `drizzle/`, run in order:

- `0000_lonely_mauler.sql` — tables, enums, and foreign keys (Drizzle-generated from `src/db/schema.ts`)
- `0001_rls_and_triggers.sql` — row-level security policies and the
  new-user trigger that auto-creates an organization + profile on signup
- `0002_notifications.sql` — the `notifications` table (Drizzle-generated)
- `0003_documents_storage.sql` — notifications RLS, the private `documents`
  Storage bucket, and its org-scoped storage policies

Easiest path: open the **SQL Editor** in the Supabase dashboard, paste each
file's contents in order, and run it. Alternatively, with `DATABASE_URL` set
in `.env.local`:

```bash
npm run db:migrate
```

> `npm run db:migrate` only applies Drizzle-tracked migrations (`0000_...`,
> `0002_...`). Run `0001_rls_and_triggers.sql` and `0003_documents_storage.sql`
> manually via the SQL Editor, since RLS policies and Storage setup aren't
> part of Drizzle's own migration tracking in this setup.

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
      admin/tariffs/              — tariff schedule CRUD (ADMIN_EMAILS-gated)
      layout.tsx, page.tsx        — protected shell + overview bento stats
      MobileNav.tsx, SidebarContent.tsx — hamburger drawer nav (mobile) / aside (desktop)
    layout.tsx, globals.css       — root layout, design tokens (incl. glass/elevation/motion)
  components/ui/                  — Button, Card, Modal (portaled), Skeleton, Select, Input, etc.
  db/
    schema.ts                     — Drizzle schema (source of truth)
    index.ts                      — Drizzle client
  lib/
    supabase/                     — browser and server clients
    auth.ts                       — requireProfile()/requireAdmin() helpers
    duty.ts                       — tariff lookup + duty calculation engine
    notifications.ts              — org-member notification fan-out
    utils.ts                      — cn() helper, GHS currency formatter
  proxy.ts                        — refreshes the Supabase session, gates protected routes
drizzle/                          — SQL migrations
scripts/seed-tariffs.mjs          — seeds placeholder tariff rates (npm run db:seed)
.github/workflows/ci.yml          — lint, typecheck, build on every PR
```

## What's next (Phase 4)

Trade analytics dashboard — aggregation queries and charts (volume over
time, top HS codes, duty totals, client activity), plus CSV export.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate SQL from `src/db/schema.ts` after a schema change |
| `npm run db:studio` | Open Drizzle Studio to browse the database |
| `npm run db:seed` | Seed placeholder tariff entries (see [Duty calculator](#duty-calculator)) |
