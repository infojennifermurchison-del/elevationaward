import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Application ────────────────────────────────────────────────────────────

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Status
  status: mysqlEnum("status", ["draft", "submitted", "winner", "disqualified"])
    .default("draft")
    .notNull(),

  // Part I — Business Information
  legalBusinessName: text("legalBusinessName"),
  dba: text("dba"),
  entityType: mysqlEnum("entityType", [
    "llc",
    "corporation",
    "sole_proprietorship",
    "nonprofit",
    "other",
  ]),
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
  certMember: boolean("certMember").default(false),
  certRegistered: boolean("certRegistered").default(false),
  certBankAccount: boolean("certBankAccount").default(false),
  certNetProfit: boolean("certNetProfit").default(false),
  certNoW2: boolean("certNoW2").default(false),
  certBusinessPlan: boolean("certBusinessPlan").default(false),

  // Part III — Organizational Narratives
  customerImpactNarrative: text("customerImpactNarrative"),
  operatingHistory: text("operatingHistory"),
  founderNarrative: text("founderNarrative"),
  operationMode: mysqlEnum("operationMode", ["full_time", "part_time"]),

  // Part IV — Use of Funds
  ninetyDayImpact: text("ninetyDayImpact"),

  // Part VI — Certifications & Signature
  certAccuracy: boolean("certAccuracy").default(false),
  certAgreement: boolean("certAgreement").default(false),
  certConsent: boolean("certConsent").default(false),
  certW9: boolean("certW9").default(false),
  signatureName: text("signatureName"),
  signatureDate: text("signatureDate"),

  // Timestamps
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// ─── Budget Items (Part IV) ──────────────────────────────────────────────────

export const budgetItems = mysqlTable("budget_items", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  description: text("description").notNull(),
  amount: int("amount").notNull(), // stored in cents
  sortOrder: int("sortOrder").default(0),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

// ─── Uploaded Files (Part V) ─────────────────────────────────────────────────

export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  fileType: mysqlEnum("fileType", [
    "formation_doc",
    "bank_account",
    "profit_loss",
    "business_plan",
  ]).notNull(),
  originalName: text("originalName").notNull(),
  storageKey: text("storageKey").notNull(),
  storageUrl: text("storageUrl").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

// ─── Evaluator Invites ────────────────────────────────────────────────────────────────────────────
// Each invite is a magic-link token the admin sends to an evaluator.
// The evaluator clicks the link, gets a session cookie, and can score applications.

export const evaluatorInvites = mysqlTable("evaluator_invites", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name").notNull(),
  isRevoked: boolean("isRevoked").default(false).notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluatorInvite = typeof evaluatorInvites.$inferSelect;
export type InsertEvaluatorInvite = typeof evaluatorInvites.$inferInsert;

// ─── Evaluator Scores ───────────────────────────────────────────────────────────────────────────
// One row per (evaluator, application) pair.
// Rubric: 100 points total across 5 categories (matching the official scoring).

export const evaluatorScores = mysqlTable("evaluator_scores", {
  id: int("id").autoincrement().primaryKey(),
  inviteId: int("inviteId").notNull(),       // FK → evaluator_invites.id
  applicationId: int("applicationId").notNull(), // FK → applications.id

  // Rubric categories (max points per category)
  scoreCustomerImpact: int("scoreCustomerImpact").default(0).notNull(),   // /25
  scoreOperatingHistory: int("scoreOperatingHistory").default(0).notNull(), // /20
  scoreFounderNarrative: int("scoreFounderNarrative").default(0).notNull(), // /20
  scoreFundUse: int("scoreFundUse").default(0).notNull(),                   // /20
  scoreNinetyDayImpact: int("scoreNinetyDayImpact").default(0).notNull(),   // /15

  notes: text("notes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluatorScore = typeof evaluatorScores.$inferSelect;
export type InsertEvaluatorScore = typeof evaluatorScores.$inferInsert;

// ─── Site Settings (singleton row, id=1) ────────────────────────────────────
// Stores global toggles like the winner announcement banner.

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").primaryKey().default(1),
  announcementEnabled: boolean("announcementEnabled").default(false).notNull(),
  announcementBusinessName: text("announcementBusinessName"),
  announcementMessage: text("announcementMessage"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
