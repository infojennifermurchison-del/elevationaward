import { and, avg, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  applications,
  budgetItems,
  evaluatorInvites,
  evaluatorScores,
  siteSettings,
  uploadedFiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getOrCreateApplication(userId: number): Promise<Application> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  if (!db) return undefined;
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
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateApplication(
  id: number,
  data: Partial<InsertApplication>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getAllSubmittedApplications() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(applications)
    .where(
      and(
        // submitted OR winner
        eq(applications.status, "submitted")
      )
    )
    .orderBy(desc(applications.submittedAt));
}

export async function getAllApplicationsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      application: applications,
      user: users,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(
      and(
        eq(applications.status, "submitted")
      )
    )
    .orderBy(desc(applications.submittedAt));
}

export async function getAllApplicationsForAdminAll() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      application: applications,
      user: users,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .orderBy(desc(applications.createdAt));
}

// ─── Budget Items ─────────────────────────────────────────────────────────────

export async function getBudgetItems(applicationId: number): Promise<BudgetItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.applicationId, applicationId))
    .orderBy(budgetItems.sortOrder);
}

export async function replaceBudgetItems(
  applicationId: number,
  items: { description: string; amount: number; sortOrder: number }[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  if (!db) return [];
  return db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.applicationId, applicationId));
}

export async function upsertUploadedFile(data: InsertUploadedFile): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove existing file of same type for this application
  await db
    .delete(uploadedFiles)
    .where(
      and(
        eq(uploadedFiles.applicationId, data.applicationId),
        eq(uploadedFiles.fileType, data.fileType)
      )
    );
  await db.insert(uploadedFiles).values(data);
}

export async function getApplicationCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.status, "submitted"));
  return result.length;
}

// ─── Evaluator Invites ───────────────────────────────────────────────────────────────────────────

export async function createEvaluatorInvite(data: InsertEvaluatorInvite): Promise<EvaluatorInvite> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(evaluatorInvites).values(data);
  const result = await db
    .select()
    .from(evaluatorInvites)
    .where(eq(evaluatorInvites.token, data.token))
    .limit(1);
  return result[0]!;
}

export async function getEvaluatorInviteByToken(token: string): Promise<EvaluatorInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(evaluatorInvites)
    .where(eq(evaluatorInvites.token, token))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getAllEvaluatorInvites(): Promise<EvaluatorInvite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluatorInvites).orderBy(desc(evaluatorInvites.createdAt));
}

export async function markInviteAccepted(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(evaluatorInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(evaluatorInvites.token, token));
}

export async function revokeEvaluatorInvite(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(evaluatorInvites).set({ isRevoked: true }).where(eq(evaluatorInvites.id, id));
}

// ─── Evaluator Scores ───────────────────────────────────────────────────────────────────────────

export async function upsertEvaluatorScore(data: InsertEvaluatorScore): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if score exists for this (inviteId, applicationId) pair
  const existing = await db
    .select()
    .from(evaluatorScores)
    .where(
      and(
        eq(evaluatorScores.inviteId, data.inviteId),
        eq(evaluatorScores.applicationId, data.applicationId)
      )
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
  if (!db) return [];
  return db
    .select({
      score: evaluatorScores,
      evaluator: evaluatorInvites,
    })
    .from(evaluatorScores)
    .innerJoin(evaluatorInvites, eq(evaluatorScores.inviteId, evaluatorInvites.id))
    .where(eq(evaluatorScores.applicationId, applicationId));
}

export async function getScoreByInviteAndApplication(
  inviteId: number,
  applicationId: number
): Promise<EvaluatorScore | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(evaluatorScores)
    .where(
      and(
        eq(evaluatorScores.inviteId, inviteId),
        eq(evaluatorScores.applicationId, applicationId)
      )
    )
    .limit(1);
  return result[0] ?? undefined;
}

export async function getScoresByInviteId(inviteId: number): Promise<EvaluatorScore[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(evaluatorScores)
    .where(eq(evaluatorScores.inviteId, inviteId));
}

// Returns submitted applications with their average total score, ranked
export async function getApplicationsRanked() {
  const db = await getDb();
  if (!db) return [];

  // Get all submitted/winner applications with user info
  const apps = await db
    .select({ application: applications, user: users })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(eq(applications.status, "submitted"))
    .orderBy(desc(applications.submittedAt));

  if (apps.length === 0) return [];

  // Get all scores
  const allScores = await db.select().from(evaluatorScores);

  // Compute average total per application
  const result = apps.map(({ application, user }) => {
    const appScores = allScores.filter((s) => s.applicationId === application.id);
    const total = appScores.length === 0
      ? null
      : appScores.reduce((sum, s) =>
          sum + s.scoreCustomerImpact + s.scoreOperatingHistory +
          s.scoreFounderNarrative + s.scoreFundUse + s.scoreNinetyDayImpact, 0
        ) / appScores.length;
    return { application, user, averageScore: total, scoreCount: appScores.length };
  });

  // Sort by average score descending (null scores go last)
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
  if (!db) return null;
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function updateSiteSettings(data: {
  announcementEnabled: boolean;
  announcementBusinessName?: string | null;
  announcementMessage?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(siteSettings)
    .values({ id: 1, ...data })
    .onDuplicateKeyUpdate({ set: data });
}
