import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ─── Users ───────────────────────────────────────────────────────────────────
// Self-contained email + password auth. `openId` is a stable internal
// identifier (e.g. "local:<nanoid>" for new accounts, "imported:<id>" for
// accounts migrated off the previous OAuth provider). `passwordHash` is a
// scrypt hash (see server/_core/password.ts); it is null for imported accounts
// until the person sets a password.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  passwordHash: text("passwordHash"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Application ────────────────────────────────────────────────────────────

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),

  // Status
  status: text("status", {
    enum: ["draft", "submitted", "winner", "disqualified"],
  })
    .notNull()
    .default("draft"),

  // Part I — Business Information
  legalBusinessName: text("legalBusinessName"),
  dba: text("dba"),
  entityType: text("entityType", {
    enum: ["llc", "corporation", "sole_proprietorship", "nonprofit", "other"],
  }),
  entityTypeOther: text("entityTypeOther"),
  stateOfRegistration: text("stateOfRegistration"),
  dateOfFormation: text("dateOfFormation"),
  businessAddress: text("businessAddress"),
  repName: text("repName"),
  repTitle: text("repTitle"),
  email: text("email"),
  phone: text("phone"),
  businessDescription: text("businessDescription"),

  // Part II — Eligibility Certifications (all must be true to proceed)
  certMember: integer("certMember", { mode: "boolean" }).default(false),
  certRegistered: integer("certRegistered", { mode: "boolean" }).default(false),
  certBankAccount: integer("certBankAccount", { mode: "boolean" }).default(false),
  certNetProfit: integer("certNetProfit", { mode: "boolean" }).default(false),
  certNoW2: integer("certNoW2", { mode: "boolean" }).default(false),
  certBusinessPlan: integer("certBusinessPlan", { mode: "boolean" }).default(false),

  // Part III — Organizational Narratives
  customerImpactNarrative: text("customerImpactNarrative"),
  operatingHistory: text("operatingHistory"),
  founderNarrative: text("founderNarrative"),
  operationMode: text("operationMode", { enum: ["full_time", "part_time"] }),

  // Part IV — Use of Funds
  ninetyDayImpact: text("ninetyDayImpact"),

  // Part VI — Certifications & Signature
  certAccuracy: integer("certAccuracy", { mode: "boolean" }).default(false),
  certAgreement: integer("certAgreement", { mode: "boolean" }).default(false),
  certConsent: integer("certConsent", { mode: "boolean" }).default(false),
  certW9: integer("certW9", { mode: "boolean" }).default(false),
  signatureName: text("signatureName"),
  signatureDate: text("signatureDate"),

  // Timestamps
  submittedAt: integer("submittedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// ─── Budget Items (Part IV) ──────────────────────────────────────────────────

export const budgetItems = sqliteTable("budget_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("applicationId").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // stored in cents
  sortOrder: integer("sortOrder").default(0),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

// ─── Uploaded Files (Part V) ─────────────────────────────────────────────────

export const uploadedFiles = sqliteTable("uploaded_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("applicationId").notNull(),
  fileType: text("fileType", {
    enum: ["formation_doc", "bank_account", "profit_loss", "business_plan"],
  }).notNull(),
  originalName: text("originalName").notNull(),
  storageKey: text("storageKey").notNull(),
  storageUrl: text("storageUrl").notNull(),
  uploadedAt: integer("uploadedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

// ─── Evaluator Invites ───────────────────────────────────────────────────────
// Each invite is a magic-link token the admin sends to an evaluator.
// The evaluator clicks the link, gets a session cookie, and can score
// applications. (This flow never depended on the OAuth provider.)

export const evaluatorInvites = sqliteTable("evaluator_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  isRevoked: integer("isRevoked", { mode: "boolean" }).notNull().default(false),
  acceptedAt: integer("acceptedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EvaluatorInvite = typeof evaluatorInvites.$inferSelect;
export type InsertEvaluatorInvite = typeof evaluatorInvites.$inferInsert;

// ─── Evaluator Scores ─────────────────────────────────────────────────────────
// One row per (evaluator, application) pair.
// Rubric: 100 points total across 5 categories.

export const evaluatorScores = sqliteTable("evaluator_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inviteId: integer("inviteId").notNull(), // FK → evaluator_invites.id
  applicationId: integer("applicationId").notNull(), // FK → applications.id

  scoreCustomerImpact: integer("scoreCustomerImpact").notNull().default(0), // /25
  scoreOperatingHistory: integer("scoreOperatingHistory").notNull().default(0), // /20
  scoreFounderNarrative: integer("scoreFounderNarrative").notNull().default(0), // /20
  scoreFundUse: integer("scoreFundUse").notNull().default(0), // /20
  scoreNinetyDayImpact: integer("scoreNinetyDayImpact").notNull().default(0), // /15

  notes: text("notes"),
  submittedAt: integer("submittedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type EvaluatorScore = typeof evaluatorScores.$inferSelect;
export type InsertEvaluatorScore = typeof evaluatorScores.$inferInsert;

// ─── Site Settings (singleton row, id=1) ────────────────────────────────────

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey(),
  announcementEnabled: integer("announcementEnabled", { mode: "boolean" })
    .notNull()
    .default(false),
  announcementBusinessName: text("announcementBusinessName"),
  announcementMessage: text("announcementMessage"),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
