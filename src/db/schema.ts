import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  bigint,
  timestamp,
  jsonb,
  date,
  numeric,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum("role", ["owner", "agent", "viewer"]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "booked",
  "in_transit",
  "at_port",
  "cleared",
  "delivered",
]);

export const docTypeEnum = pgEnum("doc_type", [
  "invoice",
  "packing_list",
  "certificate_of_origin",
  "other",
]);

// ---------------------------------------------------------------------------
// Organizations & people
// ---------------------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  planTier: varchar("plan_tier", { length: 50 }).notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Mirrors a row per Supabase auth.users id. Created via a DB trigger on
// signup (see supabase/migrations/0001_init.sql) rather than app code,
// so every authenticated user always has a matching profile row.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // == auth.users.id
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  role: roleEnum("role").notNull().default("agent"),
  fullName: varchar("full_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Clients & shipments
// ---------------------------------------------------------------------------

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shipments = pgTable("shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  hsCode: varchar("hs_code", { length: 20 }).notNull(),
  description: text("description"),
  // Stored in pesewas (1 GHS = 100 pesewas) to avoid floating-point money bugs.
  customsValuePesewas: bigint("customs_value_pesewas", { mode: "number" }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: shipmentStatusEnum("status").notNull().default("booked"),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Tariff reference data & duty calculations
// ---------------------------------------------------------------------------

// Shared reference data, not organization-scoped. Maintained by an admin
// workflow (Phase 2), readable by every authenticated user.
export const tariffEntries = pgTable("tariff_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  hsCode: varchar("hs_code", { length: 20 }).notNull(),
  description: text("description").notNull(),
  ratePercent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dutyCalculations = pgTable("duty_calculations", {
  id: uuid("id").defaultRandom().primaryKey(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  tariffEntryId: uuid("tariff_entry_id").references(() => tariffEntries.id),
  hsCode: varchar("hs_code", { length: 20 }).notNull(),
  ratePercentApplied: numeric("rate_percent_applied", {
    precision: 5,
    scale: 2,
  }).notNull(),
  computedDutyPesewas: bigint("computed_duty_pesewas", {
    mode: "number",
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Documents & audit log
// ---------------------------------------------------------------------------

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  docType: docTypeEnum("doc_type").notNull().default("other"),
  filePath: text("file_path").notNull(), // path within Supabase Storage bucket
  fileName: varchar("file_name", { length: 255 }).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// In-app notifications. Email delivery is a future addition -- see
// TradeFlow_PRD_v1.0.md Phase 3 -- once a provider is chosen; this table
// is the trigger point that a future email job would read from.
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  actorId: uuid("actor_id").references(() => profiles.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
