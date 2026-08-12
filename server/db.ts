import { and, desc, eq } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  Application,
  BudgetItem,
  EvaluatorInvite,
  EvaluatorScore,
  InsertApplication,
  InsertBudgetItem,
  InsertEvaluatorInvite,
  InsertEvaluatorScore,
  InsertUploadedFile,
  InsertUser,
  SiteSettings,
  UploadedFile,
  User,
  applications,
  budgetItems,
  evaluatorInvites,
  evaluatorScores,
  siteSettings,
  uploadedFiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: BetterSQLite3Database | null = null;
let _sqlite: Database.Database | null = null;

// Open the SQLite database (creating the file/dir if needed) and ensure the
// schema exists. better-sqlite3 is synchronous; the async signatures here are
// kept so callers don't change.
export function getRawDb(): Database.Database {
  if (!_sqlite) {
    fs.mkdirSync(path.dirname(ENV.databaseFile), { recursive: true });
    _sqlite = new Database(ENV.databaseFile);
    // DELETE journal (not WAL) keeps the whole database in the single app.db
    // file — no -wal/-shm side files — so backup and restore are just that one
    // file. At this scale WAL's concurrency benefit is irrelevant.
    _sqlite.pragma("journal_mode = DELETE");
    _sqlite.pragma("foreign_keys = ON");
  }
  return _sqlite;
}

export async function getDb(): Promise<BetterSQLite3Database> {
  if (!_db) {
    _db = drizzle(getRawDb());
  }
  return _db;
}

// Create tables if they don't exist yet. Called once at server startup.
// Kept as plain SQL (idempotent) so a fresh machine needs no migration step.
export function ensureSchema(): void {
  const db = getRawDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      passwordHash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastSignedIn INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      legalBusinessName TEXT,
      dba TEXT,
      entityType TEXT,
      entityTypeOther TEXT,
      stateOfRegistration TEXT,
      dateOfFormation TEXT,
      businessAddress TEXT,
      repName TEXT,
      repTitle TEXT,
      email TEXT,
      phone TEXT,
      businessDescription TEXT,
      certMember INTEGER DEFAULT 0,
      certRegistered INTEGER DEFAULT 0,
      certBankAccount INTEGER DEFAULT 0,
      certNetProfit INTEGER DEFAULT 0,
      certNoW2 INTEGER DEFAULT 0,
      certBusinessPlan INTEGER DEFAULT 0,
      customerImpactNarrative TEXT,
      operatingHistory TEXT,
      founderNarrative TEXT,
      operationMode TEXT,
      ninetyDayImpact TEXT,
      certAccuracy INTEGER DEFAULT 0,
      certAgreement INTEGER DEFAULT 0,
      certConsent INTEGER DEFAULT 0,
      certW9 INTEGER DEFAULT 0,
      signatureName TEXT,
      signatureDate TEXT,
      submittedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      sortOrder INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      fileType TEXT NOT NULL,
      originalName TEXT NOT NULL,
      storageKey TEXT NOT NULL,
      storageUrl TEXT NOT NULL,
      uploadedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluator_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      isRevoked INTEGER NOT NULL DEFAULT 0,
      acceptedAt INTEGER,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluator_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviteId INTEGER NOT NULL,
      applicationId INTEGER NOT NULL,
      scoreCustomerImpact INTEGER NOT NULL DEFAULT 0,
      scoreOperatingHistory INTEGER NOT NULL DEFAULT 0,
      scoreFounderNarrative INTEGER NOT NULL DEFAULT 0,
      scoreFundUse INTEGER NOT NULL DEFAULT 0,
      scoreNinetyDayImpact INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      submittedAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY,
      announcementEnabled INTEGER NOT NULL DEFAULT 0,
      announcementBusinessName TEXT,
      announcementMessage TEXT,
      updatedAt INTEGER NOT NULL
    );
  `);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();

  const now = new Date();
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    passwordHash: user.passwordHash ?? null,
    role: user.role ?? "user",
    lastSignedIn: user.lastSignedIn ?? now,
    createdAt: now,
    updatedAt: now,
  };

  const updateSet: Record<string, unknown> = {};
  const maybe = (k: keyof InsertUser) => {
    if (user[k] !== undefined) updateSet[k] = user[k] ?? null;
  };
  (["name", "email", "loginMethod", "passwordHash", "role", "lastSignedIn"] as const).forEach(maybe);
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = now;

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const all = await db.select().from(users);
  return all.find((u) => (u.email ?? "").trim().toLowerCase() === normalized);
}

export async function createUser(data: {
  openId: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  role?: "user" | "admin";
}): Promise<User> {
  const db = await getDb();
  const now = new Date();
  await db.insert(users).values({
    openId: data.openId,
    email: data.email,
    name: data.name ?? null,
    passwordHash: data.passwordHash,
    loginMethod: "password",
    role: data.role ?? "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  });
  const created = await getUserByOpenId(data.openId);
  return created!;
}

export async function setUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function touchUserSignIn(userId: number): Promise<void> {
  const db = await getDb();
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getOrCreateApplication(userId: number): Promise<Application> {
  const db = await getDb();

  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.status, "draft")))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(applications).values({ userId });
  const created = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt))
    .limit(1);

  return created[0]!;
}

export async function getApplicationByUserId(userId: number): Promise<Application | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getApplicationById(id: number): Promise<Application | undefined> {
  const db = await getDb();
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateApplication(
  id: number,
  data: Partial<InsertApplication>,
): Promise<void> {
  const db = await getDb();
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getAllApplicationsForAdminAll() {
  const db = await getDb();
  return db
    .select({ application: applications, user: users })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .orderBy(desc(applications.createdAt));
}

// ─── Budget Items ─────────────────────────────────────────────────────────────

export async function getBudgetItems(applicationId: number): Promise<BudgetItem[]> {
  const db = await getDb();
  return db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.applicationId, applicationId))
    .orderBy(budgetItems.sortOrder);
}

export async function replaceBudgetItems(
  applicationId: number,
  items: { description: string; amount: number; sortOrder: number }[],
): Promise<void> {
  const db = await getDb();
  await db.delete(budgetItems).where(eq(budgetItems.applicationId, applicationId));
  if (items.length > 0) {
    const rows: InsertBudgetItem[] = items.map((item) => ({
      applicationId,
      description: item.description,
      amount: item.amount,
      sortOrder: item.sortOrder,
    }));
    await db.insert(budgetItems).values(rows);
  }
}

// ─── Uploaded Files ───────────────────────────────────────────────────────────

export async function getUploadedFiles(applicationId: number): Promise<UploadedFile[]> {
  const db = await getDb();
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.applicationId, applicationId));
}

export async function upsertUploadedFile(data: InsertUploadedFile): Promise<void> {
  const db = await getDb();
  await db
    .delete(uploadedFiles)
    .where(
      and(
        eq(uploadedFiles.applicationId, data.applicationId),
        eq(uploadedFiles.fileType, data.fileType),
      ),
    );
  await db.insert(uploadedFiles).values(data);
}

export async function getUploadedFileByKey(storageKey: string): Promise<UploadedFile | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.storageKey, storageKey))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getApplicationCount(): Promise<number> {
  const db = await getDb();
  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.status, "submitted"));
  return result.length;
}

// ─── Evaluator Invites ─────────────────────────────────────────────────────────

export async function createEvaluatorInvite(
  data: InsertEvaluatorInvite,
): Promise<EvaluatorInvite> {
  const db = await getDb();
  await db.insert(evaluatorInvites).values(data);
  const result = await db
    .select()
    .from(evaluatorInvites)
    .where(eq(evaluatorInvites.token, data.token))
    .limit(1);
  return result[0]!;
}

export async function getEvaluatorInviteByToken(
  token: string,
): Promise<EvaluatorInvite | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(evaluatorInvites)
    .where(eq(evaluatorInvites.token, token))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getAllEvaluatorInvites(): Promise<EvaluatorInvite[]> {
  const db = await getDb();
  return db.select().from(evaluatorInvites).orderBy(desc(evaluatorInvites.createdAt));
}

export async function markInviteAccepted(token: string): Promise<void> {
  const db = await getDb();
  await db
    .update(evaluatorInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(evaluatorInvites.token, token));
}

export async function revokeEvaluatorInvite(id: number): Promise<void> {
  const db = await getDb();
  await db.update(evaluatorInvites).set({ isRevoked: true }).where(eq(evaluatorInvites.id, id));
}

// ─── Evaluator Scores ─────────────────────────────────────────────────────────

export async function upsertEvaluatorScore(data: InsertEvaluatorScore): Promise<void> {
  const db = await getDb();
  const existing = await db
    .select()
    .from(evaluatorScores)
    .where(
      and(
        eq(evaluatorScores.inviteId, data.inviteId),
        eq(evaluatorScores.applicationId, data.applicationId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(evaluatorScores)
      .set({
        scoreCustomerImpact: data.scoreCustomerImpact,
        scoreOperatingHistory: data.scoreOperatingHistory,
        scoreFounderNarrative: data.scoreFounderNarrative,
        scoreFundUse: data.scoreFundUse,
        scoreNinetyDayImpact: data.scoreNinetyDayImpact,
        notes: data.notes,
      })
      .where(eq(evaluatorScores.id, existing[0].id));
  } else {
    await db.insert(evaluatorScores).values(data);
  }
}

export async function getScoresForApplication(applicationId: number) {
  const db = await getDb();
  return db
    .select({ score: evaluatorScores, evaluator: evaluatorInvites })
    .from(evaluatorScores)
    .innerJoin(evaluatorInvites, eq(evaluatorScores.inviteId, evaluatorInvites.id))
    .where(eq(evaluatorScores.applicationId, applicationId));
}

export async function getScoreByInviteAndApplication(
  inviteId: number,
  applicationId: number,
): Promise<EvaluatorScore | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(evaluatorScores)
    .where(
      and(
        eq(evaluatorScores.inviteId, inviteId),
        eq(evaluatorScores.applicationId, applicationId),
      ),
    )
    .limit(1);
  return result[0] ?? undefined;
}

export async function getScoresByInviteId(inviteId: number): Promise<EvaluatorScore[]> {
  const db = await getDb();
  return db.select().from(evaluatorScores).where(eq(evaluatorScores.inviteId, inviteId));
}

// Returns submitted applications with their average total score, ranked.
export async function getApplicationsRanked() {
  const db = await getDb();

  const apps = await db
    .select({ application: applications, user: users })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(eq(applications.status, "submitted"))
    .orderBy(desc(applications.submittedAt));

  if (apps.length === 0) return [];

  const allScores = await db.select().from(evaluatorScores);

  const result = apps.map(({ application, user }) => {
    const appScores = allScores.filter((s) => s.applicationId === application.id);
    const total =
      appScores.length === 0
        ? null
        : appScores.reduce(
            (sum, s) =>
              sum +
              s.scoreCustomerImpact +
              s.scoreOperatingHistory +
              s.scoreFounderNarrative +
              s.scoreFundUse +
              s.scoreNinetyDayImpact,
            0,
          ) / appScores.length;
    return { application, user, averageScore: total, scoreCount: appScores.length };
  });

  result.sort((a, b) => {
    if (a.averageScore === null && b.averageScore === null) return 0;
    if (a.averageScore === null) return 1;
    if (b.averageScore === null) return -1;
    return b.averageScore - a.averageScore;
  });

  return result;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const db = await getDb();
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function updateSiteSettings(data: {
  announcementEnabled: boolean;
  announcementBusinessName?: string | null;
  announcementMessage?: string | null;
}): Promise<void> {
  const db = await getDb();
  await db
    .insert(siteSettings)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: siteSettings.id, set: data });
}
