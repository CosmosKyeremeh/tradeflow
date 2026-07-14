# TradeFlow — Product Requirements Document

| | |
|---|---|
| **Document status** | Draft v1.0 |
| **Prepared for** | Cosmos Kyeremeh (Borngr8) |
| **Date** | July 13, 2026 |
| **Working title** | TradeFlow (rename freely — used as a placeholder throughout) |
| **Classification** | Internal planning document |

---

## 1. Executive summary

TradeFlow is a web platform that helps Ghanaian SME importers/exporters and freight forwarders manage the commercial side of a customs shipment — tracking clients and jobs, estimating duty before goods arrive, and understanding trade activity over time — without needing to touch multiple disconnected tools or spreadsheets.

It is **not** a replacement for ICUMS (Ghana's official customs clearance system) and does not submit declarations on a user's behalf. It sits alongside ICUMS as a business-management layer: the place where a forwarder or importer plans a shipment, estimates cost, and keeps records, before and after the actual clearance happens on the government system.

This version of the PRD scopes a **software engineering build only** — no machine learning components are included in V1. A semantic HS-code matching feature was considered and is parked as a V2+ candidate (see §14, Phase 8).

---

## 2. Problem statement

Small and mid-sized importers/exporters in Ghana, and the freight forwarders who serve them, currently rely on a mix of WhatsApp threads, paper folders, and manual lookups against tariff PDFs to:

- Remember which client's goods are where in the clearance process
- Estimate duty before committing to an order (often guessed, sometimes wrong)
- Report back to clients on shipment status
- Understand their own business volume and trends over a month or quarter

None of this is well served by ICUMS itself, which is built for formal declaration submission, not day-to-day client and business management. There is room for a lightweight, mobile-friendly tool that sits on top of that reality.

---

## 3. Goals and non-goals

### Goals (V1)
- Give freight forwarders and SME traders one place to track clients, shipments, and duty estimates
- Make duty estimation fast and accurate enough to quote a client with confidence
- Surface basic business intelligence (volume, trends, top HS codes) from the user's own data
- Work reliably on modest Android devices and inconsistent mobile connectivity
- Be simple enough that a single-person forwarding operation adopts it in one sitting

### Non-goals (V1)
- No live integration with ICUMS (no scraping, no unauthenticated API calls against a government system)
- No submission of actual customs declarations
- No machine learning / predictive features (parked — see §14, Phase 8)
- No payment processing in V1 (may be introduced later if a subscription model is adopted)
- No multi-country support — Ghana only, GHS currency, Ghana tariff schedule

---

## 4. Target users

| Persona | Description | Primary need |
|---|---|---|
| SME importer/exporter | Runs a small trading business, imports goods periodically, no dedicated logistics staff | Fast duty estimate, simple shipment record |
| Freight forwarder / customs broker | Manages shipments for multiple clients professionally | Multi-client dashboard, status tracking, reporting |
| Platform admin (internal) | Maintains tariff data, monitors platform health | Content management, oversight |

---

## 5. Scope

### In scope (V1)
- Organization and user account management with role-based access
- Client and shipment record-keeping (manual entry, not scraped from ICUMS)
- Duty calculator using Ghana's published tariff schedule
- Document attachment per shipment (invoices, packing lists, certificates)
- Manual shipment status tracking (a human updates status; no live feed)
- Analytics dashboard scoped to the organization's own data
- Mobile-responsive, installable as a Progressive Web App (PWA)

### Out of scope (V1) — parked for later
- Semantic HS-code text classifier (dropped from this scope per your direction; see §14)
- Live ICUMS cargo/BOE status integration
- Subscription billing / payments
- Multi-language UI (English only for V1; Twi/French considered later)
- Multi-agency single-window features (Free Zones, GSA, etc.)

---

## 6. Product modules

### 6.1 Shipment & client hub (core)
The system of record. Every organization manages its clients and shipments here — creating jobs, attaching documents, and updating status through a defined lifecycle (e.g. *Booked → In transit → At port → Cleared → Delivered*).

### 6.2 Duty calculator
A rules-based calculation engine driven by a versioned copy of Ghana's tariff schedule (HS code → duty rate, plus applicable levies). Given an HS code, customs value, and quantity, it returns an itemized duty estimate. Designed to be invoked either standalone or inline while creating a shipment.

### 6.3 Trade analytics dashboard
Aggregates the organization's own shipment and duty data into charts: volume over time, most common HS codes, average duty paid, client activity. No cross-organization data sharing in V1.

### 6.4 Cross-cutting concerns
Authentication, organization/role management, notifications (email, and in-app), document storage, and audit logging apply across all three modules rather than belonging to one.

---

## 7. Functional requirements (representative user stories)

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| FR-1 | Forwarder | Create a client record | I can associate shipments with them |
| FR-2 | Forwarder | Create a shipment with HS code, value, and client | I have one record per job |
| FR-3 | Forwarder | Get an instant duty estimate while creating a shipment | I can quote the client accurately |
| FR-4 | Forwarder | Attach documents to a shipment | I don't lose paperwork |
| FR-5 | Forwarder | Update a shipment's status manually | Clients and my team know where things stand |
| FR-6 | Owner/Admin | View a dashboard of shipment volume and duty totals over time | I understand my business trends |
| FR-7 | Admin (internal) | Update the tariff schedule when rates change | Duty estimates stay accurate |
| SME importer | See my past shipments and their duty history | I can plan future imports |

Full acceptance criteria to be written per-ticket during each phase rather than exhaustively here — this PRD defines *what*, sprint planning defines the detailed *done* criteria.

---

## 8. Non-functional requirements

- **Performance** — Core pages interactive in under 2 seconds on a mid-range Android device over 3G-equivalent connectivity.
- **Offline resilience** — Read views (recent shipments, client list) remain viewable when connectivity drops, via PWA service-worker caching; writes queue and sync when connectivity returns.
- **Security & data protection** — Compliance with Ghana's Data Protection Act, 2012 (Act 843): explicit consent for stored personal/client data, data minimization, and a defined retention policy. Row-level security enforced at the database layer so one organization can never see another's data.
- **Availability** — Target 99.5% uptime for a V1 product of this size; formal SLA not required until a paying customer base exists.
- **Accessibility** — WCAG 2.1 AA as a baseline for forms and navigation.
- **Localization** — GHS currency formatting and Ghana date conventions by default; architecture should not hard-code English strings in a way that blocks future translation.
- **Auditability** — Every duty calculation and status change is timestamped and attributable to a user, for dispute resolution.

---

## 9. Technical architecture

Chosen to stay consistent with your existing stack and skills, while reflecting current (2026) best practice rather than defaulting to older patterns out of habit.

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js (App Router), TypeScript | Server Components reduce client JS; you already know this from Printly |
| UI | Tailwind CSS + shadcn/ui | Fast to build, accessible defaults, easy to theme |
| PWA | next-pwa or native service worker | Offline resilience is a real requirement here, not a nice-to-have |
| Backend/data | Supabase (Postgres, Auth, Storage, Realtime) | Managed Postgres with row-level security gives you multi-tenant isolation almost for free |
| API layer | Next.js Route Handlers, typed end-to-end with Zod schemas shared client/server | Avoids a duplicate validation layer and catches shape mismatches at compile time |
| Realtime updates | Supabase Realtime | Shipment status changes can push to connected clients without polling |
| Deployment | Vercel (frontend), Supabase managed Postgres | Matches your existing Printly deployment pattern |
| Observability | Sentry (errors), Vercel Analytics (performance) | Cheap to add early, expensive to retrofit later |
| CI/CD | GitHub Actions — lint, typecheck, test, preview deploy per PR | Catches regressions before they reach a client-facing environment |
| Testing | Vitest (unit/integration), Playwright (end-to-end) | Standard, well-supported, works well with Next.js |

**Note on future-proofing**: the data layer should store HS codes, tariff entries, and shipment descriptions as plain text/relational fields now. If the semantic HS-matching feature from our earlier discussion is revisited later, Supabase's `pgvector` extension can be enabled on the same database without a migration to a separate system — so nothing here needs to be built differently today to keep that door open.

---

## 10. Data model (conceptual)

| Entity | Key fields | Relationships |
|---|---|---|
| Organization | name, plan tier | has many Users, Clients |
| User | email, role (Owner / Agent / Viewer) | belongs to Organization |
| Client | name, contact info | belongs to Organization, has many Shipments |
| Shipment | HS code, value, status, dates | belongs to Client, has many Documents, one DutyCalculation |
| DutyCalculation | HS code, rate applied, computed duty, tariff schedule version used | belongs to Shipment |
| Document | file reference, type, uploaded by | belongs to Shipment |
| TariffEntry | HS code, description, rate, effective date | referenced by DutyCalculation |
| AuditLog | actor, action, entity, timestamp | references any entity |

A full SQL schema (tables, constraints, indexes, RLS policies) is a Phase 0 deliverable, not part of this document.

---

## 11. Success metrics

- Number of shipments logged per active organization per week
- Duty calculator usage rate (% of shipments that used it vs. manual entry)
- Median time to create a shipment record
- Weekly active organizations (retention proxy)
- Support/error report volume per week (quality proxy)

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tariff schedule changes and estimates go stale | Version every tariff entry with an effective date; admin workflow to publish updates |
| No live ICUMS data means status is only as current as manual updates | Set expectations clearly in the UI; revisit integration only if/when formal API access becomes available |
| Low initial trust from forwarders used to manual methods | Pilot with a small number of known contacts first (see Phase 6); prioritize speed and reliability over feature breadth |
| Connectivity issues in the field | PWA offline caching for reads; optimistic UI with background sync for writes |

---

## 13. Assumptions and dependencies

- Ghana's published tariff schedule (HS code, description, rate) is obtainable and can be re-published as structured data inside the platform
- Users have a smartphone or laptop and at least intermittent internet access
- No dependency on ICUMS credentials or API access for V1

---

## 14. Build phases (roadmap)

Each phase ends with something demonstrable — use these as natural check-in points.

**Phase 0 — Foundations (1–2 weeks)**
Repository setup, CI/CD pipeline, Supabase project provisioning, auth scaffolding, design tokens, base SQL schema and row-level security policies.

**Phase 1 — Shipment & client hub MVP (2–3 weeks)**
Organization/user roles, client CRUD, shipment CRUD, status lifecycle. This alone should be usable end-to-end by a single forwarder.

**Phase 2 — Duty calculator (1–2 weeks)**
Tariff schedule data model and admin entry workflow, calculation engine, integration into the shipment creation flow.

**Phase 3 — Documents & notifications (1–2 weeks)**
File upload/storage per shipment, email and in-app notifications on status change.

**Phase 4 — Trade analytics dashboard (1–2 weeks)**
Aggregation queries, charts (volume, top HS codes, duty totals), basic export (CSV).

**Phase 5 — Hardening & compliance (1 week)**
Security review, RLS policy audit, Data Protection Act compliance pass, performance testing on low-end devices, accessibility audit.

**Phase 6 — Closed pilot (2–4 weeks)**
Onboard a handful of real forwarders/traders, gather feedback, fix what actually breaks in practice rather than what seemed risky on paper.

**Phase 7 — Public launch and iteration (ongoing)**
Open signups, monitor the success metrics in §11, iterate based on real usage.

**Phase 8 — Future / V2 candidates (not scheduled)**
Semantic HS-code matching (parked from this scope, see our earlier discussion), formal ICUMS integration if/when access is available, subscription billing, multi-language support, mobile-native app.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| HS Code | Harmonized System code — international standard for classifying traded goods |
| CPC | Customs Procedure Code — indicates the customs regime applied to goods |
| BOE | Bill of Entry — the formal customs declaration document |
| ICUMS | Integrated Customs Management System — Ghana's official customs platform |
| GRA | Ghana Revenue Authority |
| RLS | Row-Level Security — database-enforced data isolation between tenants |
| PWA | Progressive Web App — a web app installable and usable offline like a native app |

---

*End of document. Treat this as a living reference — revise section 14 as phases complete or scope shifts.*
